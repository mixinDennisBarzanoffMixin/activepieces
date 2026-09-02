import { randomUUID } from 'node:crypto'
import type { ProjectAccess } from '@veritly/contracts'
import {
    decodeServerRouteError,
    routes,
    type RouteErrorFor,
} from '@veritly/contracts/client'
import { responses } from '@veritly/contracts/zod'
import { safeHttp } from '@activepieces/server-utils'
import type { FastifyRequest } from 'fastify'
import { edge } from './veritly-edge'
import { headers } from './veritly-header'
import { validToken } from './veritly-token'

export async function verifyWorkos(request: FastifyRequest, project: string) {
    const values = headers(request, 'authorization')
    const token = values.length === 1 ? bearer(values[0]!) : undefined
    if (!token) throw new WorkosAuthError('WorkOS bearer token is required')
    return { token, access: await projectAccess({ token, project }) }
}

export async function projectAccess(input: AccessInput): Promise<ProjectAccess> {
    const route = routes.project_access
    const res = await safeHttp.axios.get(
        new URL(path(route.path, input.project), edge()).toString(),
        {
            headers: {
                authorization: `Bearer ${input.token}`,
                'x-request-id': randomUUID(),
                'x-veritly-project-id': input.project,
            },
            timeout: deadline(route.timeouts),
            maxRedirects: 0,
            maxContentLength: 64 * 1024,
            responseType: 'text',
            transformResponse: [(value: unknown) => value],
            validateStatus: () => true,
        },
    )
    const body = text(res.data)
    if (res.status !== 200) {
        const err = decodeServerRouteError('project_access', res.status, body)
        throw new WorkosAuthError(message(err), status(res.status), err)
    }
    const access = responses.ProjectAccess.parse(JSON.parse(body))
    if (access.project_id !== input.project) {
        throw new WorkosAuthError('project authorization response is invalid', 503)
    }
    return access
}

function bearer(value: string) {
    if (!value.startsWith('Bearer ')) return
    const token = value.slice(7)
    return validToken(token) ? token : undefined
}

function path(pattern: string, project: string) {
    const value = pattern.replace('{project}', encodeURIComponent(project))
    if (value.includes('{')) throw new Error(`Server route path is incomplete: ${pattern}`)
    return value
}

function deadline(input: { response_total: number | null; headers: number | null }) {
    if (input.response_total !== null) return input.response_total
    if (input.headers !== null) return input.headers
    throw new Error('Server project access route has no response deadline')
}

function status(value: number) {
    if (value === 401) return 401
    if (value === 403 || value === 404) return 403
    return 503
}

function message(error: RouteErrorFor<'server', 'project_access'>) {
    return `project authorization failed with ${error.code}`
}

function text(value: unknown) {
    if (typeof value === 'string') return value
    if (Buffer.isBuffer(value)) return value.toString('utf8')
    throw new WorkosAuthError('project authorization response is invalid', 503)
}

export class WorkosAuthError extends Error {
    constructor(
        message: string,
        public readonly statusCode = 401,
        public readonly route?: RouteErrorFor<'server', 'project_access'>,
    ) {
        super(message)
    }
}

type AccessInput = {
    token: string
    project: string
}
