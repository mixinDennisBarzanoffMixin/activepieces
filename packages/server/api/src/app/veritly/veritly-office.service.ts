import { createHash, randomUUID } from 'node:crypto'
import type {
    OfficeDestinationCreateInput,
    OfficeDestinationCreateResult,
    OfficeFileRow,
    OfficeWebhookInput,
    OfficeWebhookPayload,
    OfficeWebhookRow,
    OfficeWebhookVerifyInput,
} from '@veritly/contracts'
import {
    decodeOfficeRouteError,
    officeRoutes,
    type RouteErrorFor,
    type RouteResult,
} from '@veritly/contracts/client'
import { decodeOfficeWebhookPayload, responses } from '@veritly/contracts/zod'
import { safeHttp } from '@activepieces/server-utils'
import type { FastifyBaseLogger } from 'fastify'
import { projectService } from '../project/project-service'
import { edge } from './veritly-edge'
import { machineToken } from './veritly-machine-auth'

export async function files(input: Scope): Promise<RouteResult<'office', 'office_list'>> {
    const res = await send({ ...input, route: 'office_list', query: { limit: '100' } })
    if (res.status !== 200) {
        return {
            kind: 'error',
            status: res.status,
            error: decodeOfficeRouteError('office_list', res.status, res.body),
        }
    }
    return {
        kind: 'response',
        status: 200,
        value: responses.OfficeFilePage.parse(json(res.body)),
    }
}

export async function content(input: Scope & { file: string }): Promise<ContentResult> {
    const res = await send({
        ...input,
        route: 'office_export',
        params: { id: input.file },
        binary: true,
    })
    if (res.status !== 200) {
        return {
            kind: 'error',
            status: res.status,
            error: decodeOfficeRouteError('office_export', res.status, text(res.data)),
        }
    }
    return {
        kind: 'response',
        status: 200,
        value: bytes(res.data),
        type: header(res.headers, 'content-type'),
        disposition: optional(res.headers, 'content-disposition'),
    }
}

export async function destination(
    input: Scope & { key: string; value: OfficeDestinationCreateInput },
): Promise<RouteResult<'office', 'office_destination_create'>> {
    const res = await send({
        ...input,
        route: 'office_destination_create',
        body: input.value,
        key: input.key,
    })
    if (res.status !== 201) {
        return {
            kind: 'error',
            status: res.status,
            error: decodeOfficeRouteError('office_destination_create', res.status, res.body),
        }
    }
    return {
        kind: 'response',
        status: 201,
        value: responses.OfficeDestinationCreateResult.parse(json(res.body)),
    }
}

export async function hook(
    input: Scope & { key: string; value: OfficeWebhookInput },
): Promise<RouteResult<'office', 'office_hook'>> {
    const res = await send({ ...input, route: 'office_hook', body: input.value, key: input.key })
    if (res.status !== 201) {
        return {
            kind: 'error',
            status: res.status,
            error: decodeOfficeRouteError('office_hook', res.status, res.body),
        }
    }
    return {
        kind: 'response',
        status: 201,
        value: responses.OfficeWebhookRow.parse(json(res.body)),
    }
}

export async function verify(
    input: Scope & { key: string; webhook: string; value: OfficeWebhookVerifyInput },
): Promise<RouteResult<'office', 'office_webhook_verify'>> {
    const res = await send({
        ...input,
        route: 'office_webhook_verify',
        params: { id: input.webhook },
        body: input.value,
        key: input.key,
    })
    if (res.status !== 200) {
        return {
            kind: 'error',
            status: res.status,
            error: decodeOfficeRouteError('office_webhook_verify', res.status, res.body),
        }
    }
    return {
        kind: 'response',
        status: 200,
        value: decodeOfficeWebhookPayload(res.body),
    }
}

export async function unhook(
    input: Scope & { webhook: string },
): Promise<RouteResult<'office', 'office_unhook'>> {
    const res = await send({
        ...input,
        route: 'office_unhook',
        params: { id: input.webhook },
    })
    if (res.status !== 204) {
        return {
            kind: 'error',
            status: res.status,
            error: decodeOfficeRouteError('office_unhook', res.status, res.body),
        }
    }
    return { kind: 'response', status: 204, value: undefined }
}

export async function removeDestination(
    input: Scope & { destination: string },
): Promise<RouteResult<'office', 'office_destination_remove'>> {
    const res = await send({
        ...input,
        route: 'office_destination_remove',
        params: { id: input.destination },
    })
    if (res.status !== 204) {
        return {
            kind: 'error',
            status: res.status,
            error: decodeOfficeRouteError('office_destination_remove', res.status, res.body),
        }
    }
    return { kind: 'response', status: 204, value: undefined }
}

export function registrationKey(input: { project: string; flow: string; trigger: string; kind: 'destination' | 'hook' }) {
    return `office_${input.kind}_${createHash('sha256')
        .update(input.project)
        .update('\0')
        .update(input.flow)
        .update('\0')
        .update(input.trigger)
        .digest('hex')}`
}

