import { createHash } from 'node:crypto'
import { EffectPolicy } from '@activepieces/pieces-framework'
import { EngineGenericError } from '@activepieces/shared'
import type { OfficeWorkerEffectDecision } from '@veritly/contracts'
import type { OfficeRouteName, RouteValueFor } from '@veritly/contracts/client'
import { decodeOfficeRouteError, decodeRouteResponse, officeRoutes } from '@veritly/contracts/client'
import { strict } from '@veritly/contracts/zod'

export const effectClient = {
    async attempt(input: EffectAttempt): Promise<EffectDecision> {
        return send('office_worker_effect_attempt', input, strict.OfficeWorkerEffectAttempt.parse({
            runId: input.runId,
            step: input.step,
            path: input.path,
            policy: input.policy,
            inputHash: input.inputHash,
        }))
    },

    async complete(input: EffectComplete): Promise<void> {
        await send('office_worker_effect_complete', input, strict.OfficeWorkerEffectComplete.parse({
            runId: input.runId,
            step: input.step,
            path: input.path,
            policy: input.policy,
            inputHash: input.inputHash,
            operationId: input.operationId,
            output: input.output,
        }))
    },

    async unknown(input: EffectUnknown): Promise<void> {
        await send('office_worker_effect_unknown', input, strict.OfficeWorkerEffectUnknown.parse({
            runId: input.runId,
            step: input.step,
            path: input.path,
            operationId: input.operationId,
        }))
    },
}

export function effectHash(input: unknown) {
    return createHash('sha256').update(canonical(input)).digest('hex')
}

async function send<Name extends EffectRoute>(route: Name, scope: EffectBase, body: unknown): Promise<RouteValueFor<'office', Name>> {
    if (!scope.apiUrl || !scope.token) throw new EngineGenericError('EffectScopeError', 'Effect API scope is missing')
    const response = await fetch(`${scope.apiUrl}${officeRoutes[route].path.slice(1)}`, {
        method: 'POST',
        redirect: 'error',
        headers: {
            authorization: `Bearer ${scope.token}`,
            'content-type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(3_000),
    })
    const text = await response.text()
    if (!response.ok) {
        const error = decodeOfficeRouteError(route, response.status, text)
        throw new EngineGenericError('EffectTransitionError', `Effect ${route} rejected with ${error.code}/${response.status}`)
    }
    return decodeRouteResponse('office', route, response.status, text)
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

type EffectRoute = Extract<OfficeRouteName, `office_worker_effect_${string}`>

export type EffectDecision = OfficeWorkerEffectDecision
