import { WORKOS_SESSION_COOKIE_NAME, workosSessionCookieOptions, workosSessionResolver } from '@veritly/auth-shared'
import { PrincipalType, ServicePrincipal } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyReply, FastifyRequest } from 'fastify'
import { platformService } from '../platform/platform.service'

const resolver = workosSessionResolver()

export async function resolveVeritlySession(params: ResolveSessionParams) {
    const request = params.request
    const result = await resolver.resolve(toRequest(request))
    if (!result.ok) {
        if (params.reply && params.setStatus !== false) params.reply.status(result.reason === 'misconfigured' ? 503 : 401)
        return { ok: false as const, body: { error: result.message } }
    }
    if (params.reply && result.refreshedSessionData) {
        params.reply.header('set-cookie', sessionCookie(result.refreshedSessionData))
    }
    return { ok: true as const, user: result.user }
}

export async function resolveVeritlyPrincipal({ request, reply, log }: ResolvePrincipalParams): Promise<ServicePrincipal | undefined> {
    const session = await resolveVeritlySession({ request, reply, setStatus: false })
    if (!session.ok) return

    const platform = await platformService(log).getOldestPlatform()
    if (!platform) return

    return {
        id: session.user.id,
        type: PrincipalType.SERVICE,
        platform: {
            id: platform.id,
        },
    }
}

function toRequest(request: FastifyRequest) {
    const headers = new Headers()
    for (const [key, value] of Object.entries(request.headers)) {
        if (Array.isArray(value)) {
            for (const item of value) headers.append(key, item)
            continue
        }
        if (value !== undefined) headers.set(key, String(value))
    }
    return new Request(`http://activepieces.local${request.url}`, { headers })
}

function sessionCookie(value: string) {
    const options = workosSessionCookieOptions()
    const parts = [
        `${WORKOS_SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`,
        `Path=${options.path}`,
        `Max-Age=${options.maxAge}`,
        'HttpOnly',
        `SameSite=${options.sameSite}`,
    ]
    if (options.secure) parts.push('Secure')
    if ('domain' in options) parts.push(`Domain=${options.domain}`)
    return parts.join('; ')
}

type ResolveSessionParams = {
    request: FastifyRequest
    reply?: FastifyReply
    setStatus?: boolean
}

type ResolvePrincipalParams = ResolveSessionParams & {
    log: FastifyBaseLogger
}
