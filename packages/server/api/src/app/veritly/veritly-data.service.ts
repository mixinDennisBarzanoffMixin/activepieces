import { randomUUID } from 'node:crypto'
import type { PageQuery } from '@veritly/contracts'
import {
    dataRoutes,
    decodeDataRouteError,
    type RouteResult,
} from '@veritly/contracts/client'
import { responses } from '@veritly/contracts/zod'
import { safeHttp } from '@activepieces/server-utils'
import type { FastifyBaseLogger } from 'fastify'
import { projectService } from '../project/project-service'
import { edge } from './veritly-edge'
import { machineToken } from './veritly-machine-auth'

class DataService {
    async preps(input: Scope & { query: PageQuery }): Promise<RouteResult<'data', 'data_preps'>> {
        const res = await this.raw({ ...input, route: 'data_preps', query: input.query })
        if (res.status !== 200) {
            return {
                kind: 'error',
                status: res.status,
                error: decodeDataRouteError('data_preps', res.status, res.body),
            }
        }
        return {
            kind: 'response',
            status: 200,
            value: responses.PrepPage.parse(JSON.parse(res.body)),
        }
    }

    async datasets(input: Scope & { query: PageQuery }): Promise<RouteResult<'data', 'data_datasets'>> {
        const res = await this.raw({ ...input, route: 'data_datasets', query: input.query })
        if (res.status !== 200) {
            return {
                kind: 'error',
                status: res.status,
                error: decodeDataRouteError('data_datasets', res.status, res.body),
            }
        }
        return {
            kind: 'response',
            status: 200,
            value: responses.DatasetPage.parse(JSON.parse(res.body)),
        }
    }

    async job(input: Scope & { id: string }): Promise<RouteResult<'data', 'data_job'>> {
        const res = await this.raw({ ...input, route: 'data_job', params: { id: input.id } })
        if (res.status !== 200) {
            return {
                kind: 'error',
                status: res.status,
                error: decodeDataRouteError('data_job', res.status, res.body),
            }
        }
        return {
            kind: 'response',
            status: 200,
            value: responses.Job.parse(JSON.parse(res.body)),
        }
    }

    private async raw(input: Call) {
        const project = await projectService(input.log).getOneOrThrow(input.project)
        const scope = identity(project)
        const token = await machineToken({ log: input.log, project: input.project })
        const route = dataRoutes[input.route]
        const url = new URL(`/data${path(route.path, scope, input.params)}`, edge())
        if (input.query) {
            url.searchParams.set('limit', String(input.query.limit))
            if (input.query.cursor !== null) url.searchParams.set('cursor', input.query.cursor)
        }
        const res = await safeHttp.axios.request({
            url: url.toString(),
            method: route.method,
            headers: {
                authorization: `Bearer ${token}`,
                'x-request-id': randomUUID(),
                'x-veritly-project-id': scope,
            },
            timeout: deadline(route.timeouts),
            maxRedirects: 0,
            maxContentLength: 8 * 1024 * 1024,
            responseType: 'text',
            transformResponse: [(value: unknown) => value],
            validateStatus: () => true,
        })
        return { status: res.status, body: text(res.data) }
    }
}

function path(pattern: string, project: string, params: Readonly<Record<string, string>> | undefined) {
    const value = Object.entries({ project, ...params }).reduce(
        (out, [name, item]) => out.replace(`{${name}}`, encodeURIComponent(item)),
        pattern,
    )
    if (value.includes('{')) throw new Error(`Data route path is incomplete: ${pattern}`)
    return value
}

function deadline(input: { response_total: number | null; headers: number | null }) {
    if (input.response_total !== null) return input.response_total
    if (input.headers !== null) return input.headers
    throw new Error('Data route has no response deadline')
}

function identity(project: { externalId?: string | null; metadata?: Record<string, unknown> | null }) {
    const prefix = 'veritly:project:'
    const ext = project.externalId
    if (!ext?.startsWith(prefix)) throw new Error('Activepieces project is missing Veritly external id')
    const id = ext.slice(prefix.length)
    if (!id || !record(project.metadata) || !record(project.metadata.veritly)
        || project.metadata.veritly.projectId !== id) {
        throw new Error('Activepieces project Veritly identity is inconsistent')
    }
    return id
}

function text(value: unknown) {
    if (typeof value === 'string') return value
    if (Buffer.isBuffer(value)) return value.toString('utf8')
    throw new TypeError('Data response body is not text')
}

function record(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export const data = new DataService()

type Scope = {
    log: FastifyBaseLogger
    project: string
}

type Call = Scope & {
    route: 'data_preps' | 'data_datasets' | 'data_job'
    params?: Readonly<Record<string, string>>
    query?: PageQuery
}
