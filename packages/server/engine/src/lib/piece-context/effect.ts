import { createHash } from 'node:crypto'
import { EffectPolicy } from '@activepieces/pieces-framework'
import { EngineGenericError } from '@activepieces/shared'

export const effectClient = {
    async attempt(input: EffectAttempt): Promise<EffectDecision> {
        return send('attempt', {
            apiUrl: input.apiUrl,
            token: input.token,
            runId: input.runId,
            step: input.step,
            path: input.path,
            policy: input.policy,
            inputHash: input.inputHash,
        }, decision)
    },

    async complete(input: EffectComplete): Promise<void> {
        await send('complete', input, okay)
    },

    async unknown(input: EffectUnknown): Promise<void> {
        await send('unknown', input, okay)
    },
}

export function effectHash(input: unknown) {
    return createHash('sha256').update(canonical(input)).digest('hex')
}

async function send<T>(name: string, body: unknown, parse: (input: unknown) => T) {
    const scope = body as { apiUrl?: string; token?: string }
    if (!scope.apiUrl || !scope.token) throw new EngineGenericError('EffectScopeError', 'Effect API scope is missing')
    const value = { ...(body as Record<string, unknown>) }
    delete value.apiUrl
    delete value.token
    const response = await fetch(`${scope.apiUrl}v1/veritly/worker/office/effects/${name}`, {
        method: 'POST',
        redirect: 'error',
        headers: {
            authorization: `Bearer ${scope.token}`,
            'content-type': 'application/json',
        },
        body: JSON.stringify(value),
        signal: AbortSignal.timeout(3_000),
    })
    const text = await response.text()
    if (!response.ok) {
        throw new EngineGenericError('EffectTransitionError', `Effect ${name} rejected with status ${response.status}`)
    }
    return parse(JSON.parse(text))
}

function decision(input: unknown): EffectDecision {
    if (!record(input) || typeof input.kind !== 'string') throw new EngineGenericError('EffectResponseError', 'Effect decision is invalid')
    if (input.kind === 'untracked') return { kind: 'untracked' }
    const operationId = input.operationId
    if (typeof operationId !== 'string' || operationId.length < 1 || operationId.length > 80) {
        throw new EngineGenericError('EffectResponseError', 'Effect operation identifier is invalid')
    }
    if (input.kind === 'dispatch' || input.kind === 'reconcile' || input.kind === 'unknown') {
        return { kind: input.kind, operationId }
    }
    if (input.kind === 'completed') return { kind: 'completed', operationId, output: input.output }
    throw new EngineGenericError('EffectResponseError', 'Effect decision kind is invalid')
}

function okay(input: unknown) {
    if (!record(input) || input.ok !== true || Object.keys(input).length !== 1) {
        throw new EngineGenericError('EffectResponseError', 'Effect acknowledgement is invalid')
    }
}

function canonical(input: unknown): string {
    if (input === null || typeof input === 'string' || typeof input === 'boolean') return JSON.stringify(input)
    if (typeof input === 'number') {
        if (!Number.isFinite(input)) throw new EngineGenericError('EffectInputError', 'Effect input contains a non-finite number')
        return JSON.stringify(input)
    }
    if (Array.isArray(input)) return `[${input.map(canonical).join(',')}]`
    if (!record(input)) throw new EngineGenericError('EffectInputError', 'Effect input is not canonical JSON')
    const entries = Object.keys(input).sort().map((key) => `${JSON.stringify(key)}:${canonical(input[key])}`)
    return `{${entries.join(',')}}`
}

function record(input: unknown): input is Record<string, unknown> {
    if (input === null || typeof input !== 'object' || Array.isArray(input)) return false
    const proto = Object.getPrototypeOf(input)
    return proto === Object.prototype || proto === null
}

type EffectBase = {
    apiUrl: string
    token: string
    runId: string
    step: string
    path: readonly [string, number][]
}

type EffectAttempt = EffectBase & {
    policy: EffectPolicy | undefined
    inputHash: string
}

type EffectComplete = EffectBase & {
    policy: EffectPolicy
    operationId: string
    inputHash: string
    output: unknown
}

type EffectUnknown = EffectBase & {
    operationId: string
}

export type EffectDecision =
    | { kind: 'untracked' }
    | { kind: 'dispatch'; operationId: string }
    | { kind: 'reconcile'; operationId: string }
    | { kind: 'completed'; operationId: string; output: unknown }
    | { kind: 'unknown'; operationId: string }
