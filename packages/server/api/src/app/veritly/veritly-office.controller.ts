import { apId, EnginePrincipal } from '@activepieces/shared'
import type { OfficeRouteName } from '@veritly/contracts/client'
import { officeRoutes, routeErrorSchema } from '@veritly/contracts/client'
import { responses, strict } from '@veritly/contracts/zod'
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

const OfficeRegistration = strict.OfficeWorkerRegistration
const RegisterOfficeWebhook = strict.OfficeWorkerRegister
const OfficeDelivery = strict.OfficeWorkerDelivery
const OfficeAccepted = strict.OfficeWorkerAccepted
const EffectAttempt = strict.OfficeWorkerEffectAttempt
const EffectDecision = strict.OfficeWorkerEffectDecision
const EffectComplete = strict.OfficeWorkerEffectComplete
const EffectUnknown = strict.OfficeWorkerEffectUnknown

export const veritlyOfficeController: FastifyPluginAsyncZod = async (app) => {
    app.get('/worker/office/files', worker({
        response: officeResponse('office_worker_files', strict.OfficeFilePage),
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
        response: officeResponse('office_worker_register', OfficeRegistration, StatusCodes.CREATED),
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
        response: officeResponse('office_worker_unregister', z.undefined(), StatusCodes.NO_CONTENT),
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
        response: officeResponse('office_worker_event', OfficeAccepted, StatusCodes.ACCEPTED),
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
        response: officeResponse('office_worker_effect_attempt', EffectDecision),
    }), async (request, reply) => {
        if (!runScope(principal(request), request.body.runId)) {
            return reply.status(StatusCodes.FORBIDDEN).send({ code: 'binding_invalid' as const })
        }
        const path = effectPath(request.body.path)
        if (!path) return reply.status(StatusCodes.REQUEST_TOO_LONG).send({ code: 'worker_payload_too_large' as const })
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
            const issue = effectIssue(error)
            if (issue) return reply.status(issue.status).send({ code: issue.code })
            throw error
        }
    })

    app.post('/worker/office/effects/complete', worker({
        body: EffectComplete,
        response: officeResponse('office_worker_effect_complete', strict.OfficeWorkerOkay),
    }), async (request, reply) => {
        if (!runScope(principal(request), request.body.runId)) {
            return reply.status(StatusCodes.FORBIDDEN).send({ code: 'binding_invalid' as const })
        }
        const path = effectPath(request.body.path)
        if (!path) return reply.status(StatusCodes.REQUEST_TOO_LONG).send({ code: 'worker_payload_too_large' as const })
        const output = JSON.stringify(request.body.output)
        if (output === undefined || Buffer.byteLength(output) > 262_144) {
            return reply.status(StatusCodes.REQUEST_TOO_LONG).send({ code: 'worker_payload_too_large' as const })
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
            const issue = effectIssue(error)
            if (issue) return reply.status(issue.status).send({ code: issue.code })
            throw error
        }
    })

    app.post('/worker/office/effects/unknown', worker({
        body: EffectUnknown,
        response: officeResponse('office_worker_effect_unknown', strict.OfficeWorkerOkay),
    }), async (request, reply) => {
        if (!runScope(principal(request), request.body.runId)) {
            return reply.status(StatusCodes.FORBIDDEN).send({ code: 'binding_invalid' as const })
        }
        const path = effectPath(request.body.path)
        if (!path) return reply.status(StatusCodes.REQUEST_TOO_LONG).send({ code: 'worker_payload_too_large' as const })
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
            const issue = effectIssue(error)
            if (issue) return reply.status(issue.status).send({ code: issue.code })
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

function officeResponse(route: OfficeRouteName, ok: z.ZodType, status = StatusCodes.OK) {
    const errors = officeRoutes[route].errors
    if (!errors) throw new Error(`Office worker route ${route} has no error contract`)
    return Object.fromEntries([
        [status, ok],
        ...[...new Set(errors.owned.map((error) => error.status))]
            .map((status) => [status, routeErrorSchema('office', route, status)]),
    ])
}

function effectIssue(error: unknown) {
    if (error instanceof OfficeEffectLeaseError || error instanceof OfficeEffectScopeError) {
        return { code: 'effect_scope_rejected' as const, status: StatusCodes.FORBIDDEN }
    }
    if (
        error instanceof OfficeEffectConflictError
        || error instanceof OfficeEffectLimitError
        || error instanceof OfficeEffectOutcomeUnknownError
        || error instanceof OfficeEffectPolicyError
    ) return { code: 'effect_conflict' as const, status: StatusCodes.CONFLICT }
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
