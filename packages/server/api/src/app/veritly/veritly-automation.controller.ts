import { AuthenticationResponse, EnginePrincipal, FlowActionType, FlowOperationType, FlowStatus, FlowTriggerType, FlowVersionState, StepLocationRelativeToParent } from '@activepieces/shared'
import { VeritlyUniverAppend, VeritlyUniverBook, VeritlyUniverRegisterWebhook, VeritlyUniverRegisterWebhookResult, VeritlyUniverRow, VeritlyUniverRows, VeritlyUniverSheets, VeritlyUniverUpdate, VeritlyUniverUpdateResult, VeritlyUniverWorkbooks } from '@veritly/univer-contract'
import type { FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { flowService } from '../flows/flow/flow.service'
import { projectService } from '../project/project-service'
import { getVeritlyContext, getVeritlyProject, getVeritlySessionResponse, resolveVeritlySession } from './veritly-auth'

const PROJECT_HDR = 'x-veritly-project-id'
const ErrorResponse = z.object({ error: z.string() })
const UniverUnits = z.object({ error: z.unknown(), units: z.array(VeritlyUniverBook) })
const UniverSheets = z.object({ error: z.unknown(), sheets: z.array(VeritlyUniverBook) })
const UniverRows = z.object({ error: z.unknown(), rows: z.array(VeritlyUniverRow) })
const UniverAppendResult = z.object({ error: z.unknown(), sheet: z.string(), row: z.number(), rev: z.number() })
const UniverUpdateResult = z.object({ error: z.unknown(), sheet: z.string(), row: z.number(), rev: z.number() })
const UniverRegisterWebhookResult = z.object({ error: z.unknown(), id: z.string() })
const UniverUnregisterWebhookResult = z.object({ error: z.unknown(), ok: z.literal(true) })
const SmokezInput = z.object({ projectId: z.string().min(1) })
const SmokezResult = z.object({
    ok: z.boolean(),
    checks: z.array(z.object({
        name: z.string(),
        ok: z.boolean(),
        ms: z.number(),
        detail: z.string().optional(),
    })),
})
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
        const flow = existing.data[0] ? existing.data[0] : await flowService(request.log).create({
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

    app.post('/smokez', {
        schema: {
            body: SmokezInput,
            response: {
                [StatusCodes.OK]: SmokezResult,
                [StatusCodes.INTERNAL_SERVER_ERROR]: SmokezResult,
                [StatusCodes.UNAUTHORIZED]: ErrorResponse,
                [StatusCodes.SERVICE_UNAVAILABLE]: ErrorResponse,
            },
        },
    }, async (request, reply) => {
        const session = await resolveVeritlySession({ request, reply })
        if (!session.ok) return reply.send(session.body)

        const ctx = await getVeritlyContext({
            log: request.log,
            user: session.user,
            veritlyProjectId: request.body.projectId,
        })
        const result = await smoke(request, ctx, request.body.projectId)
        return reply.status(result.ok ? StatusCodes.OK : StatusCodes.INTERNAL_SERVER_ERROR).send(result)
    })

    app.get('/worker/univer/workbooks', WorkerRequest({
        response: {
            [StatusCodes.OK]: VeritlyUniverWorkbooks,
        },
    }), async (request) => {
        console.log('[veritly api] worker/univer/workbooks')
        return { workbooks: (await call(request, UniverUnits, 'GET', '/units')).units }
    })

    app.get('/worker/univer/workbooks/:workbookId/sheets', WorkerRequest({
        params: z.object({ workbookId: z.string().min(1) }),
        response: {
            [StatusCodes.OK]: VeritlyUniverSheets,
        },
    }), async (request) => {
        const params = request.params as WorkbookParams
        console.log('[veritly api] worker/univer/sheets', { workbookId: params.workbookId })
        return { sheets: (await call(request, UniverSheets, 'GET', `/units/${encodeURIComponent(params.workbookId)}/sheets`)).sheets }
    })

    app.get('/worker/univer/workbooks/:workbookId/sheets/:sheetId/rows', WorkerRequest({
        params: z.object({ workbookId: z.string().min(1), sheetId: z.string().min(1) }),
        response: {
            [StatusCodes.OK]: VeritlyUniverRows,
        },
    }), async (request) => {
        const params = request.params as SheetParams
        return { rows: (await call(request, UniverRows, 'GET', `/units/${encodeURIComponent(params.workbookId)}/sheets/${encodeURIComponent(params.sheetId)}/rows`)).rows }
    })

    app.post('/worker/univer/workbooks/:workbookId/sheets/:sheetId/rows', WorkerRequest({
        params: z.object({ workbookId: z.string().min(1), sheetId: z.string().min(1) }),
        body: VeritlyUniverAppend,
        response: {
            [StatusCodes.OK]: VeritlyUniverRow,
        },
    }), async (request) => {
        const params = request.params as SheetParams
        const body = request.body as AppendBody
        const path = `/units/${encodeURIComponent(params.workbookId)}/sheets/${encodeURIComponent(params.sheetId)}/rows`
        const res = await call(request, UniverAppendResult, 'POST', path, { values: body.values })
        const rows = await call(request, UniverRows, 'GET', `${path}?start=${res.row}&end=${res.row}`)
        const row = rows.rows[0]
        if (!row) throw new Error('Appended row was not readable')
        return row
    })

    app.post('/worker/univer/workbooks/:workbookId/sheets/:sheetId/cells', WorkerRequest({
        params: z.object({ workbookId: z.string().min(1), sheetId: z.string().min(1) }),
        body: VeritlyUniverUpdate,
        response: {
            [StatusCodes.OK]: VeritlyUniverUpdateResult,
        },
    }), async (request) => {
        const params = request.params as SheetParams
        const body = request.body as UpdateBody
        const res = await call(request, UniverUpdateResult, 'POST', `/units/${encodeURIComponent(params.workbookId)}/sheets/${encodeURIComponent(params.sheetId)}/cells`, {
            row: body.rowIndex,
            column: body.columnIndex,
            value: body.value,
        })
        return {
            workbookId: params.workbookId,
            sheetId: res.sheet,
            rowIndex: res.row,
            columnIndex: body.columnIndex,
            value: body.value,
            revision: res.rev,
        }
    })

    app.post('/worker/univer/webhook-registrations', WorkerRequest({
        body: VeritlyUniverRegisterWebhook,
        response: {
            [StatusCodes.OK]: VeritlyUniverRegisterWebhookResult,
        },
    }), async (request) => {
        const body = request.body as z.infer<typeof VeritlyUniverRegisterWebhook>
        const res = await call(request, UniverRegisterWebhookResult, 'POST', '/webhook-registrations', body)
        return { id: res.id }
    })

    app.delete('/worker/univer/webhook-registrations/:webhookId', WorkerRequest({
        params: z.object({ webhookId: z.string().min(1) }),
        response: {
            [StatusCodes.OK]: z.object({ ok: z.literal(true) }),
        },
    }), async (request) => {
        const params = request.params as WebhookParams
        await call(request, UniverUnregisterWebhookResult, 'DELETE', `/webhook-registrations/${encodeURIComponent(params.webhookId)}`)
        return { ok: true }
    })
}

function flowExternalId(veritlyProjectId: string, path: string) {
    return `veritly:automation:${veritlyProjectId}:${path}`
}

async function smoke(request: FastifyRequest, ctx: Awaited<ReturnType<typeof getVeritlyContext>>, project: string) {
    const checks: z.infer<typeof SmokezResult>['checks'] = []
    checks.push(await timed('activepieces-univer-flow', async () => {
        const root = compat()
        const mark = `smoke-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
        const source = await unit(root, ctx, project, `${mark}-source`)
        const dest = await unit(root, ctx, project, `${mark}-dest`)
        let flow = ''
        try {
            const src = await first(root, ctx, project, source)
            const dst = await first(root, ctx, project, dest)
            const created = await flowService(request.log).create({
                projectId: ctx.project.id,
                externalId: flowExternalId(project, `${mark}.auto`),
                ownerId: ctx.project.ownerId,
                request: {
                    projectId: ctx.project.id,
                    displayName: `smokez ${mark}`,
                    metadata: {
                        veritly: {
                            path: `${mark}.auto`,
                            projectId: project,
                            creatorUserId: ctx.user.id,
                        },
                    },
                },
            })
            flow = created.id
            let out = await flowService(request.log).update({
                id: flow,
                projectId: ctx.project.id,
                userId: ctx.user.id,
                platformId: ctx.platformId,
                operation: {
                    type: FlowOperationType.UPDATE_TRIGGER,
                    request: trigger(source, src),
                },
            })
            out = await flowService(request.log).update({
                id: flow,
                projectId: ctx.project.id,
                userId: ctx.user.id,
                platformId: ctx.platformId,
                operation: {
                    type: FlowOperationType.ADD_ACTION,
                    request: {
                        parentStep: out.version.trigger.name,
                        stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
                        action: action(dest, dst),
                    },
                },
            })
            await flowService(request.log).update({
                id: flow,
                projectId: ctx.project.id,
                userId: ctx.user.id,
                platformId: ctx.platformId,
                operation: {
                    type: FlowOperationType.LOCK_AND_PUBLISH,
                    request: { status: FlowStatus.ENABLED },
                },
            })
            await write(root, ctx, project, source, src, [mark, 'input'])
            await wait(async () => {
                const rows = await data<{ rows: { values: unknown[] }[] }>(root, ctx, project, 'GET', `/veritly/units/${dest}/sheets/${dst}/rows?empty=true`)
                return rows.rows.some((row) => row.values[0] === mark && row.values[1] === 'processed')
            })
            return `flow=${flow} source=${source}/${src} dest=${dest}/${dst}`
        } finally {
            await Promise.all([
                flow ? flowService(request.log).delete({ id: flow, projectId: ctx.project.id }) : Promise.resolve(),
                drop(root, ctx, project, source),
                drop(root, ctx, project, dest),
            ])
        }
    }))
    return {
        ok: checks.every((check) => check.ok),
        checks,
    }
}

async function timed(name: string, fn: () => Promise<string>) {
    const start = performance.now()
    try {
        return {
            name,
            ok: true,
            ms: Math.round(performance.now() - start),
            detail: await fn(),
        }
    } catch (err) {
        return {
            name,
            ok: false,
            ms: Math.round(performance.now() - start),
            detail: err instanceof Error ? err.message : String(err),
        }
    }
}

function trigger(book: string, tab: string) {
    return {
        name: 'trigger',
        displayName: 'New Row Added',
        valid: true,
        lastUpdatedDate: new Date().toISOString(),
        type: FlowTriggerType.PIECE as const,
        settings: {
            pieceName: '@activepieces/piece-veritly-univer',
            pieceVersion: '0.0.1',
            triggerName: 'new_row_added',
            input: {
                workbook_id: book,
                sheet_id: tab,
            },
            propertySettings: {},
        },
    }
}

function action(book: string, tab: string) {
    return {
        name: 'append_row',
        displayName: 'Append Row',
        valid: true,
        lastUpdatedDate: new Date().toISOString(),
        type: FlowActionType.PIECE as const,
        settings: {
            pieceName: '@activepieces/piece-veritly-univer',
            pieceVersion: '0.0.1',
            actionName: 'append_row',
            input: {
                workbook_id: book,
                sheet_id: tab,
                values: ['{{trigger.values[0]}}', 'processed'],
            },
            propertySettings: {},
        },
    }
}

async function unit(root: string, ctx: Awaited<ReturnType<typeof getVeritlyContext>>, project: string, name: string) {
    return (await data<{ unitID: string }>(root, ctx, project, 'POST', '/snapshot/2/unit/-/create', { name, creator: ctx.user.id })).unitID
}

async function first(root: string, ctx: Awaited<ReturnType<typeof getVeritlyContext>>, project: string, book: string) {
    const res = await data<{ sheets: { id: string }[] }>(root, ctx, project, 'GET', `/veritly/units/${book}/sheets`)
    const sheet = res.sheets[0]
    if (!sheet) throw new Error(`unit ${book} has no sheets`)
    return sheet.id
}

async function write(root: string, ctx: Awaited<ReturnType<typeof getVeritlyContext>>, project: string, book: string, tab: string, values: unknown[]) {
    await data(root, ctx, project, 'POST', `/veritly/units/${book}/sheets/${tab}/rows`, { values })
}

async function drop(root: string, ctx: Awaited<ReturnType<typeof getVeritlyContext>>, project: string, book: string) {
    await data(root, ctx, project, 'DELETE', `/veritly/units/${book}`)
}

async function data<T>(root: string, ctx: Awaited<ReturnType<typeof getVeritlyContext>>, project: string, method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(new URL(`/universer-api${path}`, root), {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-veritly-service-token': token(),
            'x-veritly-user-id': ctx.user.id,
            'x-veritly-project-id': project,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
    })
    const text = await res.text()
    if (!res.ok) throw new Error(`${method} ${path} failed ${res.status}: ${text}`)
    if (!text) return {} as T
    return JSON.parse(text) as T
}

async function wait(fn: () => Promise<boolean>) {
    const end = Date.now() + 5000
    while (Date.now() < end) {
        if (await fn()) return
        await new Promise((resolve) => setTimeout(resolve, 250))
    }
    throw new Error('destination workbook did not receive processed row')
}

function compat() {
    const root = process.env.UNIVER_COMPAT_URL?.trim()
    if (!root) throw new Error('UNIVER_COMPAT_URL is required')
    return root
}

function token() {
    const value = process.env.UNIVER_COMPAT_SERVICE_TOKEN?.trim()
    if (!value) throw new Error('UNIVER_COMPAT_SERVICE_TOKEN is required')
    return value
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
    const target = process.env.UNIVER_COMPAT_URL?.trim()
    if (!target) throw new Error('UNIVER_COMPAT_URL is required')
    const token = process.env.UNIVER_COMPAT_SERVICE_TOKEN?.trim()
    if (!token) throw new Error('UNIVER_COMPAT_SERVICE_TOKEN is required')
    const id = await scope(request)
    const res = await fetch(new URL(`/universer-api/veritly${path}`, target), {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-veritly-service-token': token,
            'x-veritly-user-id': id.userId,
            'x-veritly-project-id': id.projectId,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    })
    const text = await res.text()
    if (!res.ok) throw new Error(text)
    if (!text) throw new Error(`Univer returned empty body for ${method} ${path}`)
    return schema.parse(JSON.parse(text))
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

type AppendBody = z.infer<typeof VeritlyUniverAppend>

type UpdateBody = z.infer<typeof VeritlyUniverUpdate>
