import { AuthenticationResponse, EnginePrincipal, FlowActionType, FlowOperationType, FlowStatus, FlowTriggerType, FlowVersionState, StepLocationRelativeToParent } from '@activepieces/shared'
import { VeritlyUniverAppend, VeritlyUniverBook, VeritlyUniverRegisterWebhook, VeritlyUniverRegisterWebhookResult, VeritlyUniverRow, VeritlyUniverRows, VeritlyUniverSheets, VeritlyUniverUpdate, VeritlyUniverUpdateResult, VeritlyUniverWorkbooks } from '@veritly/univer-contract'
import type { FastifyReply, FastifyRequest } from 'fastify'
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
const UniverPiece = '@activepieces/piece-veritly-univer'
const UniverPieceVersion = '0.0.2'
const SmokezResult = z.object({
    ok: z.boolean(),
    projectId: z.string(),
    checks: z.array(z.object({
        name: z.string(),
        ok: z.boolean(),
        ms: z.number(),
        detail: z.string().optional(),
    })),
    logs: z.array(z.object({
        at: z.string(),
        step: z.string(),
        data: z.record(z.string(), z.unknown()).optional(),
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
        const session = await resolveSmokezSession({ request, reply })
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

async function resolveSmokezSession(params: { request: FastifyRequest, reply: FastifyReply }) {
    const token = params.request.headers['x-veritly-smokez-token']?.toString()
    if (!token) return resolveVeritlySession(params)
    if (token !== smokeToken()) {
        params.reply.status(StatusCodes.UNAUTHORIZED)
        return { ok: false as const, body: { error: 'Invalid smokez token' } }
    }
    return { ok: true as const, user: smokeUser() }
}

function smokeToken() {
    const token = process.env.SMOKEZ_SERVICE_TOKEN?.trim()
    if (!token) throw new Error('SMOKEZ_SERVICE_TOKEN is required')
    return token
}

function smokeUser() {
    const id = process.env.SMOKEZ_USER_ID?.trim()
    if (!id) throw new Error('SMOKEZ_USER_ID is required')
    return {
        id,
        email: process.env.SMOKEZ_USER_EMAIL?.trim(),
        firstName: 'Smokez',
        lastName: 'Service',
    }
}

function flowExternalId(veritlyProjectId: string, path: string) {
    return `veritly:automation:${veritlyProjectId}:${path}`
}

async function smoke(request: FastifyRequest, ctx: Awaited<ReturnType<typeof getVeritlyContext>>, project: string) {
    const checks: z.infer<typeof SmokezResult>['checks'] = []
    const logs: z.infer<typeof SmokezResult>['logs'] = []
    const log = (step: string, data?: Record<string, unknown>) => {
        logs.push({ at: new Date().toISOString(), step, data })
        console.log('[veritly smokez]', { step, data })
    }
    checks.push(await timed('activepieces-univer-flow', async () => {
        const root = compat()
        const mark = `smoke-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
        const user = identity(ctx.project).userId
        log('start', { project, mark, activepiecesProjectId: ctx.project.id, activepiecesUserId: ctx.user.id, userId: user })
        const source = await unit(root, user, project, `${mark}-source`)
        log('source-created', { source })
        const dest = await unit(root, user, project, `${mark}-dest`)
        log('dest-created', { dest })
        let flow = ''
        try {
            const src = await first(root, user, project, source)
            const dst = await first(root, user, project, dest)
            log('sheets-selected', { source, src, dest, dst })
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
            log('flow-created', { flow })
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
            log('trigger-configured', { flow, trigger: out.version.trigger.name })
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
            log('action-configured', { flow, version: out.version.id })
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
            log('flow-published', { flow })
            await write(root, user, project, source, src, [mark, 'input'])
            log('source-row-written', { source, src, values: [mark, 'input'] })
            await wait(async () => {
                const rows = await data<{ rows: { values: unknown[] }[] }>(root, user, project, 'GET', `/veritly/units/${dest}/sheets/${dst}/rows?empty=true`)
                log('dest-polled', { rows: rows.rows.length })
                return rows.rows.some((row) => row.values[0] === mark && row.values[1] === 'processed')
            })
            log('dest-verified', { dest, dst, values: [mark, 'processed'] })
            return `flow=${flow} source=${source}/${src} dest=${dest}/${dst}`
        } finally {
            log('cleanup-start', { flow, source, dest })
            await Promise.all([
                flow ? flowService(request.log).delete({ id: flow, projectId: ctx.project.id }) : Promise.resolve(),
                drop(root, user, project, source),
                drop(root, user, project, dest),
            ])
            log('cleanup-done', { flow, source, dest })
        }
    }))
    return {
        ok: checks.every((check) => check.ok),
        projectId: project,
        checks,
        logs,
    }
}

async function timed(name: string, fn: () => Promise<string>) {
    const start = performance.now()
    try {
        const detail = await fn()
        return {
            name,
            ok: true,
            ms: Math.round(performance.now() - start),
            detail,
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
            pieceName: UniverPiece,
            pieceVersion: UniverPieceVersion,
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
            pieceName: UniverPiece,
            pieceVersion: UniverPieceVersion,
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

async function unit(root: string, user: string, project: string, name: string) {
    return (await data<{ unitID: string }>(root, user, project, 'POST', '/snapshot/2/unit/-/create', { name, creator: user })).unitID
}

async function first(root: string, user: string, project: string, book: string) {
    const res = await data<{ sheets: { id: string }[] }>(root, user, project, 'GET', `/veritly/units/${book}/sheets`)
    const sheet = res.sheets[0]
    if (!sheet) throw new Error(`unit ${book} has no sheets`)
    return sheet.id
}

async function write(root: string, user: string, project: string, book: string, tab: string, values: unknown[]) {
    await data(root, user, project, 'POST', `/veritly/units/${book}/sheets/${tab}/rows`, { values })
}

async function drop(root: string, user: string, project: string, book: string) {
    await data(root, user, project, 'DELETE', `/veritly/units/${book}`)
}

async function data<T>(root: string, user: string, project: string, method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(new URL(`/universer-api${path}`, root), {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-veritly-service-token': token(),
            'x-veritly-user-id': user,
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
