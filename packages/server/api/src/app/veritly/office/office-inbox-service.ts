import { createHash } from 'node:crypto'
import {
    apId,
    ExecuteFlowJobData,
    ExecutionType,
    FlowRun,
    FlowRunStatus,
    LATEST_JOB_DATA_SCHEMA_VERSION,
    RunEnvironment,
    StreamStepProgress,
    WorkerJobType,
} from '@activepieces/shared'
import { EntityManager } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { databaseConnection } from '../../database/database-connection'
import { flowRunRepo } from '../../flows/flow-run/flow-run-service'
import {
    OfficeInbox,
    OfficeInboxEntity,
    OfficeOutbox,
    OfficeOutboxEntity,
    OfficeRegistration,
    OfficeRegistrationEntity,
} from './office-inbox-entity'

const registrations = repoFactory<OfficeRegistration>(OfficeRegistrationEntity)
const inbox = repoFactory<OfficeInbox>(OfficeInboxEntity)
const outbox = repoFactory<OfficeOutbox>(OfficeOutboxEntity)
const CLEANUP_GRACE_MS = 10 * 60_000

export const officeInbox = {
    async plan(input: Plan): Promise<Plan> {
        return databaseConnection().transaction(async (manager) => {
            await assertFlow(manager, input)
            await manager.query(
                `SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`,
                [`${input.project}\0${input.flow}\0${input.trigger}`],
            )
            const repo = registrations(manager)
            const current = await repo.createQueryBuilder('registration')
                .setLock('pessimistic_write')
                .where('registration."projectId" = :project', { project: input.project })
                .andWhere('registration."flowId" = :flow', { flow: input.flow })
                .andWhere('registration.trigger = :trigger', { trigger: input.trigger })
                .getOne()
            if (current) {
                if (current.state === 'active') {
                    exactPlan(current, input)
                    return plan(current)
                }
                if (current.state === 'destination_pending' || current.state === 'hook_pending') {
                    exactPlan(current, input)
                    return plan(current)
                }
                if (current.state !== 'idle' || current.endpoint !== input.endpoint) {
                    throw new OfficeInboxConflictError()
                }
                const result = await repo.update({ id: current.id, state: 'idle' }, {
                    flowVersionId: input.version,
                    event: input.event,
                    fileId: input.file,
                    sheetId: input.sheet,
                    generation: input.generation,
                    webhookId: null,
                    state: 'hook_pending',
                    cleanupAt: new Date(Date.now() + CLEANUP_GRACE_MS).toISOString(),
                    cleanupAttempts: 0,
                })
                if (result.affected !== 1) throw new OfficeInboxConflictError()
                return input
            }
            const row = repo.create({
                id: apId(),
                projectId: input.project,
                flowId: input.flow,
                flowVersionId: input.version,
                trigger: input.trigger,
                endpoint: input.endpoint,
                event: input.event,
                fileId: input.file,
                sheetId: input.sheet,
                generation: input.generation,
                destinationId: null,
                registrationId: null,
                webhookId: null,
                state: 'destination_pending',
                cleanupAt: new Date(Date.now() + CLEANUP_GRACE_MS).toISOString(),
                cleanupAttempts: 0,
                cleanupToken: null,
                cleanupExpiresAt: null,
                deletedAt: null,
            })
            return plan(await repo.save(row))
        })
    },

    async attach(input: Plan & Destination): Promise<Plan & Destination> {
        return databaseConnection().transaction(async (manager) => {
            const repo = registrations(manager)
            const row = await repo.findOne({ where: slot(input), lock: { mode: 'pessimistic_write' } })
            if (!row) throw new OfficeInboxBindingError()
            exactPlan(row, input)
            if (row.state === 'destination_pending') {
                const result = await repo.update({ id: row.id, state: 'destination_pending' }, {
                    destinationId: input.destination,
                    registrationId: input.registration,
                    state: 'hook_pending',
                })
                if (result.affected !== 1) throw new OfficeInboxConflictError()
                return input
            }
            if (row.state !== 'hook_pending' && row.state !== 'active') {
                throw new OfficeInboxConflictError()
            }
            exactDestination(row, input)
            return input
        })
    },

    async bind(input: Bind): Promise<Binding> {
        return databaseConnection().transaction(async (manager) => {
            const repo = registrations(manager)
            const row = await repo.findOne({ where: slot(input), lock: { mode: 'pessimistic_write' } })
            if (!row) throw new OfficeInboxBindingError()
            exactPlan(row, input)
            exactDestination(row, input)
            if (row.state === 'active') {
                if (row.webhookId !== input.webhook) throw new OfficeInboxConflictError()
                return binding(row)
            }
            if (row.state !== 'hook_pending') throw new OfficeInboxConflictError()
            const result = await repo.update({ id: row.id, state: 'hook_pending' }, {
                webhookId: input.webhook,
                state: 'active',
                cleanupAt: null,
                cleanupAttempts: 0,
            })
            if (result.affected !== 1) throw new OfficeInboxConflictError()
            return binding({ ...row, webhookId: input.webhook, state: 'active' })
        })
    },

    async resolve(input: Resolve): Promise<Binding> {
        const row = await registrations().findOneBy({
            projectId: input.project,
            flowId: input.flow,
            flowVersionId: input.version,
            trigger: input.trigger,
            destinationId: input.destination,
            registrationId: input.registration,
            webhookId: input.webhook,
            state: 'active',
        })
        if (!row) throw new OfficeInboxBindingError()
        return binding(row)
    },

    async revoke(input: Resolve): Promise<Binding> {
        return databaseConnection().transaction(async (manager) => {
            const repo = registrations(manager)
            const row = await repo.findOne({ where: registration(input), lock: { mode: 'pessimistic_write' } })
            if (!row) throw new OfficeInboxBindingError()
            if (row.state === 'active') await repo.update({ id: row.id, state: 'active' }, {
                state: 'deleting',
                cleanupAt: new Date(Date.now() + CLEANUP_GRACE_MS).toISOString(),
            })
            else if (row.state !== 'deleting' && row.state !== 'idle') throw new OfficeInboxConflictError()
            return binding(row)
        })
    },

    async unbind(input: Resolve): Promise<void> {
        await databaseConnection().transaction(async (manager) => {
            const repo = registrations(manager)
            const row = await repo.findOne({ where: registration(input), lock: { mode: 'pessimistic_write' } })
            if (!row) throw new OfficeInboxBindingError()
            if (row.state === 'idle' || row.state === 'deleted' || row.state === 'cleanup_failed') return
            if (row.state !== 'deleting') throw new OfficeInboxConflictError()
            const result = await repo.update({ id: row.id, state: 'deleting' }, {
                state: 'idle',
                cleanupAt: new Date(Date.now() + CLEANUP_GRACE_MS).toISOString(),
            })
            if (result.affected !== 1) throw new OfficeInboxConflictError()
        })
    },

    async accept(input: Accept): Promise<Accepted> {
        return databaseConnection().transaction(async (manager) => {
            await assertFlow(manager, input)
            const registration = await registrations(manager).findOne({
                where: {
                    projectId: input.project,
                    flowId: input.flow,
                    flowVersionId: input.version,
                    trigger: input.trigger,
                    destinationId: input.destination,
                    registrationId: input.registration,
                    webhookId: input.webhook,
                    state: 'active',
                },
                lock: { mode: 'pessimistic_write' },
            })
            if (!registration) throw new OfficeInboxBindingError()
            const current = await inbox(manager).findOneBy({
                projectId: input.project,
                flowId: input.flow,
                trigger: input.trigger,
                eventId: input.event,
            })
            if (current) {
                if (current.requestHash !== input.hash) throw new OfficeInboxConflictError()
                return { runId: current.runId }
            }
            const now = new Date().toISOString()
            const run = flow(input, now)
            const job = task(input, run)
            await flowRunRepo(manager).insert(run)
            await inbox(manager).insert({
                id: apId(),
                projectId: input.project,
                flowId: input.flow,
                flowVersionId: input.version,
                trigger: input.trigger,
                eventId: input.event,
                requestHash: input.hash,
                payload: input.payload,
                runId: run.id,
                state: 'queued',
                generation: 0,
                commitToken: null,
                leaseToken: null,
                leaseExpiresAt: null,
                terminalAt: null,
            })
            await outbox(manager).insert({
                id: apId(),
                runId: run.id,
                state: 'pending',
                failure: null,
                job,
                attempts: 0,
                availableAt: now,
                leaseToken: null,
                leaseExpiresAt: null,
                deliveredAt: null,
                terminalAt: null,
            })
            return { runId: run.id }
        })
    },
}

