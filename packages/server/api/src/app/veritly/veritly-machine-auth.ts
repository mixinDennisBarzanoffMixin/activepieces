import { safeHttp } from '@activepieces/server-utils'
import type { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { projectService } from '../project/project-service'
import { projectAccess, WorkosAuthError } from './veritly-workos-auth'

const SCOPE = 'project:read project:write'
const CAP = 32
const Token = z.object({
    access_token: z.string().min(1).max(16 * 1024),
    expires_in: z.number().int().positive().max(86_400),
    token_type: z.string().min(1).max(32),
}).strict()
const cache = new Map<string, Cached>()

export async function machineToken(params: TokenParams) {
    const project = await projectService(params.log).getOneOrThrow(params.project)
    const scope = identity(project)
    const key = `${scope.tenant}\0${SCOPE}`
    const hit = cached(key)
    if (hit) return hit
    const credential = credentials()
    const res = await safeHttp.axios.post(endpoint(), new URLSearchParams({
        client_id: credential.id,
        client_secret: credential.secret,
        grant_type: 'client_credentials',
        scope: SCOPE,
    }), {
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        timeout: 5_000,
        maxRedirects: 0,
        maxBodyLength: 8 * 1024,
        maxContentLength: 32 * 1024,
        validateStatus: () => true,
    })
    if (res.status !== 200) {
        throw new WorkosAuthError('WorkOS machine token exchange is unavailable', 503)
    }
    const token = Token.safeParse(res.data)
    if (!token.success || token.data.token_type.toLowerCase() !== 'bearer') {
        throw new WorkosAuthError('WorkOS machine token response is invalid', 503)
    }
    const access = await projectAccess({ token: token.data.access_token, project: scope.project })
    if (access.tenant_id !== scope.tenant
        || access.principal.kind !== 'machine'
        || access.principal.id !== credential.id
        || !access.capabilities.includes('project:read')
        || !access.capabilities.includes('project:write')) {
        throw new WorkosAuthError('WorkOS machine token does not match the project grant', 503)
    }
    save(key, {
        token: token.data.access_token,
        expires: Date.now() + token.data.expires_in * 1_000,
    })
    return token.data.access_token
}

function cached(key: string) {
    const now = Date.now() + 30_000
    for (const [name, value] of cache) {
        if (value.expires <= now) cache.delete(name)
    }
    const value = cache.get(key)
    if (!value) return
    cache.delete(key)
    cache.set(key, value)
    return value.token
}

function save(key: string, value: Cached) {
    cache.delete(key)
    while (cache.size >= CAP) {
        const first = cache.keys().next().value
        if (typeof first !== 'string') throw new Error('WorkOS machine token cache is inconsistent')
        cache.delete(first)
    }
    cache.set(key, value)
}

function credentials() {
    const id = required('WORKOS_MACHINE_CLIENT_ID')
    const secret = required('WORKOS_MACHINE_CLIENT_SECRET')
    if (!/^client_[A-Za-z0-9_.-]{1,248}$/.test(id) || secret.length < 32 || secret.length > 4 * 1024) {
        throw new WorkosAuthError('WorkOS machine credential is invalid', 503)
    }
    return { id, secret }
}

function identity(value: { externalId?: string | null; metadata?: Record<string, unknown> | null }) {
    const prefix = 'veritly:project:'
    if (!value.externalId?.startsWith(prefix)) {
        throw new WorkosAuthError('Activepieces project has no Veritly identity', 503)
    }
    const project = value.externalId.slice(prefix.length)
    const meta = value.metadata
    if (!project || !record(meta) || !record(meta.veritly)
        || meta.veritly.projectId !== project
        || typeof meta.veritly.tenantId !== 'string'
        || !meta.veritly.tenantId) {
        throw new WorkosAuthError('Activepieces project has no Veritly tenant', 503)
    }
    return { project, tenant: meta.veritly.tenantId }
}

function record(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function required(name: string) {
    const value = process.env[name]?.trim()
    if (!value) throw new WorkosAuthError(`${name} is required`, 503)
    return value
}

function endpoint() {
    const url = new URL(required('WORKOS_MACHINE_ISSUER'))
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
        throw new WorkosAuthError('WORKOS_MACHINE_ISSUER is invalid', 503)
    }
    return new URL('/oauth2/token', url).toString()
}

type TokenParams = {
    log: FastifyBaseLogger
    project: string
}

type Cached = {
    token: string
    expires: number
}
