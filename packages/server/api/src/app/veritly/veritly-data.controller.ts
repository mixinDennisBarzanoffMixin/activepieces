import type { PageQuery } from '@veritly/contracts'
import { responses } from '@veritly/contracts/zod'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { data } from './veritly-data.service'

const Page = z.object({
    cursor: z.string().min(1).optional(),
    limit: z.coerce.number().int().positive().max(100).default(100),
}).strict()
const Job = z.object({ id: z.string().min(1).max(128) }).strict()

export const veritlyDataController: FastifyPluginAsyncZod = async (app) => {
    app.get('/worker/data/preps', worker({
        querystring: Page,
        response: { [StatusCodes.OK]: responses.PrepPage },
    }), async (request, reply) => {
        return send(reply, await data.preps({
            log: request.log,
            project: project(request),
            query: page(request.query),
        }))
    })

    app.get('/worker/data/datasets', worker({
        querystring: Page,
        response: { [StatusCodes.OK]: responses.DatasetPage },
    }), async (request, reply) => {
        return send(reply, await data.datasets({
            log: request.log,
            project: project(request),
            query: page(request.query),
        }))
    })

    app.get('/worker/data/jobs/:id', worker({
        params: Job,
        response: { [StatusCodes.OK]: responses.Job },
    }), async (request, reply) => {
        return send(reply, await data.job({
            log: request.log,
            project: project(request),
            id: Job.parse(request.params).id,
        }))
    })
}

function worker(schema: WorkerSchema) {
    return { config: { security: securityAccess.engine() }, schema }
}

function send(reply: FastifyReply, result: Result) {
    if (result.kind === 'response') return reply.status(result.status).send(result.value)
    return reply.status(result.status).send(error(result.error))
}

function error(value: ResultError) {
    if ('known' in value && value.known === false) return value.raw
    return value
}

function page(input: unknown): PageQuery {
    const value = Page.parse(input)
    return { cursor: value.cursor === undefined ? null : value.cursor, limit: value.limit }
}

function project(request: FastifyRequest) {
    return z.object({ projectId: z.string().min(1) }).parse(Reflect.get(request, 'principal')).projectId
}

type WorkerSchema = {
    params?: z.ZodType
    querystring?: z.ZodType
    response: Record<number, z.ZodType>
}

type Result =
    | Awaited<ReturnType<typeof data.preps>>
    | Awaited<ReturnType<typeof data.datasets>>
    | Awaited<ReturnType<typeof data.job>>

type ResultError = Extract<Result, { kind: 'error' }>['error']
