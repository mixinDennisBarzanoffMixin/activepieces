import { createHash, randomUUID } from 'node:crypto'
import { EntityManager } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { databaseConnection } from '../../database/database-connection'
import { JsonValue, OfficeEffect, OfficeEffectEntity } from './office-inbox-entity'

const effects = repoFactory<OfficeEffect>(OfficeEffectEntity)

export const officeEffect = {
    async attempt(input: Attempt): Promise<EffectDecision> {
        return databaseConnection().transaction(async (manager) => {
            if (!await active(manager, input)) return { kind: 'untracked' }
            if (!input.policy) throw new OfficeEffectPolicyError()
            const repo = effects(manager)
            const row = await repo.findOne({
                where: { runId: input.runId, step: input.step, path: input.path },
                lock: { mode: 'pessimistic_write' },
            })
            if (!row) {
                const full: Array<{ id: string }> = await manager.query(
                    `SELECT id
                     FROM veritly_office_effect
                     WHERE "runId" = $1
                     ORDER BY id
                     LIMIT 1 OFFSET 1023`,
                    [input.runId],
                )
                if (full.length !== 0) throw new OfficeEffectLimitError()
                const operationId = `office_op_${randomUUID()}`
                await repo.insert({
                    id: input.id,
                    runId: input.runId,
                    step: input.step,
                    path: input.path,
                    policy: input.policy,
                    operationId,
                    inputHash: input.inputHash,
                    state: 'attempting',
                    output: null,
                    outputHash: null,
                    terminalAt: null,
                })
                return { kind: 'dispatch', operationId }
            }
            exact(row, input)
            if (row.state === 'succeeded') {
                return { kind: 'completed', operationId: row.operationId, output: row.output }
            }
            if (row.state === 'outcome_unknown') {
                return { kind: 'unknown', operationId: row.operationId }
            }
            if (row.policy === 'non_idempotent') {
                await repo.update({ id: row.id, state: 'attempting' }, {
                    state: 'outcome_unknown',
                    terminalAt: new Date().toISOString(),
                })
                return { kind: 'unknown', operationId: row.operationId }
            }
            if (row.policy === 'reconcilable') {
                return { kind: 'reconcile', operationId: row.operationId }
            }
            return { kind: 'dispatch', operationId: row.operationId }
        })
    },

    async complete(input: Complete): Promise<void> {
        await databaseConnection().transaction(async (manager) => {
            if (!await active(manager, input)) throw new OfficeEffectScopeError()
            const repo = effects(manager)
            const row = await repo.findOne({
                where: { runId: input.runId, step: input.step, path: input.path },
                lock: { mode: 'pessimistic_write' },
            })
            if (!row) throw new OfficeEffectScopeError()
            exact(row, input)
            if (row.operationId !== input.operationId) throw new OfficeEffectConflictError()
            if (row.state === 'outcome_unknown') throw new OfficeEffectOutcomeUnknownError()
            const outputHash = hash(input.output)
            if (row.state === 'succeeded') {
                if (row.outputHash !== outputHash) throw new OfficeEffectConflictError()
                return
            }
            const result = await repo.update({ id: row.id, state: 'attempting' }, {
                state: 'succeeded',
                output: input.output,
                outputHash,
                terminalAt: new Date().toISOString(),
            })
            if (result.affected !== 1) throw new OfficeEffectConflictError()
        })
    },

    async unknown(input: EffectScope): Promise<void> {
        await databaseConnection().transaction(async (manager) => {
            if (!await active(manager, input)) throw new OfficeEffectScopeError()
            const repo = effects(manager)
            const row = await repo.findOne({
                where: { runId: input.runId, step: input.step, path: input.path },
                lock: { mode: 'pessimistic_write' },
            })
            if (!row || row.operationId !== input.operationId) throw new OfficeEffectScopeError()
            if (row.state === 'succeeded') throw new OfficeEffectConflictError()
            if (row.state === 'outcome_unknown') return
            const result = await repo.update({ id: row.id, state: 'attempting' }, {
                state: 'outcome_unknown',
                terminalAt: new Date().toISOString(),
            })
            if (result.affected !== 1) throw new OfficeEffectConflictError()
        })
    },
}

async function active(manager: EntityManager, input: LeaseScope) {
    const rows: Array<{ active: boolean }> = await manager.query(
        `SELECT state = 'running'
             AND "leaseToken" = $2
             AND "leaseExpiresAt" > now() AS active
         FROM veritly_office_inbox
         WHERE "runId" = $1
         FOR UPDATE`,
        [input.runId, input.claim],
    )
    if (rows.length === 0) return false
    if (!rows[0].active) throw new OfficeEffectLeaseError()
    return true
}

function exact(row: OfficeEffect, input: Pick<Attempt, 'inputHash' | 'policy'>) {
    if (row.inputHash !== input.inputHash || row.policy !== input.policy) {
        throw new OfficeEffectConflictError()
    }
}

function hash(input: JsonValue) {
    return createHash('sha256').update(canonical(input)).digest('hex')
}

function canonical(input: JsonValue): string {
    if (input === null || typeof input !== 'object') return JSON.stringify(input)
    if (Array.isArray(input)) return `[${input.map((item) => canonical(item as JsonValue)).join(',')}]`
    const value = input as Record<string, JsonValue>
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
}

export class OfficeEffectConflictError extends Error {}
export class OfficeEffectLeaseError extends Error {}
export class OfficeEffectLimitError extends Error {}
export class OfficeEffectOutcomeUnknownError extends Error {}
export class OfficeEffectPolicyError extends Error {}
export class OfficeEffectScopeError extends Error {}

export type EffectPolicy = 'pure' | 'idempotent' | 'reconcilable' | 'non_idempotent'

type LeaseScope = {
    runId: string
    claim: string
}

type Attempt = LeaseScope & {
    id: string
    step: string
    path: string
    policy: EffectPolicy | undefined
    inputHash: string
}

type EffectScope = LeaseScope & {
    step: string
    path: string
    operationId: string
}

type Complete = EffectScope & {
    policy: EffectPolicy
    inputHash: string
    output: JsonValue
}

export type EffectDecision =
    | { kind: 'untracked' }
    | { kind: 'dispatch'; operationId: string }
    | { kind: 'reconcile'; operationId: string }
    | { kind: 'completed'; operationId: string; output: JsonValue }
    | { kind: 'unknown'; operationId: string }