async function send(input: Call): Promise<Wire> {
    const project = await projectService(input.log).getOneOrThrow(input.project)
    const scope = identity(project)
    const token = await machineToken({ log: input.log, project: input.project })
    const route = officeRoutes[input.route]
    const headers: Record<string, string> = {
        authorization: `Bearer ${token}`,
        'x-request-id': randomUUID(),
        'x-veritly-project-id': scope,
    }
    if (input.body !== undefined) headers['content-type'] = 'application/json'
    if (route.idempotency === 'required_header') {
        if (!input.key) throw new Error(`Office route ${input.route} requires an idempotency key`)
        headers['idempotency-key'] = input.key
    }
    if (route.idempotency !== 'required_header' && input.key) {
        throw new Error(`Office route ${input.route} does not accept an idempotency key`)
    }
    const url = new URL(path(route.path, input.params), edge())
    if (input.query) {
        Object.entries(input.query).forEach(([name, value]) => url.searchParams.set(name, value))
    }
    const res = await safeHttp.axios.request({
        url: url.toString(),
        method: route.method,
        headers,
        data: input.body,
        timeout: timeout(route.timeouts),
        maxRedirects: 0,
        maxBodyLength: 90 * 1024,
        maxContentLength: 100 * 1024 * 1024,
        responseType: input.binary ? 'arraybuffer' : 'text',
        transformResponse: [(value: unknown) => value],
        validateStatus: () => true,
    })
    return {
        status: res.status,
        body: input.binary ? '' : text(res.data),
        data: res.data,
        headers: res.headers,
    }
}

function path(pattern: string, params: Readonly<Record<string, string>> | undefined) {
    const value = (params ? Object.entries(params) : []).reduce(
        (out, [key, item]) => out.replace(`{${key}}`, encodeURIComponent(item)),
        pattern,
    )
    if (value.includes('{')) throw new Error(`Office route path is incomplete: ${pattern}`)
    return value
}

function timeout(input: { response_total: number | null; headers: number | null }) {
    if (input.response_total !== null) return input.response_total
    if (input.headers !== null) return input.headers
    throw new Error('Office route has no response deadline')
}

function identity(project: { externalId?: string | null; metadata?: Record<string, unknown> | null }) {
    const prefix = 'veritly:project:'
    const ext = project.externalId
    if (!ext?.startsWith(prefix)) throw new Error('Activepieces project is missing Veritly external id')
    const meta = project.metadata
    if (!record(meta)) throw new Error('Activepieces project metadata is missing')
    if (!record(meta.veritly)) throw new Error('Activepieces project Veritly metadata is missing')
    const id = ext.slice(prefix.length)
    if (!id) throw new Error('Activepieces project Veritly external id is empty')
    if (meta.veritly.projectId !== id || typeof meta.veritly.tenantId !== 'string' || !meta.veritly.tenantId) {
        throw new Error('Activepieces project Veritly identity is inconsistent')
    }
    return id
}

function json(value: string): unknown {
    return JSON.parse(value)
}

function text(value: unknown) {
    if (typeof value === 'string') return value
    if (Buffer.isBuffer(value)) return value.toString('utf8')
    throw new TypeError('Office response body is not text')
}

function bytes(value: unknown) {
    if (Buffer.isBuffer(value)) return value
    if (value instanceof ArrayBuffer) return Buffer.from(value)
    throw new TypeError('Office response body is not binary')
}

function header(headers: unknown, name: string) {
    const value = optional(headers, name)
    if (!value) throw new TypeError(`Office response is missing ${name}`)
    return value
}

function optional(headers: unknown, name: string) {
    if (!record(headers)) return
    const value = headers[name]
    return typeof value === 'string' ? value : undefined
}

function record(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
}

type Scope = {
    log: FastifyBaseLogger
    project: string
}

type Call = Scope & {
    route:
        | 'office_list'
        | 'office_export'
        | 'office_hook'
        | 'office_webhook_verify'
        | 'office_unhook'
        | 'office_destination_create'
        | 'office_destination_remove'
    params?: Readonly<Record<string, string>>
    query?: Readonly<Record<string, string>>
    body?: OfficeDestinationCreateInput | OfficeWebhookInput | OfficeWebhookVerifyInput
    key?: string
    binary?: boolean
}

type Wire = {
    status: number
    body: string
    data: unknown
    headers: unknown
}

type ContentResult =
    | {
        kind: 'response'
        status: 200
        value: Buffer
        type: string
        disposition: string | undefined
    }
    | {
        kind: 'error'
        status: number
        error: RouteErrorFor<'office', 'office_export'>
    }

export type OfficeFiles = ReadonlyArray<OfficeFileRow>
export type OfficeDestination = OfficeDestinationCreateResult
export type OfficeHook = OfficeWebhookRow
export type OfficeVerifiedPayload = OfficeWebhookPayload
