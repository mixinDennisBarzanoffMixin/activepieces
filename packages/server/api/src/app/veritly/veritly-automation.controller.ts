import { AuthenticationResponse, FlowVersionState } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { flowService } from '../flows/flow/flow.service'
import { getVeritlyProject, getVeritlySessionResponse, resolveVeritlySession } from './veritly-auth'

const PROJECT_HDR = 'x-veritly-project-id'
const ErrorResponse = z.object({ error: z.string() })

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

        const veritlyProjectId = request.headers[PROJECT_HDR]?.toString()
        if (!veritlyProjectId) return reply.status(StatusCodes.BAD_REQUEST).send({ error: `missing ${PROJECT_HDR}` })

        const project = await getVeritlyProject({
            log: request.log,
            user: session.user,
            veritlyProjectId,
        })
        const externalId = flowExternalId(veritlyProjectId, request.body.path)
        const existing = await flowService(request.log).list({
            projectIds: [project.id],
            externalIds: [externalId],
            versionState: FlowVersionState.DRAFT,
        })
        const flow = existing.data[0] ?? await flowService(request.log).create({
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
}

function flowExternalId(veritlyProjectId: string, path: string) {
    return `veritly:automation:${veritlyProjectId}:${path}`
}