export async function officeLease(input: { id: string; claim: string }) {
    const rows: Array<{ tracked: boolean; active: boolean }> = await databaseConnection().query(
        `SELECT EXISTS(
             SELECT 1 FROM veritly_office_inbox WHERE "runId" = $1
         ) AS tracked,
         EXISTS(
             SELECT 1
             FROM veritly_office_inbox
             WHERE "runId" = $1
               AND state = 'running'
               AND "leaseToken" = $2
               AND "leaseExpiresAt" > now()
         ) AS active`,
        [input.id, input.claim],
    )
    const row = rows[0]
    if (!row) throw new OfficeInboxCatalogError()
    return !row.tracked || row.active
}

export function requestHash(input: HashInput) {
    const hash = createHash('sha256')
    const values = [
        input.project,
        input.flow,
        input.version,
        input.trigger,
        input.webhook,
        input.destination,
        input.registration,
        input.event,
        input.timestamp,
        input.signature,
        input.body,
    ]
    values.forEach((value) => hash.update(String(Buffer.byteLength(value))).update(':').update(value))
    return hash.digest('hex')
}

function flow(input: Accept, now: string): Omit<FlowRun, 'steps'> {
    return {
        id: apId(),
        projectId: input.project,
        flowId: input.flow,
        flowVersionId: input.version,
        environment: RunEnvironment.PRODUCTION,
        parentRunId: undefined,
        failParentOnFailure: true,
        status: FlowRunStatus.QUEUED,
        stepNameToTest: undefined,
        created: now,
        updated: now,
        tags: [],
        triggeredBy: undefined,
        logsFileId: null,
    }
}

