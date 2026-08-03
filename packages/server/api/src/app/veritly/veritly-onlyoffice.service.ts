import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { projectService } from '../project/project-service'

export async function onlyoffice<T>(log: FastifyBaseLogger, projectId: string, schema: z.ZodType<T>, method: string, path: string, body?: unknown) {
    const res = await onlyofficeRaw(log, projectId, method, path, body)
    const text = await res.text()
    if (!text) return schema.parse(undefined)
    return schema.parse(JSON.parse(text))
}

export async function onlyofficeRaw(log: FastifyBaseLogger, projectId: string, method: string, path: string, body?: unknown) {
    const target = process.env.ONLYOFFICE_BACKEND_URL?.trim()
    if (!target) throw new Error('ONLYOFFICE_BACKEND_URL is required')
    const token = process.env.ONLYOFFICE_SERVICE_TOKEN?.trim()
    if (!token) throw new Error('ONLYOFFICE_SERVICE_TOKEN is required')
    const project = await projectService(log).getOneOrThrow(projectId)
    const id = identity(project)
    const res = await fetch(new URL(`/onlyoffice-api${path}`, target), {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-veritly-service-token': token,
            'x-veritly-user-id': id.userId,
            'x-veritly-project-id': id.projectId,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(5_000),
    })
    if (!res.ok) throw new Error(await res.text())
    return res
}

function identity(project: { externalId?: string | null, metadata?: Record<string, unknown> | null }) {
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

function record(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
}
