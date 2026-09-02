import { apId, DefaultProjectRole, PlatformRole, PrincipalType, Project, ProjectType, User, UserIdentity, UserIdentityProvider, UserPrincipal } from '@activepieces/shared'
import type { ProjectRole } from '@veritly/contracts'
import { FastifyBaseLogger, FastifyReply, FastifyRequest } from 'fastify'
import { nanoid } from 'nanoid'
import { accessTokenManager } from '../authentication/lib/access-token-manager'
import { userIdentityRepository } from '../authentication/user-identity/user-identity-service'
import { distributedLock } from '../database/redis-connections'
import { projectMemberService } from '../ee/projects/project-members/project-member.service'
import { projectService } from '../project/project-service'
import { platformService } from '../platform/platform.service'
import { userService } from '../user/user-service'
import { headers } from './veritly-header'
import { isWorkosToken } from './veritly-token'
import { verifyWorkos, WorkosAuthError } from './veritly-workos-auth'

export async function resolveVeritlySession(params: ResolveSessionParams) {
    try {
        const values = headers(params.request, 'x-veritly-project-id')
        const project = values.length === 1 ? values[0]! : ''
        if (!/^project_[A-Za-z0-9_.-]+$/.test(project) || project.length > 128) {
            throw new WorkosAuthError('x-veritly-project-id is invalid', 400)
        }
        const auth = await verifyWorkos(params.request, project)
        if (auth.access.principal.kind !== 'user') {
            throw new WorkosAuthError('machine principals cannot open an Activepieces user session', 403)
        }
        return {
            ok: true as const,
            user: {
                id: auth.access.principal.id,
                tenantId: auth.access.tenant_id,
                projectId: auth.access.project_id,
                role: auth.access.role,
            },
        }
    } catch (err) {
        const auth = err instanceof WorkosAuthError ? err : new WorkosAuthError('WorkOS authorization failed', 503)
        if (params.reply && params.setStatus !== false) {
            params.reply.status(auth.statusCode)
        }
        return { ok: false as const, body: { error: auth.message } }
    }
}

export async function resolveVeritlyPrincipal({ request, reply, log }: ResolvePrincipalParams): Promise<UserPrincipal | undefined> {
    const values = headers(request, 'authorization')
    if (values.length === 0) return
    if (values.length !== 1) throw new WorkosAuthError('authorization header is invalid')
    const auth = values[0]!
    if (!auth.startsWith('Bearer ') || !isWorkosToken(auth.slice(7))) return
    const session = await resolveVeritlySession({ request, reply, setStatus: false })
    if (!session.ok) throw new WorkosAuthError(session.body.error)

    const ctx = await getVeritlyContext({
        log,
        user: session.user,
        veritlyProjectId: session.user.projectId,
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

    const veritlyProjectId = session.user.projectId
    const ctx = await getVeritlyContext({
        log,
        user: session.user,
        veritlyProjectId,
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

export async function getVeritlyContext(params: GetContextParams) {
    if (params.veritlyProjectId !== params.user.projectId) {
        throw new WorkosAuthError('project access is denied', 403)
    }
    return distributedLock(params.log).runExclusive({
        key: `veritly:provision:${params.user.tenantId}`,
        timeoutInSeconds: 15,
        fn: async () => {
            const identity = await getIdentity(params.user)
            const platform = await getPlatform({ log: params.log })
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
                veritlyTenantId: params.user.tenantId,
                role: params.user.role,
            })
            return {
                identity,
                user,
                project,
                platformId: platform.id,
            }
        },
    })
}

async function getPlatform(params: GetPlatformParams) {
    const id = process.env.VERITLY_AP_PLATFORM_ID?.trim()
    const owner = process.env.VERITLY_AP_OWNER_ID?.trim()
    if (!id || !owner) throw new WorkosAuthError('Veritly Activepieces platform is not provisioned', 503)
    const platform = await platformService(params.log).getOneOrThrow(id)
    if (platform.ownerId !== owner) {
        throw new WorkosAuthError('Veritly Activepieces platform owner is invalid', 503)
    }
    return platform
}

async function getIdentity(user: VeritlyUser): Promise<UserIdentity> {
    const email = `veritly-${user.id}@users.veritly.local`
    const existing = await userIdentityRepository().findOneBy({ email })
    if (existing) {
        return existing
    }

    return userIdentityRepository().save({
        id: apId(),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        email,
        password: nanoid(),
        firstName: 'Veritly',
        lastName: 'User',
        trackEvents: false,
        newsLetter: false,
        verified: true,
        tokenVersion: nanoid(),
        provider: UserIdentityProvider.JWT,
        imageUrl: null,
        lastLoggedInPlatformId: null,
    })
}

async function getUser(params: GetUserParams): Promise<User> {
    const existing = await userService(params.log).getOneByIdentityAndPlatform({
        identityId: params.identity.id,
        platformId: params.platformId,
    })
    if (existing) {
        return existing
    }

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
        const metadata = existing.metadata as Record<string, unknown> | null
        const veritly = metadata?.veritly
        if (typeof veritly !== 'object' || veritly === null) {
            throw new WorkosAuthError('project access is denied', 403)
        }
        const access = veritly as Record<string, unknown>
        if (access.projectId !== params.veritlyProjectId
            || access.tenantId !== params.veritlyTenantId) {
            throw new WorkosAuthError('project access is denied', 403)
        }
        await projectMemberService(params.log).upsert({
            userId: params.user.id,
            projectId: existing.id,
            projectRoleName: role(params.role),
        })
        return existing
    }

    const project = await projectService(params.log).create({
        platformId: params.platformId,
        ownerId: required('VERITLY_AP_OWNER_ID'),
        type: ProjectType.TEAM,
        displayName: `Veritly ${params.veritlyProjectId}`,
        externalId,
        metadata: {
            veritly: {
                projectId: params.veritlyProjectId,
                tenantId: params.veritlyTenantId,
            },
        },
    })
    await projectMemberService(params.log).upsert({
        userId: params.user.id,
        projectId: project.id,
        projectRoleName: role(params.role),
    })
    return project
}

function projectExternalId(veritlyProjectId: string) {
    return `veritly:project:${veritlyProjectId}`
}

function veritlyUserExternalId(id: string) {
    return `veritly:user:${id}`
}

function role(value: ProjectRole) {
    if (value === 'owner' || value === 'admin') return DefaultProjectRole.ADMIN
    if (value === 'editor') return DefaultProjectRole.EDITOR
    if (value === 'viewer') return DefaultProjectRole.VIEWER
    throw new WorkosAuthError('automation grants cannot open an Activepieces user session', 403)
}

function required(name: string) {
    const value = process.env[name]?.trim()
    if (!value) throw new WorkosAuthError(`${name} is required`, 503)
    return value
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
    user: VeritlyUser
    veritlyProjectId: string
}

type GetUserParams = {
    log: FastifyBaseLogger
    identity: UserIdentity
    platformId: string
}

type GetPlatformParams = {
    log: FastifyBaseLogger
}

type GetProjectParams = {
    log: FastifyBaseLogger
    user: User
    platformId: string
    veritlyProjectId: string
    veritlyTenantId: string
    role: ProjectRole
}

type VeritlyUser = {
    id: string
    tenantId: string
    projectId: string
    role: ProjectRole
}
