import type { FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { data } from './veritly-data.service'

const Value = z.union([z.string(), z.number().finite(), z.boolean(), z.null()])
const Cells = z.record(z.string(), Value)
const Source = z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('workbook'), file: z.string(), path: z.string(), revision: z.number().int().positive() }),
    z.object({ kind: z.literal('native') }),
])
const Summary = z.object({
    id: z.string(),
    path: z.string(),
    schema: z.string(),
    source: Source,
    state: z.enum(['draft', 'ready', 'published', 'source_missing', 'repairing']),
    version: z.number().int().positive(),
    updated: z.number().int().nonnegative(),
})
const Prep = Summary.extend({
    project: z.string(),
    commands: z.array(z.object({ kind: z.string() }).passthrough()),
    baseline: z.object({ workbook: z.number(), recipe: z.number(), dataset: z.number(), hash: z.string() }).optional(),
    created: z.number().int().nonnegative(),
})
const Preps = z.object({ preps: z.array(Summary) })
const Column = z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['text', 'boolean', 'integer', 'decimal', 'date', 'timestamp']),
    owner: z.enum(['shared', 'workbook', 'database', 'formula', 'derived']),
    nullable: z.boolean(),
    formula: z.string().optional(),
})
const Dataset = z.object({
    id: z.string(),
    prep: z.string().optional(),
    project: z.string(),
    schema: z.string(),
    table: z.string(),
    class: z.enum(['entity', 'derived', 'native']),
    columns: z.array(Column),
    keys: z.array(z.string()),
    rows: z.number().int().nonnegative(),
    bytes: z.number().int().nonnegative(),
    version: z.number().int().positive(),
})
const Datasets = z.object({ datasets: z.array(Dataset) })
const Row = z.object({ id: z.string().uuid(), version: z.number().int().nonnegative(), values: Cells })
const Rows = z.object({ rows: z.array(Row), cursor: z.string().optional() })
const Receipt = z.object({ id: z.string(), version: z.number(), created: z.number() })
const Job = z.object({
    id: z.string(),
    kind: z.enum(['profile', 'preview', 'publish', 'writeback', 'reconcile', 'export', 'cleanup']),
    state: z.enum(['queued', 'running', 'succeeded', 'failed', 'cancelled']),
    progress: z.number(),
    error: z.string().optional(),
    created: z.number(),
    updated: z.number(),
})
const Id = z.object({ id: z.string().min(1) })
const RowParams = z.object({ datasetId: z.string().min(1), rowId: z.string().uuid() })
const RowsParams = z.object({ datasetId: z.string().min(1) })
const PrepParams = z.object({ prepId: z.string().min(1) })
const JobParams = z.object({ jobId: z.string().min(1) })
const Limit = z.object({ cursor: z.string().optional(), limit: z.coerce.number().int().positive().max(1000).default(100) })
const Insert = z.object({ values: Cells })
const Edit = z.object({ expectedVersion: z.number().int().nonnegative(), values: Cells })
const Remove = z.object({ expectedVersion: z.number().int().nonnegative() })
const Upsert = z.object({
    keys: Cells,
    values: Cells,
    expectedVersion: z.number().int().nonnegative().optional(),
})
const Publish = z.object({
    expectedVersion: z.number().int().positive(),
    mode: z.enum(['replace', 'append', 'upsert']),
    dataset: z.string().optional(),
    keys: z.array(z.string().min(1)).min(1).optional(),
    overwrite: z.boolean(),
})
const Sync = z.object({ expectedVersion: z.number().int().positive() })
const Topic = z.enum([
    'row.created',
    'row.updated',
    'row.deleted',
    'publication.completed',
    'publication.failed',
    'reconciliation.conflict_created',
    'reconciliation.conflict_resolved',
])
const Register = z.object({ event: Topic, url: z.string().url(), resource: z.string().optional() })
const Hook = Register.extend({ id: z.string(), created: z.number() })
const Ok = z.object({ ok: z.literal(true) })