function task(input: Accept, run: Pick<FlowRun, 'id'>) {
    return ExecuteFlowJobData.parse({
        schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
        workerHandlerId: null,
        projectId: input.project,
        platformId: input.platform,
        environment: RunEnvironment.PRODUCTION,
        flowId: input.flow,
        runId: run.id,
        jobType: WorkerJobType.EXECUTE_FLOW,
        flowVersionId: input.version,
        payload: { type: 'inline', value: input.output },
        streamStepProgress: StreamStepProgress.NONE,
        logsFileId: apId(),
        traceContext: {},
        executionType: ExecutionType.BEGIN,
        executeTrigger: false,
    })
}

async function assertFlow(manager: EntityManager, input: FlowScope) {
    const rows: Array<{ id: string }> = await manager.query(
        `SELECT fv.id
         FROM flow_version fv
         JOIN flow f ON f.id = fv."flowId"
         WHERE fv.id = $1
           AND fv."flowId" = $2
           AND f."projectId" = $3
           AND f."operationStatus" = 'NONE'
           AND fv.valid = true
           AND fv.trigger->>'name' = $4
           AND NOT jsonb_path_exists(fv.trigger, '$.** ? (@.type == "CODE")')
         LIMIT 1`,
        [input.version, input.flow, input.project, input.trigger],
    )
    if (rows.length !== 1) throw new OfficeInboxBindingError()
}

function binding(input: OfficeRegistration): Binding {
    if (!input.destinationId || !input.registrationId || !input.webhookId) {
        throw new OfficeInboxCatalogError()
    }
    return {
        project: input.projectId,
        flow: input.flowId,
        version: input.flowVersionId,
        trigger: input.trigger,
        destination: input.destinationId,
        registration: input.registrationId,
        webhook: input.webhookId,
    }
}

function plan(input: OfficeRegistration): Plan {
    return {
        project: input.projectId,
        flow: input.flowId,
        version: input.flowVersionId,
        trigger: input.trigger,
        endpoint: input.endpoint,
        event: input.event,
        file: input.fileId,
        sheet: input.sheetId,
        generation: input.generation,
    }
}

function slot(input: FlowScope) {
    return {
        projectId: input.project,
        flowId: input.flow,
        trigger: input.trigger,
    }
}

function registration(input: Resolve) {
    return {
        projectId: input.project,
        flowId: input.flow,
        flowVersionId: input.version,
        trigger: input.trigger,
        destinationId: input.destination,
        registrationId: input.registration,
        webhookId: input.webhook,
    }
}

function exactPlan(current: OfficeRegistration, input: Plan) {
    if (
        current.flowVersionId !== input.version
        || current.endpoint !== input.endpoint
        || current.event !== input.event
        || current.fileId !== input.file
        || current.sheetId !== input.sheet
        || current.generation !== input.generation
    ) throw new OfficeInboxConflictError()
}

function exactDestination(current: OfficeRegistration, input: Destination) {
    if (
        current.destinationId !== input.destination
        || current.registrationId !== input.registration
    ) throw new OfficeInboxConflictError()
}

export class OfficeInboxBindingError extends Error {}
export class OfficeInboxConflictError extends Error {}
export class OfficeInboxCatalogError extends Error {}

type FlowScope = {
    project: string
    flow: string
    version: string
    trigger: string
}

export type Plan = FlowScope & {
    endpoint: string
    event: string
    file: string
    sheet: string
    generation: string
}

type Destination = {
    destination: string
    registration: string
}

type Bind = Plan & Destination & {
    webhook: string
}

export type Binding = FlowScope & Destination & { webhook: string }
export type Resolve = Binding

type Accept = Binding & {
    platform: string
    event: string
    hash: string
    payload: object
    output: unknown
}

type Accepted = {
    runId: string
}

type HashInput = Binding & {
    event: string
    timestamp: string
    signature: string
    body: string
}
