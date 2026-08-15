import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { projectService } from '../project/project-service'

export async function data<T>(input: RequestInput<T>) {
    const res = await dataRaw(input)
    const text = await res.text()
    if (!text) return input.schema.parse(undefined)
    return input.schema.parse(JSON.parse(text))
}

export async function dataRaw(input: RawInput) {
    const target = process.env.DATA_BACKEND_URL?.trim()
    if (!target) throw new Error('DATA_BACKEND_URL is required')
    const token = process.env.DATA_SERVICE_TOKEN?.trim()
    if (!token) throw new Error('DATA_SERVICE_TOKEN is required')
    const project = await projectService(input.log).getOneOrThrow(input.project)
    const id = identity(project)
    const res = await fetch(new URL(`/project/${encodeURIComponent(id.projectId)}/api/data${input.path}`, target), {
        method: input.method,
        headers: {
            'Content-Type': 'application/json',
            'x-veritly-service-token': token,
            'x-veritly-user-id': id.userId,
            'x-veritly-project-id': id.projectId,
            'x-veritly-actor-kind': 'automation',
        },
        body: input.body === undefined ? undefined : JSON.stringify(input.body),
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
    return { userId, projectId: ext.slice(prefix.length) }
}

function record(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
}

type RawInput = {
    log: FastifyBaseLogger
    project: string
    method: string
    path: string
    body?: unknown
}

type RequestInput<T> = RawInput & { schema: z.ZodType<T> }
