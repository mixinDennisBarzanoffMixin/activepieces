import { AuthUser, WORKOS_SESSION_COOKIE_NAME, workosSessionCookieOptions, workosSessionResolver } from '@veritly/auth-shared'
import { apId, DefaultProjectRole, PlatformRole, PrincipalType, Project, ProjectType, User, UserIdentity, UserIdentityProvider, UserPrincipal } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyReply, FastifyRequest } from 'fastify'
import { nanoid } from 'nanoid'
import { accessTokenManager } from '../authentication/lib/access-token-manager'
import { userIdentityRepository } from '../authentication/user-identity/user-identity-service'
import { projectMemberService } from '../ee/projects/project-members/project-member.service'
import { projectService } from '../project/project-service'
import { platformService } from '../platform/platform.service'
import { userService } from '../user/user-service'

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

export async function resolveVeritlyPrincipal({ request, reply, log }: ResolvePrincipalParams): Promise<UserPrincipal | undefined> {
    const session = await resolveVeritlySession({ request, reply, setStatus: false })
    if (!session.ok) return

    const ctx = await getVeritlyContext({
        log,
        user: session.user,
        veritlyProjectId: readProjectId(request),
    })

    return {
        id: ctx.user.id,
        type: PrincipalType.USER,
        platform: {
            id: ctx.platformId,
        },
        tokenVersion: ctx.identity.tokenVersion,
    }
}

export async function getVeritlySessionResponse({ request, reply, log }: ResolvePrincipalParams) {
    const session = await resolveVeritlySession({ request, reply })
    if (!session.ok) return session

    const ctx = await getVeritlyContext({
        log,
        user: session.user,
        veritlyProjectId: readProjectId(request),
    })
    const token = await accessTokenManager(log).generateToken({
        id: ctx.user.id,
        type: PrincipalType.USER,
        platform: {
            id: ctx.platformId,
        },
        tokenVersion: ctx.identity.tokenVersion,
    })
    const info = await userService(log).getMetaInformation({ id: ctx.user.id })
    return {
        ok: true as const,
        body: {
            ...info,
            trackEvents: ctx.identity.trackEvents,
            newsLetter: ctx.identity.newsLetter,
            verified: ctx.identity.verified,
            token,
            projectId: ctx.project.id,
        },
    }
}

export async function getVeritlyProject(params: GetContextParams): Promise<Project> {
    return (await getVeritlyContext(params)).project
}

async function getVeritlyContext(params: GetContextParams) {
    const platform = await platformService(params.log).getOldestPlatform()
    if (!platform) throw new Error('Activepieces platform is not configured')
    const identity = await getIdentity(params.user)
    const user = await getUser({
        log: params.log,
        identity,
        platformId: platform.id,
    })
    const project = await getProject({
        log: params.log,
        user,
        platformId: platform.id,
        veritlyProjectId: params.veritlyProjectId,
        veritlyUserId: params.user.id,
    })
    return {
        identity,
        user,
        project,
        platformId: platform.id,
    }
}

async function getIdentity(user: AuthUser): Promise<UserIdentity> {
    const email = user.email?.trim().toLowerCase() || `veritly-${user.id}@users.veritly.local`
    const existing = await userIdentityRepository().findOneBy({ email })
    if (existing) return existing

    return userIdentityRepository().save({
        id: apId(),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        email,
        password: nanoid(),
        firstName: user.firstName?.trim() || 'Veritly',
        lastName: user.lastName?.trim() || 'User',
        trackEvents: false,
        newsLetter: false,
        verified: true,
        tokenVersion: nanoid(),
        provider: UserIdentityProvider.JWT,
        imageUrl: user.profilePictureUrl ?? null,
        lastLoggedInPlatformId: null,
    })
}

async function getUser(params: GetUserParams): Promise<User> {
    const existing = await userService(params.log).getOneByIdentityAndPlatform({
        identityId: params.identity.id,
        platformId: params.platformId,
    })
    if (existing) return existing

    return userService(params.log).create({
        identityId: params.identity.id,
        platformId: params.platformId,
        platformRole: PlatformRole.MEMBER,
        externalId: veritlyUserExternalId(params.identity.id),
    })
}

async function getProject(params: GetProjectParams): Promise<Project> {
    const externalId = projectExternalId(params.veritlyProjectId)
    const existing = await projectService(params.log).getByPlatformIdAndExternalId({
        platformId: params.platformId,
        externalId,
    })
    if (existing) {
        await projectMemberService(params.log).upsert({
            userId: params.user.id,
            projectId: existing.id,
            projectRoleName: DefaultProjectRole.ADMIN,
        })
        return existing
    }

    const project = await projectService(params.log).create({
        platformId: params.platformId,
        ownerId: params.user.id,
        type: ProjectType.TEAM,
        displayName: `Veritly ${params.veritlyProjectId}`,
        externalId,
        metadata: {
            veritly: {
                projectId: params.veritlyProjectId,
                creatorUserId: params.veritlyUserId,
            },
        },
    })
    await projectMemberService(params.log).upsert({
        userId: params.user.id,
        projectId: project.id,
        projectRoleName: DefaultProjectRole.ADMIN,
    })
    return project
}

function readProjectId(request: FastifyRequest) {
    const value = request.headers['x-veritly-project-id']?.toString()
    if (value) return value
    throw new Error('missing x-veritly-project-id')
}

function projectExternalId(veritlyProjectId: string) {
    return `veritly:project:${veritlyProjectId}`
}

function veritlyUserExternalId(id: string) {
    return `veritly:user:${id}`
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

type GetContextParams = {
    log: FastifyBaseLogger
    user: AuthUser
    veritlyProjectId: string
}

type GetUserParams = {
    log: FastifyBaseLogger
    identity: UserIdentity
    platformId: string
}

type GetProjectParams = {
    log: FastifyBaseLogger
    user: User
    platformId: string
    veritlyProjectId: string
    veritlyUserId: string
}
