import { apId, EnginePrincipal } from '@activepieces/shared'
import { responses } from '@veritly/contracts/zod'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { exactJson } from './office/exact-json'
import {
    OfficeEffectConflictError,
    OfficeEffectLeaseError,
    OfficeEffectLimitError,
    OfficeEffectOutcomeUnknownError,
    OfficeEffectPolicyError,
    OfficeEffectScopeError,
    officeEffect,
} from './office/office-effect-service'
import {
    OfficeInboxBindingError,
    OfficeInboxConflictError,
    officeInbox,
    requestHash,
} from './office/office-inbox-service'
import { JsonValue } from './office/office-inbox-entity'
import { officeOutbox } from './office/office-outbox'
import { webhook } from './veritly-edge'
import {
    content,
    destination,
    files,
    hook,
    registrationKey,
    unhook,
    verify,
} from './veritly-office.service'

const LocalCode = z.enum([
    'binding_conflict',
    'binding_invalid',
    'effect_rejected',
    'event_conflict',
    'payload_too_large',
    'request_invalid',
])
const LocalError = z.object({ code: LocalCode }).strict()
const WorkerError = z.union([responses.OfficeApiError, LocalError])
const Id = z.string().min(1).max(128)
const OfficeRegistration = z.object({
    flowId: Id,
    flowVersionId: Id,
    trigger: Id,
    destinationId: Id,
    registrationId: Id,
    webhookId: Id,
}).strict()
const RegisterOfficeWebhook = z.object({
    endpoint: z.string().url().max(2048),
    event: responses.OfficeAutomationEvent,
    fileId: z.string().min(40).max(80),
    sheetId: z.string().min(1).max(256),
    flowId: Id,
    flowVersionId: Id,
    trigger: Id,
}).strict()
const OfficeDelivery = OfficeRegistration.extend({
    eventId: z.string().min(40).max(80),
    timestamp: z.string().regex(/^(0|[1-9][0-9]{0,15})$/).refine((value) => Number.isSafeInteger(Number(value))),
    signature: z.string().regex(/^[A-Za-z0-9+/]{43}=$/),
    bodyBase64: z.string().max(87_384).regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
}).strict()
const OfficeAccepted = z.object({ runId: Id }).strict()
const EffectPolicy = z.enum(['pure', 'idempotent', 'reconcilable', 'non_idempotent'])
const EffectScope = z.object({
    runId: Id,
    step: Id,
    path: z.array(z.tuple([Id, z.number().int().min(0).max(1_000_000)])).max(32),
}).strict()
const EffectAttempt = EffectScope.extend({
    policy: EffectPolicy.optional(),
    inputHash: z.string().regex(/^[a-f0-9]{64}$/),
}).strict()
const EffectDecision = z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('untracked') }).strict(),
    z.object({ kind: z.literal('dispatch'), operationId: Id }).strict(),
    z.object({ kind: z.literal('reconcile'), operationId: Id }).strict(),
    z.object({ kind: z.literal('completed'), operationId: Id, output: z.unknown() }).strict(),
    z.object({ kind: z.literal('unknown'), operationId: Id }).strict(),
])
const EffectComplete = EffectScope.extend({
    policy: EffectPolicy,
    inputHash: z.string().regex(/^[a-f0-9]{64}$/),
    operationId: Id,
    output: z.unknown(),
}).strict()
const EffectUnknown = EffectScope.extend({ operationId: Id }).strict()