export const veritlyDataController: FastifyPluginAsyncZod = async (app) => {
    app.get('/worker/data/preps', worker({ response: { [StatusCodes.OK]: Preps } }), async (request) => {
        return await call({ request, schema: Preps, method: 'GET', path: '/preps' })
    })

    app.get('/worker/data/preps/:prepId', worker({ params: PrepParams, response: { [StatusCodes.OK]: Prep } }), async (request) => {
        const params = PrepParams.parse(request.params)
        return await call({ request, schema: Prep, method: 'GET', path: `/preps/${encodeURIComponent(params.prepId)}` })
    })

    app.get('/worker/data/datasets', worker({ response: { [StatusCodes.OK]: Datasets } }), async (request) => {
        return await call({ request, schema: Datasets, method: 'GET', path: '/datasets' })
    })

    app.get('/worker/data/datasets/:datasetId/rows', worker({ params: RowsParams, querystring: Limit, response: { [StatusCodes.OK]: Rows } }), async (request) => {
        const params = RowsParams.parse(request.params)
        const query = Limit.parse(request.query)
        const search = new URLSearchParams({ limit: String(query.limit) })
        if (query.cursor) search.set('cursor', query.cursor)
        return await call({ request, schema: Rows, method: 'GET', path: `/datasets/${encodeURIComponent(params.datasetId)}/rows?${search}` })
    })

    app.post('/worker/data/datasets/:datasetId/rows', worker({ params: RowsParams, body: Insert, response: { [StatusCodes.OK]: Row } }), async (request) => {
        const params = RowsParams.parse(request.params)
        return await call({ request, schema: Row, method: 'POST', path: `/datasets/${encodeURIComponent(params.datasetId)}/rows`, body: Insert.parse(request.body) })
    })

    app.post('/worker/data/datasets/:datasetId/rows/:rowId/edit', worker({ params: RowParams, body: Edit, response: { [StatusCodes.OK]: Row } }), async (request) => {
        const params = RowParams.parse(request.params)
        return await call({ request, schema: Row, method: 'PATCH', path: `/datasets/${encodeURIComponent(params.datasetId)}/rows/${encodeURIComponent(params.rowId)}`, body: Edit.parse(request.body) })
    })

    app.delete('/worker/data/datasets/:datasetId/rows/:rowId', worker({ params: RowParams, body: Remove, response: { [StatusCodes.OK]: Receipt } }), async (request) => {
        const params = RowParams.parse(request.params)
        return await call({ request, schema: Receipt, method: 'DELETE', path: `/datasets/${encodeURIComponent(params.datasetId)}/rows/${encodeURIComponent(params.rowId)}`, body: Remove.parse(request.body) })
    })

    app.post('/worker/data/datasets/:datasetId/upsert', worker({ params: RowsParams, body: Upsert, response: { [StatusCodes.OK]: Row } }), async (request) => {
        const params = RowsParams.parse(request.params)
        return await call({ request, schema: Row, method: 'POST', path: `/datasets/${encodeURIComponent(params.datasetId)}/upsert`, body: Upsert.parse(request.body) })
    })

    app.post('/worker/data/preps/:prepId/publish', worker({ params: PrepParams, body: Publish, response: { [StatusCodes.OK]: Job } }), async (request) => {
        return await job({ request, path: 'publish', schema: Publish })
    })

    app.post('/worker/data/preps/:prepId/writeback', worker({ params: PrepParams, body: Sync, response: { [StatusCodes.OK]: Job } }), async (request) => {
        return await job({ request, path: 'writeback', schema: Sync })
    })

    app.post('/worker/data/preps/:prepId/reconcile', worker({ params: PrepParams, body: Sync, response: { [StatusCodes.OK]: Job } }), async (request) => {
        return await job({ request, path: 'reconcile', schema: Sync })
    })

    app.get('/worker/data/jobs/:jobId', worker({ params: JobParams, response: { [StatusCodes.OK]: Job } }), async (request) => {
        const params = JobParams.parse(request.params)
        return await call({ request, schema: Job, method: 'GET', path: `/jobs/${encodeURIComponent(params.jobId)}` })
    })

    app.post('/worker/data/webhook-registrations', worker({ body: Register, response: { [StatusCodes.OK]: Id } }), async (request) => {
        const hook = await call({ request, schema: Hook, method: 'POST', path: '/webhook-registrations', body: Register.parse(request.body) })
        return { id: hook.id }
    })

    app.delete('/worker/data/webhook-registrations/:id', worker({ params: Id, response: { [StatusCodes.OK]: Ok } }), async (request) => {
        const params = Id.parse(request.params)
        await call({ request, schema: Ok, method: 'DELETE', path: `/webhook-registrations/${encodeURIComponent(params.id)}` })
        return { ok: true }
    })
}

function worker(schema: WorkerSchema) {
    return { config: { security: securityAccess.engine() }, schema }
}

async function job(input: JobInput) {
    const params = PrepParams.parse(input.request.params)
    return await call({
        request: input.request,
        schema: Job,
        method: 'POST',
        path: `/preps/${encodeURIComponent(params.prepId)}/${input.path}`,
        body: input.schema.parse(input.request.body),
    })
}

async function call<T>(input: CallInput<T>) {
    return await data({
        log: input.request.log,
        project: project(input.request),
        schema: input.schema,
        method: input.method,
        path: input.path,
        body: input.body,
    })
}

function project(request: FastifyRequest) {
    return z.object({ projectId: z.string().min(1) }).parse(Reflect.get(request, 'principal')).projectId
}

type WorkerSchema = {
    params?: z.ZodType
    querystring?: z.ZodType
    body?: z.ZodType
    response: Record<number, z.ZodType>
}

type CallInput<T> = {
    request: FastifyRequest
    schema: z.ZodType<T>
    method: string
    path: string
    body?: unknown
}

type JobInput = {
    request: FastifyRequest
    path: 'publish' | 'writeback' | 'reconcile'
    schema: z.ZodType
}
