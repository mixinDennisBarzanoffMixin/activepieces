import { AuthenticationResponse, EnginePrincipal, FlowOperationRequest, FlowOperationType, FlowVersionState } from '@activepieces/shared'
import { VeritlyOnlyOfficeAppend, VeritlyOnlyOfficeBook, VeritlyOnlyOfficeDocuments, VeritlyOnlyOfficeRegisterWebhook, VeritlyOnlyOfficeRegisterWebhookResult, VeritlyOnlyOfficeRow, VeritlyOnlyOfficeRows, VeritlyOnlyOfficeSheets, VeritlyOnlyOfficeUpdate, VeritlyOnlyOfficeUpdateResult, VeritlyOnlyOfficeWorkbooks } from '@veritly/onlyoffice-contract'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { flowService } from '../flows/flow/flow.service'
import { projectService } from '../project/project-service'
import {
    getVeritlyContext,
    getVeritlyProject,
    getVeritlySessionResponse,
    resolveVeritlySession,
} from './veritly-auth'

const PROJECT_HDR = 'x-veritly-project-id'
const ErrorResponse = z.object({ error: z.string() })
const OnlyOfficeFile = z.object({ id: z.string(), path: z.string(), kind: z.string() })
const OnlyOfficeFiles = z.array(OnlyOfficeFile)
const OnlyOfficeSheets = z.object({ sheets: z.array(VeritlyOnlyOfficeBook) })
const OnlyOfficeRows = z.object({ rows: z.array(VeritlyOnlyOfficeRow) })
const OnlyOfficeAppendResult = z.object({ row: VeritlyOnlyOfficeRow, revision: z.number() })
const OnlyOfficeUpdateResult = z.object({ revision: z.number() })
const OnlyOfficeRegisterWebhookResult = z.object({ id: z.string() }).passthrough()
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
        console.log('[veritly api] session start', {
            hasCookie: Boolean(request.headers.cookie),
            veritlyProjectId: request.headers[PROJECT_HDR]?.toString(),
        })
        try {
            const session = await getVeritlySessionResponse({ request, reply, log: request.log })
            console.log('[veritly api] session resolved', { ok: session.ok })
            if (!session.ok) return reply.send(session.body)
            return session.body
        } catch (err) {
            console.error('[veritly api] session failed', err)
            throw err
        }
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

        const veritlyProjectId = request.headers[PROJECT_HDR]?.toString()
        if (!veritlyProjectId) return reply.status(StatusCodes.BAD_REQUEST).send({ error: `missing ${PROJECT_HDR}` })

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

        const veritlyProjectId = request.headers[PROJECT_HDR]?.toString()
        if (!veritlyProjectId) return reply.status(StatusCodes.BAD_REQUEST).send({ error: `missing ${PROJECT_HDR}` })

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
        const scope = request.headers[PROJECT_HDR]?.toString()
        if (!scope) return reply.status(StatusCodes.BAD_REQUEST).send({ error: `missing ${PROJECT_HDR}` })
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
        const scope = request.headers[PROJECT_HDR]?.toString()
        if (!scope) return reply.status(StatusCodes.BAD_REQUEST).send({ error: `missing ${PROJECT_HDR}` })
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
        const scope = request.headers[PROJECT_HDR]?.toString()
        if (!scope) return reply.status(StatusCodes.BAD_REQUEST).send({ error: `missing ${PROJECT_HDR}` })
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

    app.get('/worker/onlyoffice/workbooks', WorkerRequest({
        response: {
            [StatusCodes.OK]: VeritlyOnlyOfficeWorkbooks,
        },
    }), async (request) => {
        console.log('[veritly api] worker/onlyoffice/workbooks')
        return {
            workbooks: (await call(request, OnlyOfficeFiles, 'GET', '/files'))
                .filter((file) => file.kind === 'cell')
                .map((file) => ({ id: file.id, name: file.path })),
        }
    })

    app.get('/worker/onlyoffice/documents', WorkerRequest({
        response: {
            [StatusCodes.OK]: VeritlyOnlyOfficeDocuments,
        },
    }), async (request) => {
        return {
            documents: (await call(request, OnlyOfficeFiles, 'GET', '/files'))
                .filter((file) => file.kind === 'word' || file.kind === 'slide')
                .map((file) => ({ id: file.id, name: file.path, kind: file.kind })),
        }
    })

    app.get('/worker/onlyoffice/documents/:documentId/content', {
        config: {
            security: securityAccess.engine(),
        },
        schema: {
            params: z.object({ documentId: z.string().min(1) }),
        },
    }, async (request, reply) => {
        const params = request.params as DocumentParams
        const res = await raw(request, 'GET', `/files/${encodeURIComponent(params.documentId)}/content`)
        return file(reply, res)
    })

    app.get('/worker/onlyoffice/workbooks/:workbookId/sheets', WorkerRequest({
        params: z.object({ workbookId: z.string().min(1) }),
        response: {
            [StatusCodes.OK]: VeritlyOnlyOfficeSheets,
        },
    }), async (request) => {
        const params = request.params as WorkbookParams
        console.log('[veritly api] worker/onlyoffice/sheets', { workbookId: params.workbookId })
        return await call(request, OnlyOfficeSheets, 'GET', `/files/${encodeURIComponent(params.workbookId)}/sheets`)
    })

    app.get('/worker/onlyoffice/workbooks/:workbookId/sheets/:sheetId/rows', WorkerRequest({
        params: z.object({ workbookId: z.string().min(1), sheetId: z.string().min(1) }),
        response: {
            [StatusCodes.OK]: VeritlyOnlyOfficeRows,
        },
    }), async (request) => {
        const params = request.params as SheetParams
        return await call(request, OnlyOfficeRows, 'GET', `/files/${encodeURIComponent(params.workbookId)}/sheets/${encodeURIComponent(params.sheetId)}/rows`)
    })

    app.post('/worker/onlyoffice/workbooks/:workbookId/sheets/:sheetId/rows', WorkerRequest({
        params: z.object({ workbookId: z.string().min(1), sheetId: z.string().min(1) }),
        body: VeritlyOnlyOfficeAppend,
        response: {
            [StatusCodes.OK]: VeritlyOnlyOfficeRow,
        },
    }), async (request) => {
        const params = request.params as SheetParams
        const body = request.body as AppendBody
        const path = `/files/${encodeURIComponent(params.workbookId)}/sheets/${encodeURIComponent(params.sheetId)}/rows`
        const res = await call(request, OnlyOfficeAppendResult, 'POST', path, { values: body.values })
        return res.row
    })

    app.post('/worker/onlyoffice/workbooks/:workbookId/sheets/:sheetId/cells', WorkerRequest({
        params: z.object({ workbookId: z.string().min(1), sheetId: z.string().min(1) }),
        body: VeritlyOnlyOfficeUpdate,
        response: {
            [StatusCodes.OK]: VeritlyOnlyOfficeUpdateResult,
        },
    }), async (request) => {
        const params = request.params as SheetParams
        const body = request.body as UpdateBody
        const path = `/files/${encodeURIComponent(params.workbookId)}/sheets/${encodeURIComponent(params.sheetId)}`
        const rows = await call(request, OnlyOfficeRows, 'GET', `${path}/rows?start=${body.rowIndex}&end=${body.rowIndex}&empty=true`)
        const evidence = rows.rows[0]
        if (!evidence) throw new Error('Target row was not readable')
        const res = await call(request, OnlyOfficeUpdateResult, 'POST', `${path}/cells`, {
            row: body.rowIndex,
            column: body.columnIndex,
            value: body.value,
            evidence,
        })
        return {
            workbookId: params.workbookId,
            sheetId: params.sheetId,
            rowIndex: body.rowIndex,
            columnIndex: body.columnIndex,
            value: body.value,
            revision: res.revision,
        }
    })

    app.post('/worker/onlyoffice/webhook-registrations', WorkerRequest({
        body: VeritlyOnlyOfficeRegisterWebhook,
        response: {
            [StatusCodes.OK]: VeritlyOnlyOfficeRegisterWebhookResult,
        },
    }), async (request) => {
        const body = request.body as z.infer<typeof VeritlyOnlyOfficeRegisterWebhook>
        const input = body.event === 'chart_changed'
            ? { event: body.event, fileId: body.workbookId, url: body.url }
            : { event: body.event, fileId: body.workbookId, sheetId: body.sheetId, url: body.url }
        const res = await call(request, OnlyOfficeRegisterWebhookResult, 'POST', '/webhooks', input)
        return { id: res.id }
    })

    app.delete('/worker/onlyoffice/webhook-registrations/:webhookId', WorkerRequest({
        params: z.object({ webhookId: z.string().min(1) }),
        response: {
            [StatusCodes.OK]: z.object({ ok: z.literal(true) }),
        },
    }), async (request) => {
        const params = request.params as WebhookParams
        await call(request, z.undefined(), 'DELETE', `/webhooks/${encodeURIComponent(params.webhookId)}`)
        return { ok: true }
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

function WorkerRequest(schema: WorkerSchema) {
    return {
        config: {
            security: securityAccess.engine(),
        },
        schema,
    }
}

async function scope(request: FastifyRequest) {
    const req = request as FastifyRequest & { principal: EnginePrincipal }
    console.log('[veritly api] run start', { projectId: req.principal.projectId })
    const project = await projectService(request.log).getOneOrThrow(req.principal.projectId)
    const id = identity(project)
    console.log('[veritly api] run scope', { veritlyProjectId: id.projectId, userId: id.userId })
    return id
}

function identity(project: { externalId?: string | null, metadata?: Record<string, unknown> | null }) {
    console.log('[veritly api] identity', { externalId: project.externalId })
    const prefix = 'veritly:project:'
    const ext = project.externalId
    if (!ext?.startsWith(prefix)) throw new Error('Activepieces project is missing Veritly external id')
    const meta = project.metadata
    if (!record(meta)) throw new Error('Activepieces project metadata is missing')
    const veritly = meta.veritly
    if (!record(veritly)) throw new Error('Activepieces project Veritly metadata is missing')
    const userId = veritly.creatorUserId
    if (typeof userId !== 'string' || !userId) throw new Error('Activepieces project Veritly user id is missing')
    return {
        userId,
        projectId: ext.slice(prefix.length),
    }
}

async function call<T>(request: FastifyRequest, schema: z.ZodType<T>, method: string, path: string, body?: unknown) {
    const res = await raw(request, method, path, body)
    const text = await res.text()
    if (!text) return schema.parse(undefined)
    return schema.parse(JSON.parse(text))
}

async function raw(request: FastifyRequest, method: string, path: string, body?: unknown) {
    const target = process.env.ONLYOFFICE_BACKEND_URL?.trim()
    if (!target) throw new Error('ONLYOFFICE_BACKEND_URL is required')
    const token = process.env.ONLYOFFICE_SERVICE_TOKEN?.trim()
    if (!token) throw new Error('ONLYOFFICE_SERVICE_TOKEN is required')
    const id = await scope(request)
    const res = await fetch(new URL(`/onlyoffice-api${path}`, target), {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-veritly-service-token': token,
            'x-veritly-user-id': id.userId,
            'x-veritly-project-id': id.projectId,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (!res.ok) throw new Error(await res.text())
    return res
}

async function file(reply: FastifyReply, res: Response) {
    const disposition = res.headers.get('content-disposition')
    if (disposition) void reply.header('Content-Disposition', disposition)
    const type = res.headers.get('content-type')
    if (!type) throw new Error('ONLYOFFICE document content type is missing')
    return reply
        .type(type)
        .status(StatusCodes.OK)
        .send(Buffer.from(await res.arrayBuffer()))
}

function record(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
}

type WorkerSchema = {
    params?: z.ZodType
    body?: z.ZodType
    response: Record<number, z.ZodType>
}

type WorkbookParams = {
    workbookId: string
}

type SheetParams = {
    workbookId: string
    sheetId: string
}

type WebhookParams = {
    webhookId: string
}

type DocumentParams = {
    documentId: string
}

type AppendBody = z.infer<typeof VeritlyOnlyOfficeAppend>

type UpdateBody = z.infer<typeof VeritlyOnlyOfficeUpdate>