export const veritlyOfficeController: FastifyPluginAsyncZod = async (app) => {
    app.get('/worker/office/files', worker({
        response: officeResponse(responses.OfficeFilePage),
    }), async (request, reply) => {
        const out = await files(scope(request))
        if (out.kind === 'error') return reply.status(out.status).send(out.error)
        return out.value
    })

    app.get('/worker/office/documents/:documentId/content', {
        config: { security: securityAccess.engine() },
        schema: { params: z.object({ documentId: z.string().min(1) }) },
    }, async (request, reply) => {
        const out = await content({ ...scope(request), file: request.params.documentId })
        if (out.kind === 'error') return reply.status(out.status).send(out.error)
        if (out.disposition) void reply.header('Content-Disposition', out.disposition)
        return reply.type(out.type).status(out.status).send(out.value)
    })

    app.post('/worker/office/webhook-registrations', worker({
        body: RegisterOfficeWebhook,
        response: officeResponse(OfficeRegistration, StatusCodes.CREATED),
    }), async (request, reply) => {
        if (!flowScope(principal(request), request.body)
            || request.body.endpoint !== webhook(request.body.flowId)) {
            return reply.status(StatusCodes.FORBIDDEN).send({ code: 'binding_invalid' as const })
        }
        const ctx = scope(request)
        const planned = await officeInbox.plan({
            project: ctx.project,
            flow: request.body.flowId,
            version: request.body.flowVersionId,
            trigger: request.body.trigger,
            endpoint: request.body.endpoint,
            event: request.body.event,
            file: request.body.fileId,
            sheet: request.body.sheetId,
            generation: request.body.flowVersionId,
        }).catch((error: unknown) => {
            if (error instanceof OfficeInboxBindingError) return 'binding_invalid' as const
            if (error instanceof OfficeInboxConflictError) return 'binding_conflict' as const
            throw error
        })
        if (typeof planned === 'string') {
            const status = planned === 'binding_invalid' ? StatusCodes.FORBIDDEN : StatusCodes.CONFLICT
            return reply.status(status).send({ code: planned })
        }
        const created = await destination({
            ...ctx,
            key: registrationKey({
                project: ctx.project,
                flow: request.body.flowId,
                trigger: request.body.trigger,
                kind: 'destination',
            }),
            value: responses.OfficeDestinationCreateInput.parse({
                endpoint: request.body.endpoint,
                verification: 'office_managed',
            }),
        })
        if (created.kind === 'error') return reply.status(created.status).send(created.error)
        if (created.value.verification !== 'office_managed') throw new OfficeRegistrationModeError()
        const attached = await officeInbox.attach({
            ...planned,
            destination: created.value.destination.id,
            registration: created.value.registrationId,
        })
        const registered = await hook({
            ...ctx,
            key: registrationKey({
                project: ctx.project,
                flow: request.body.flowId,
                trigger: request.body.trigger,
                kind: 'hook',
            }),
            value: responses.OfficeWebhookInput.parse({
                event: request.body.event,
                fileId: request.body.fileId,
                sheetId: request.body.sheetId,
                destinationId: created.value.destination.id,
                generation: request.body.flowVersionId,
            }),
        })
        if (registered.kind === 'error') return reply.status(registered.status).send(registered.error)
        try {
            return reply.status(StatusCodes.CREATED).send(external(await officeInbox.bind({
                ...attached,
                webhook: registered.value.id,
            })))
        }
        catch (error) {
            if (error instanceof OfficeInboxBindingError) {
                return reply.status(StatusCodes.FORBIDDEN).send({ code: 'binding_invalid' as const })
            }
            if (error instanceof OfficeInboxConflictError) {
                return reply.status(StatusCodes.CONFLICT).send({ code: 'binding_conflict' as const })
            }
            throw error
        }
    })

    app.delete('/worker/office/webhook-registrations', worker({
        body: OfficeRegistration,
        response: officeResponse(z.undefined(), StatusCodes.NO_CONTENT),
    }), async (request, reply) => {
        const ctx = scope(request)
        const value = internal(request.body, principal(request))
        if (!value) return reply.status(StatusCodes.FORBIDDEN).send({ code: 'binding_invalid' as const })
        try {
            await officeInbox.revoke(value)
        }
        catch (error) {
            if (error instanceof OfficeInboxBindingError) {
                return reply.status(StatusCodes.FORBIDDEN).send({ code: 'binding_invalid' as const })
            }
            if (error instanceof OfficeInboxConflictError) {
                return reply.status(StatusCodes.CONFLICT).send({ code: 'binding_conflict' as const })
            }
            throw error
        }
        const removed = await unhook({ ...ctx, webhook: value.webhook })
        if (removed.kind === 'error' && removed.error.code !== 'webhook_not_found') {
            return reply.status(removed.status).send(removed.error)
        }
        try {
            await officeInbox.unbind(value)
        }
        catch (error) {
            if (error instanceof OfficeInboxConflictError) {
                return reply.status(StatusCodes.CONFLICT).send({ code: 'binding_conflict' as const })
            }
            throw error
        }
        return reply.status(StatusCodes.NO_CONTENT).send()
    })

    app.post('/worker/office/webhook-events', worker({
        body: OfficeDelivery,
        response: officeResponse(OfficeAccepted, StatusCodes.ACCEPTED),
    }), async (request, reply) => {
        const ctx = scope(request)
        const value = internal(request.body, principal(request))
        if (!value) return reply.status(StatusCodes.FORBIDDEN).send({ code: 'binding_invalid' as const })
        try {
            await officeInbox.resolve(value)
        }
        catch (error) {
            if (error instanceof OfficeInboxBindingError) {
                return reply.status(StatusCodes.FORBIDDEN).send({ code: 'binding_invalid' as const })
            }
            throw error
        }
        const checked = await verify({
            ...ctx,
            webhook: value.webhook,
            key: request.body.eventId,
            value: responses.OfficeWebhookVerifyInput.parse({
                destinationId: value.destination,
                registrationId: value.registration,
                eventId: request.body.eventId,
                timestamp: Number(request.body.timestamp),
                signature: request.body.signature,
                bodyBase64: request.body.bodyBase64,
            }),
        })
        if (checked.kind === 'error') return reply.status(checked.status).send(checked.error)
        try {
            const accepted = await officeInbox.accept({
                ...value,
                platform: principal(request).platform.id,
                event: request.body.eventId,
                hash: requestHash({
                    ...value,
                    event: request.body.eventId,
                    timestamp: request.body.timestamp,
                    signature: request.body.signature,
                    body: request.body.bodyBase64,
                }),
                payload: checked.value,
                output: checked.value.row,
            })
            void officeOutbox.wake()
            return reply.status(StatusCodes.ACCEPTED).send(accepted)
        }
        catch (error) {
            if (error instanceof OfficeInboxConflictError) {
                return reply.status(StatusCodes.CONFLICT).send({ code: 'event_conflict' as const })
            }
            throw error
        }
    })

    app.post('/worker/office/effects/attempt', worker({
        body: EffectAttempt,
        response: localResponse(EffectDecision),
    }), async (request, reply) => {
        if (!runScope(principal(request), request.body.runId)) {
            return reply.status(StatusCodes.FORBIDDEN).send({ code: 'binding_invalid' as const })
        }
        const path = effectPath(request.body.path)
        if (!path) return reply.status(StatusCodes.REQUEST_TOO_LONG).send({ code: 'payload_too_large' as const })
        try {
            return await officeEffect.attempt({
                id: apId(),
                runId: request.body.runId,
                claim: principal(request).claim,
                step: request.body.step,
                path,
                policy: request.body.policy,
                inputHash: request.body.inputHash,
            })
        }
        catch (error) {
            const status = effectStatus(error)
            if (status) return reply.status(status).send({ code: 'effect_rejected' as const })
            throw error
        }
    })

    app.post('/worker/office/effects/complete', worker({
        body: EffectComplete,
        response: localResponse(z.object({ ok: z.literal(true) }).strict()),
    }), async (request, reply) => {
        if (!runScope(principal(request), request.body.runId)) {
            return reply.status(StatusCodes.FORBIDDEN).send({ code: 'binding_invalid' as const })
        }
        const path = effectPath(request.body.path)
        if (!path) return reply.status(StatusCodes.REQUEST_TOO_LONG).send({ code: 'payload_too_large' as const })
        const output = JSON.stringify(request.body.output)
        if (output === undefined || Buffer.byteLength(output) > 262_144) {
            return reply.status(StatusCodes.REQUEST_TOO_LONG).send({ code: 'payload_too_large' as const })
        }
        try {
            await officeEffect.complete({
                runId: request.body.runId,
                claim: principal(request).claim,
                step: request.body.step,
                path,
                policy: request.body.policy,
                operationId: request.body.operationId,
                inputHash: request.body.inputHash,
                output: JSON.parse(output) as JsonValue,
            })
            return { ok: true as const }
        }
        catch (error) {
            const status = effectStatus(error)
            if (status) return reply.status(status).send({ code: 'effect_rejected' as const })
            throw error
        }
    })

    app.post('/worker/office/effects/unknown', worker({
        body: EffectUnknown,
        response: localResponse(z.object({ ok: z.literal(true) }).strict()),
    }), async (request, reply) => {
        if (!runScope(principal(request), request.body.runId)) {
            return reply.status(StatusCodes.FORBIDDEN).send({ code: 'binding_invalid' as const })
        }
        const path = effectPath(request.body.path)
        if (!path) return reply.status(StatusCodes.REQUEST_TOO_LONG).send({ code: 'payload_too_large' as const })
        try {
            await officeEffect.unknown({
                runId: request.body.runId,
                claim: principal(request).claim,
                step: request.body.step,
                path,
                operationId: request.body.operationId,
            })
            return { ok: true as const }
        }
        catch (error) {
            const status = effectStatus(error)
            if (status) return reply.status(status).send({ code: 'effect_rejected' as const })
            throw error
        }
    })
}

