import { FlowVersionState, ProjectType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { flowService } from '../flows/flow/flow.service'
import { platformService } from '../platform/platform.service'
import { projectService } from '../project/project-service'
import { resolveVeritlySession } from './veritly-auth'

const PROJECT_HDR = 'x-veritly-project-id'
const ErrorResponse = z.object({ error: z.string() })

export const veritlyAutomationController: FastifyPluginAsyncZod = async (app) => {
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

        const project = await getProject({
            log: request.log,
            veritlyProjectId,
            veritlyUserId: session.user.id,
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

async function getProject(input: GetProjectInput) {
    const platform = await platformService(input.log).getOldestPlatform()
    if (!platform) throw new Error('Activepieces platform is not configured')

    const externalId = projectExternalId(input.veritlyProjectId)
    const existing = await projectService(input.log).getByPlatformIdAndExternalId({
        platformId: platform.id,
        externalId,
    })
    if (existing) return existing

    return projectService(input.log).create({
        platformId: platform.id,
        ownerId: platform.ownerId,
        type: ProjectType.TEAM,
        displayName: `Veritly ${input.veritlyProjectId}`,
        externalId,
        metadata: {
            veritly: {
                projectId: input.veritlyProjectId,
                creatorUserId: input.veritlyUserId,
            },
        },
    })
}

function projectExternalId(veritlyProjectId: string) {
    return `veritly:project:${veritlyProjectId}`
}

function flowExternalId(veritlyProjectId: string, path: string) {
    return `veritly:automation:${veritlyProjectId}:${path}`
}

type GetProjectInput = {
    log: FastifyBaseLogger
    veritlyProjectId: string
    veritlyUserId: string
}
