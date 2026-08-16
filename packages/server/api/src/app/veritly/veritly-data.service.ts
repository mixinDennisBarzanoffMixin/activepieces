import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { projectService } from '../project/project-service'

const Env = z.object({
    DATA_BACKEND_URL: z.string().trim().url(),
    DATA_SERVICE_TOKEN: z.string().trim().min(1),
})
const Project = z.object({
    externalId: z.string().startsWith('veritly:project:'),
    metadata: z.object({
        veritly: z.object({ creatorUserId: z.string().min(1) }),
    }),
})

class DataService {
    async request<T>(input: RequestInput<T>) {
        return input.schema.parse(await (await this.raw(input)).json())
    }

    private async raw(input: RawInput) {
        const env = Env.parse(process.env)
        const project = Project.parse(await projectService(input.log).getOneOrThrow(input.project))
        const id = {
            user: project.metadata.veritly.creatorUserId,
            project: project.externalId.slice('veritly:project:'.length),
        }
        if (!id.project) throw new Error('Activepieces project Veritly id is empty')
        const res = await fetch(new URL(`/project/${encodeURIComponent(id.project)}/api/data${input.path}`, env.DATA_BACKEND_URL), {
            method: input.method,
            headers: {
                'Content-Type': 'application/json',
                'x-veritly-service-token': env.DATA_SERVICE_TOKEN,
                'x-veritly-user-id': id.user,
                'x-veritly-project-id': id.project,
                'x-veritly-actor-kind': 'automation',
            },
            body: input.body === undefined ? undefined : JSON.stringify(input.body),
            signal: AbortSignal.timeout(5_000),
        })
        if (!res.ok) throw new Error(await res.text())
        return res
    }
}

export const data = new DataService()

type RawInput = {
    log: FastifyBaseLogger
    project: string
    method: string
    path: string
    body?: unknown
}

type RequestInput<T> = RawInput & { schema: z.ZodType<T> }