function worker<const T extends WorkerSchema>(schema: T) {
    return {
        config: { security: securityAccess.engine(), rawBody: Boolean(schema.body) },
        schema,
        preValidation: async (request: FastifyRequest, reply: FastifyReply) => {
            if (!schema.body || exactJson(request.rawBody)) return
            return reply.status(StatusCodes.BAD_REQUEST).send({ code: 'request_invalid' })
        },
    }
}

function officeResponse(ok: z.ZodType, status = StatusCodes.OK) {
    return {
        [status]: ok,
        [StatusCodes.BAD_REQUEST]: WorkerError,
        [StatusCodes.UNAUTHORIZED]: WorkerError,
        [StatusCodes.FORBIDDEN]: WorkerError,
        [StatusCodes.NOT_FOUND]: WorkerError,
        [StatusCodes.CONFLICT]: WorkerError,
        [StatusCodes.REQUEST_TIMEOUT]: WorkerError,
        [StatusCodes.REQUEST_TOO_LONG]: WorkerError,
        [StatusCodes.SERVICE_UNAVAILABLE]: WorkerError,
        [StatusCodes.GATEWAY_TIMEOUT]: WorkerError,
    }
}

function localResponse(ok: z.ZodType) {
    return {
        [StatusCodes.OK]: ok,
        [StatusCodes.BAD_REQUEST]: LocalError,
        [StatusCodes.FORBIDDEN]: LocalError,
        [StatusCodes.CONFLICT]: LocalError,
        [StatusCodes.REQUEST_TOO_LONG]: LocalError,
    }
}

