import { AuthenticationResponse, FlowOperationRequest, FlowOperationType, FlowVersionState } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { flowService } from '../flows/flow/flow.service'
import {
    getVeritlyContext,
    getVeritlyProject,
    getVeritlySessionResponse,
    resolveVeritlySession,
} from './veritly-auth'

const ErrorResponse = z.object({ error: z.string() })
const Automation = z.object({ path: z.string(), flowId: z.string(), displayName: z.string() })
const Automations = z.object({ automations: z.array(Automation) })
export const veritlyAutomationController: FastifyPluginAsyncZod = async (app) => {
    app.get('/session', {
        schema: {
            response: {
                [StatusCodes.OK]: AuthenticationResponse,
                [StatusCodes.BAD_REQUEST]: ErrorResponse,
                [StatusCodes.UNAUTHORIZED]: ErrorResponse,
                [StatusCodes.SERVICE_UNAVAILABLE]: ErrorResponse,
            },
        },
    }, async (request, reply) => {
        const session = await getVeritlySessionResponse({ request, reply, log: request.log })
        if (!session.ok) return reply.send(session.body)
        return session.body
    })

    app.get('/automations', {
        schema: {
            response: {
                [StatusCodes.OK]: Automations,
                [StatusCodes.BAD_REQUEST]: ErrorResponse,
                [StatusCodes.UNAUTHORIZED]: ErrorResponse,
                [StatusCodes.SERVICE_UNAVAILABLE]: ErrorResponse,
            },
        },
    }, async (request, reply) => {
        const session = await resolveVeritlySession({ request, reply })
        if (!session.ok) return reply.send(session.body)

        const veritlyProjectId = session.user.projectId

        const project = await getVeritlyProject({
            log: request.log,
            user: session.user,
            veritlyProjectId,
        })
        const page = await flowService(request.log).list({
            projectIds: [project.id],
            versionState: FlowVersionState.DRAFT,
            includeTriggerSource: false,
        })
        const automations = page.data
            .map((flow) => {
                const path = flowPath(flow, veritlyProjectId)
                if (!path) return
                return {
                    path,
                    flowId: flow.id,
                    displayName: flow.version.displayName,
                }
            })
            .filter((item): item is z.infer<typeof Automation> => Boolean(item))

        return { automations }
    })

    app.post('/automations', {
        schema: {
            body: z.object({
                path: z.string().min(1),
                displayName: z.string().min(1),
            }),
            response: {
                [StatusCodes.CREATED]: z.object({
                    path: z.string(),
                    flowId: z.string(),
                    displayName: z.string(),
                }),
                [StatusCodes.BAD_REQUEST]: ErrorResponse,
                [StatusCodes.UNAUTHORIZED]: ErrorResponse,
                [StatusCodes.SERVICE_UNAVAILABLE]: ErrorResponse,
            },
        },
    }, async (request, reply) => {
        const session = await resolveVeritlySession({ request, reply })
        if (!session.ok) return reply.send(session.body)

        const veritlyProjectId = session.user.projectId

        const project = await getVeritlyProject({
            log: request.log,
            user: session.user,
            veritlyProjectId,
        })
        const page = await flowService(request.log).list({
            projectIds: [project.id],
            versionState: FlowVersionState.DRAFT,
            includeTriggerSource: false,
        })
        const existing = page.data.find((item) => flowPath(item, veritlyProjectId) === request.body.path)
        const externalId = flowExternalId(veritlyProjectId, request.body.path)
        const flow = existing ? existing : await flowService(request.log).create({
            projectId: project.id,
            externalId,
            ownerId: project.ownerId,
            request: {
                projectId: project.id,
                displayName: request.body.displayName,
                metadata: {
                    veritly: {
                        path: request.body.path,
                        projectId: veritlyProjectId,
                        creatorUserId: session.user.id,
                    },
                },
            },
        })

        return reply.status(StatusCodes.CREATED).send({
            path: request.body.path,
            flowId: flow.id,
            displayName: flow.version.displayName,
        })
    })

    app.patch('/automations/:flowId', {
        schema: {
            params: z.object({ flowId: z.string().min(1) }),
            body: z.object({ path: z.string().min(1), displayName: z.string().min(1) }),
            response: {
                [StatusCodes.OK]: Automation,
                [StatusCodes.BAD_REQUEST]: ErrorResponse,
                [StatusCodes.UNAUTHORIZED]: ErrorResponse,
                [StatusCodes.NOT_FOUND]: ErrorResponse,
            },
        },
    }, async (request, reply) => {
        const session = await resolveVeritlySession({ request, reply })
        if (!session.ok) return reply.send(session.body)
        const scope = session.user.projectId
        const ctx = await getVeritlyContext({ log: request.log, user: session.user, veritlyProjectId: scope })
        const project = ctx.project
        const flow = await flowService(request.log).getOnePopulated({ id: request.params.flowId, projectId: project.id })
        if (!flow || !flowPath(flow, scope)) return reply.status(StatusCodes.NOT_FOUND).send({ error: 'automation not found' })
        const ops: FlowOperationRequest[] = [
            { type: FlowOperationType.CHANGE_NAME, request: { displayName: request.body.displayName } },
            {
                type: FlowOperationType.UPDATE_METADATA,
                request: {
                    metadata: {
                        ...flow.metadata,
                        veritly: {
                            path: request.body.path,
                            projectId: scope,
                            creatorUserId: session.user.id,
                        },
                    },
                },
            },
        ]
        for (const operation of ops) {
            await flowService(request.log).update({
                id: flow.id,
                projectId: project.id,
                userId: ctx.user.id,
                platformId: project.platformId,
                operation,
            })
        }
        await flowService(request.log).rekey({
            id: flow.id,
            projectId: project.id,
            externalId: flowExternalId(scope, request.body.path),
        })
        return { path: request.body.path, flowId: flow.id, displayName: request.body.displayName }
    })

    app.delete('/automations/:flowId', {
        schema: {
            params: z.object({ flowId: z.string().min(1) }),
            response: {
                [StatusCodes.OK]: z.object({ ok: z.literal(true) }),
                [StatusCodes.BAD_REQUEST]: ErrorResponse,
                [StatusCodes.UNAUTHORIZED]: ErrorResponse,
            },
        },
    }, async (request, reply) => {
        const session = await resolveVeritlySession({ request, reply })
        if (!session.ok) return reply.send(session.body)
        const scope = session.user.projectId
        const project = await getVeritlyProject({ log: request.log, user: session.user, veritlyProjectId: scope })
        const flow = await flowService(request.log).getOnePopulated({ id: request.params.flowId, projectId: project.id })
        if (!flow || !flowPath(flow, scope)) return { ok: true as const }
        await flowService(request.log).delete({ id: flow.id, projectId: project.id })
        return { ok: true as const }
    })

    app.delete('/automations', {
        schema: {
            response: {
                [StatusCodes.OK]: z.object({ ok: z.literal(true) }),
                [StatusCodes.BAD_REQUEST]: ErrorResponse,
                [StatusCodes.UNAUTHORIZED]: ErrorResponse,
            },
        },
    }, async (request, reply) => {
        const session = await resolveVeritlySession({ request, reply })
        if (!session.ok) return reply.send(session.body)
        const scope = session.user.projectId
        const project = await getVeritlyProject({ log: request.log, user: session.user, veritlyProjectId: scope })
        const page = await flowService(request.log).list({
            projectIds: [project.id],
            versionState: FlowVersionState.DRAFT,
            includeTriggerSource: false,
        })
        await Promise.all(
            page.data
                .filter((flow) => Boolean(flowPath(flow, scope)))
                .map((flow) => flowService(request.log).delete({ id: flow.id, projectId: project.id })),
        )
        return { ok: true as const }
    })

}

function flowExternalId(veritlyProjectId: string, path: string) {
    return `veritly:automation:${veritlyProjectId}:${path}`
}

function flowPath(flow: { externalId?: string | null, metadata?: Record<string, unknown> | null }, scope: string) {
    const veritly = record(flow.metadata) ? flow.metadata.veritly : undefined
    const path = record(veritly) ? veritly.path : undefined
    if (typeof path === 'string' && path) return path
    const ext = flow.externalId
    const prefix = flowExternalId(scope, '')
    if (typeof ext !== 'string') return
    if (!ext.startsWith(prefix)) return
    return ext.slice(prefix.length)
}

function record(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
}
