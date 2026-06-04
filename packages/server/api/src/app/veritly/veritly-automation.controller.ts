import { AuthenticationResponse, EnginePrincipal, FlowVersionState } from '@activepieces/shared'
import { VeritlyUniverAppend, VeritlyUniverRow, VeritlyUniverRows, VeritlyUniverSheets, VeritlyUniverUpdate, VeritlyUniverUpdateResult, VeritlyUniverWorkbooks } from '@veritly/univer-contract'
import type { FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { flowService } from '../flows/flow/flow.service'
import { projectService } from '../project/project-service'
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

    app.get('/worker/univer/workbooks', WorkerRequest({
        response: {
            [StatusCodes.OK]: VeritlyUniverWorkbooks,
        },
    }), async (request) => {
        console.log('[veritly api] worker/univer/workbooks')
        return await run(request, async ({ store }) => ({
            workbooks: await store.listPersistedSheetUnits(),
        }))
    })

    app.get('/worker/univer/workbooks/:workbookId/sheets', WorkerRequest({
        params: z.object({ workbookId: z.string().min(1) }),
        response: {
            [StatusCodes.OK]: VeritlyUniverSheets,
        },
    }), async (request) => {
        const params = request.params as WorkbookParams
        console.log('[veritly api] worker/univer/sheets', { workbookId: params.workbookId })
        return await run(request, async ({ api, store }) => {
            await store.hydrateUnit(params.workbookId)
            const wb = api.parseSnapshotWorkbook(store.latestSnapshot(params.workbookId, 2).snap).wb
            return {
                sheets: api.sheetIdsFromWorkbook(wb).map((id) => {
                    const raw = wb.sheets ? wb.sheets[id] : undefined
                    const name = raw && typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : id
                    return { id, name }
                }),
            }
        })
    })

    app.get('/worker/univer/workbooks/:workbookId/sheets/:sheetId/rows', WorkerRequest({
        params: z.object({ workbookId: z.string().min(1), sheetId: z.string().min(1) }),
        response: {
            [StatusCodes.OK]: VeritlyUniverRows,
        },
    }), async (request) => {
        const params = request.params as SheetParams
        return await run(request, async ({ api, store }) => ({
            rows: (await api.readUnitRows(store, params.workbookId, { sheet: params.sheetId })).map(out),
        }))
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
        return await run(request, async ({ api, store }) => {
            const res = await api.appendUnitRow(store, params.workbookId, body.values, {
                sheet: params.sheetId,
                member: 'activepieces',
            })
            const rows = await api.readUnitRows(store, params.workbookId, { sheet: res.sheet, start: res.row, end: res.row })
            const row = rows[0]
            if (!row) throw new Error('Appended row was not readable')
            return out(row)
        })
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
        return await run(request, async ({ api, store }) => {
            const res = await api.updateUnitCell(store, params.workbookId, body.rowIndex, body.columnIndex, body.value, {
                sheet: params.sheetId,
                member: 'activepieces',
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
    })
}

function flowExternalId(veritlyProjectId: string, path: string) {
    return `veritly:automation:${veritlyProjectId}:${path}`
}

function WorkerRequest(schema: WorkerSchema) {
    return {
        config: {
            security: securityAccess.engine(),
        },
        schema,
    }
}

async function run<T>(request: FastifyRequest, fn: (ctx: CompatCtx) => Promise<T>) {
    const req = request as FastifyRequest & { principal: EnginePrincipal }
    console.log('[veritly api] run start', { projectId: req.principal.projectId })
    const project = await projectService(request.log).getOneOrThrow(req.principal.projectId)
    const id = identity(project)
    const api = await compat()
    const store = new api.Store(api.exchangeFilesFromEnv(), persist())
    console.log('[veritly api] run scope', { veritlyProjectId: id.projectId, userId: id.userId })
    return await api.runWithRequestUserAsync(id.userId, () => api.runWithRequestProjectAsync(id.projectId, () => fn({ api, store })))
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

function persist() {
    const raw = process.env.UNIVER_COMPAT_PERSIST_EVERY_REV?.trim()
    if (!raw) throw new Error('UNIVER_COMPAT_PERSIST_EVERY_REV is required')
    const step = Number.parseInt(raw, 10)
    if (!Number.isFinite(step) || step < 1) throw new Error('UNIVER_COMPAT_PERSIST_EVERY_REV must be >= 1')
    return step
}

async function compat(): Promise<Compat> {
    console.log('[veritly api] importing @opencode-ai/univer-compat')
    const name = '@opencode-ai/univer-compat'
    return await import(name) as Compat
}

function out(item: CompatRow) {
    return {
        id: String(item.index),
        index: item.index,
        values: item.values,
        updatedAt: new Date().toISOString(),
        hash: item.hash,
    }
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

type AppendBody = z.infer<typeof VeritlyUniverAppend>

type UpdateBody = z.infer<typeof VeritlyUniverUpdate>

type CompatCtx = {
    api: Compat
    store: InstanceType<Compat['Store']>
}

type CompatRow = {
    index: number
    values: Array<string | number | boolean | null>
    hash: string
}

type Compat = {
    Store: new (blob: unknown, persistEveryRev: number) => {
        listPersistedSheetUnits(): Promise<Array<{ id: string, name: string }>>
        hydrateUnit(unit: string): Promise<void>
        latestSnapshot(unit: string, typ: number): { snap: string }
    }
    exchangeFilesFromEnv(): unknown
    parseSnapshotWorkbook(snap: string): { wb: { sheets?: Record<string, Record<string, unknown>>, sheetOrder?: string[] } }
    sheetIdsFromWorkbook(wb: { sheets?: Record<string, Record<string, unknown>>, sheetOrder?: string[] }): string[]
    readUnitRows(store: unknown, unit: string, opts: { sheet: string, start?: number, end?: number }): Promise<CompatRow[]>
    appendUnitRow(store: unknown, unit: string, values: Array<string | number | boolean | null>, opts: { sheet: string, member: string }): Promise<{ sheet: string, row: number }>
    updateUnitCell(store: unknown, unit: string, row: number, col: number, value: string | number | boolean | null, opts: { sheet: string, member: string }): Promise<{ sheet: string, row: number, rev: number }>
    runWithRequestUserAsync<T>(userId: string, fn: () => Promise<T>): Promise<T>
    runWithRequestProjectAsync<T>(projectId: string, fn: () => Promise<T>): Promise<T>
}