function effectStatus(error: unknown) {
    if (error instanceof OfficeEffectLeaseError || error instanceof OfficeEffectScopeError) return StatusCodes.FORBIDDEN
    if (
        error instanceof OfficeEffectConflictError
        || error instanceof OfficeEffectLimitError
        || error instanceof OfficeEffectOutcomeUnknownError
        || error instanceof OfficeEffectPolicyError
    ) return StatusCodes.CONFLICT
    return undefined
}

function scope(request: FastifyRequest) {
    return { log: request.log, project: principal(request).projectId }
}

function principal(request: FastifyRequest) {
    return (request as FastifyRequest & { principal: EnginePrincipal }).principal
}

function internal(input: z.infer<typeof OfficeRegistration>, principal: EnginePrincipal) {
    if (!flowScope(principal, input)) return
    return {
        project: principal.projectId,
        flow: input.flowId,
        version: input.flowVersionId,
        trigger: input.trigger,
        destination: input.destinationId,
        registration: input.registrationId,
        webhook: input.webhookId,
    }
}

function flowScope(
    principal: EnginePrincipal,
    input: { flowId: string; flowVersionId: string },
) {
    return principal.scope.kind === 'flow'
        && principal.scope.flowId === input.flowId
        && principal.scope.flowVersionId === input.flowVersionId
}

function runScope(principal: EnginePrincipal, run: string) {
    return principal.scope.kind === 'flow' && principal.scope.runId === run && principal.id === run
}

function effectPath(input: ReadonlyArray<readonly [string, number]>) {
    const path = JSON.stringify(input)
    return Buffer.byteLength(path) <= 1024 ? path : undefined
}

function external(input: Awaited<ReturnType<typeof officeInbox.bind>>) {
    return {
        flowId: input.flow,
        flowVersionId: input.version,
        trigger: input.trigger,
        destinationId: input.destination,
        registrationId: input.registration,
        webhookId: input.webhook,
    }
}

type WorkerSchema = {
    params?: z.ZodTypeAny
    body?: z.ZodTypeAny
    response: Record<number, z.ZodTypeAny>
}

class OfficeRegistrationModeError extends Error {}
