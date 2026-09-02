import { apId, ExecuteFlowJobData, FlowRunStatus, FlowVersionState } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { databaseConnection } from '../../../../../src/app/database/database-connection'
import { runsMetadataQueue } from '../../../../../src/app/flows/flow-run/flow-runs-queue'
import {
    OfficeEffectConflictError,
    OfficeEffectLeaseError,
    officeEffect,
} from '../../../../../src/app/veritly/office/office-effect-service'
import {
    OfficeInboxBindingError,
    OfficeInboxConflictError,
    officeInbox,
} from '../../../../../src/app/veritly/office/office-inbox-service'
import { officeOutbox } from '../../../../../src/app/veritly/office/office-outbox'
import {
    claimOfficeJob,
    finishOfficeJob,
    OfficeJobLeaseError,
} from '../../../../../src/app/veritly/office/office-job-interceptor'
import {
    InterceptorVerdict,
    JobOutcome,
} from '../../../../../src/app/workers/job-queue/job-interceptor'
import { jobQueue, JobType } from '../../../../../src/app/workers/job-queue/job-queue'
import { createMockFlow, createMockFlowRun, createMockFlowVersion, mockAndSaveBasicSetup } from '../../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'
import { db } from '../../../../helpers/db'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
    await officeOutbox.close()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Office durable delivery', () => {
    it('office_event_commit_before_queue_crash', async () => {
        const input = await binding()
        const event = {
            ...input,
            platform: input.platform,
            event: 'office_event_0000000000000000000000000001',
            hash: 'a'.repeat(64),
            payload: { eventId: 'office_event_0000000000000000000000000001' },
            output: { row: 1 },
        }
        const [first, second] = await Promise.all([
            officeInbox.accept(event),
            officeInbox.accept(event),
        ])
        expect(second).toEqual(first)
        expect(await databaseConnection().getRepository('veritly_office_inbox').countBy({ runId: first.runId })).toBe(1)
        expect(await databaseConnection().getRepository('veritly_office_outbox').countBy({ runId: first.runId, state: 'pending' })).toBe(1)
        expect((await databaseConnection().getRepository('flow_run').findOneByOrFail({ id: first.runId })).status).toBe(FlowRunStatus.QUEUED)
    })

    it('office_event_concurrent_duplicate', async () => {
        const input = await binding()
        const event = {
            ...input,
            platform: input.platform,
            event: 'office_event_0000000000000000000000000011',
            hash: '1'.repeat(64),
            payload: { eventId: 'office_event_0000000000000000000000000011' },
            output: { row: 11 },
        }
        const rows = await Promise.all(Array.from({ length: 8 }, () => officeInbox.accept(event)))
        expect(new Set(rows.map((row) => row.runId)).size).toBe(1)
        expect(await databaseConnection().getRepository('veritly_office_inbox').countBy({ runId: rows[0].runId })).toBe(1)
        expect(await databaseConnection().getRepository('veritly_office_outbox').countBy({ runId: rows[0].runId })).toBe(1)
    })

    it('office_event_hash_mismatch', async () => {
        const input = await binding()
        const event = {
            ...input,
            platform: input.platform,
            event: 'office_event_0000000000000000000000000002',
            hash: 'b'.repeat(64),
            payload: { eventId: 'office_event_0000000000000000000000000002' },
            output: { row: 2 },
        }
        await officeInbox.accept(event)
        await expect(officeInbox.accept({ ...event, hash: 'c'.repeat(64) })).rejects.toBeInstanceOf(OfficeInboxConflictError)
    })

    it('office_event_replay_after_30_seconds', async () => {
        const input = await binding()
        const event = {
            ...input,
            platform: input.platform,
            event: 'office_event_0000000000000000000000000012',
            hash: '2'.repeat(64),
            payload: { eventId: 'office_event_0000000000000000000000000012' },
            output: { row: 12 },
        }
        const accepted = await officeInbox.accept(event)
        await databaseConnection().query(
            `UPDATE veritly_office_inbox SET created = now() - interval '31 seconds' WHERE "runId" = $1`,
            [accepted.runId],
        )
        await expect(officeInbox.accept(event)).resolves.toEqual(accepted)
    })

    it('office_event_enqueue_before_mark_crash', async () => {
        const input = await binding()
        const accepted = await officeInbox.accept({
            ...input,
            platform: input.platform,
            event: 'office_event_0000000000000000000000000003',
            hash: 'f'.repeat(64),
            payload: { eventId: 'office_event_0000000000000000000000000003' },
            output: { row: 3 },
        })
        const rows: Array<{ job: unknown }> = await databaseConnection().query(
            'SELECT job FROM veritly_office_outbox WHERE "runId" = $1',
            [accepted.runId],
        )
        const job = ExecuteFlowJobData.parse(rows[0]?.job)
        await jobQueue(app.log).add({ id: accepted.runId, type: JobType.ONE_TIME, data: job })
        officeOutbox.start(app.log)
        await officeOutbox.wake()
        await officeOutbox.close()
        expect(await databaseConnection().getRepository('veritly_office_outbox').countBy({
            runId: accepted.runId,
            state: 'delivered',
        })).toBe(1)
        expect((await jobQueue(app.log).getSharedQueue().getJob(accepted.runId))?.id).toBe(accepted.runId)
    })

    it('office_event_duplicate_queue_job', async () => {
        const input = await binding()
        const accepted = await officeInbox.accept({
            ...input,
            platform: input.platform,
            event: 'office_event_0000000000000000000000000013',
            hash: '3'.repeat(64),
            payload: { eventId: 'office_event_0000000000000000000000000013' },
            output: { row: 13 },
        })
        officeOutbox.start(app.log)
        await Promise.all([officeOutbox.wake(), officeOutbox.wake(), officeOutbox.wake()])
        await officeOutbox.close()
        expect(await databaseConnection().getRepository('veritly_office_outbox').countBy({
            runId: accepted.runId,
            state: 'delivered',
        })).toBe(1)
        expect((await jobQueue(app.log).getSharedQueue().getJob(accepted.runId))?.id).toBe(accepted.runId)
    })

    it('office_hook_version_renew_keeps_the_stable_destination_slot', async () => {
        const first = await binding()
        await officeInbox.revoke(first)
        await officeInbox.unbind(first)
        const current = await databaseConnection().getRepository('flow_version').findOneByOrFail({ id: first.version })
        const next = createMockFlowVersion({
            flowId: first.flow,
            state: FlowVersionState.LOCKED,
            valid: true,
            trigger: current.trigger,
        })
        await db.save('flow_version', next)
        const planned = await officeInbox.plan({
            project: first.project,
            flow: first.flow,
            version: next.id,
            trigger: first.trigger,
            endpoint: 'https://example.com/office',
            event: 'row_changed',
            file: 'office_file_0000000000000000000000000001',
            sheet: 'sheet_1',
            generation: next.id,
        })
        const attached = await officeInbox.attach({
            ...planned,
            destination: first.destination,
            registration: first.registration,
        })
        const renewed = await officeInbox.bind({
            ...attached,
            webhook: 'office_webhook_0000000000000000000000000002',
        })
        expect(renewed).toMatchObject({
            version: next.id,
            destination: first.destination,
            registration: first.registration,
        })
        expect(await databaseConnection().getRepository('veritly_office_registration').countBy({
            projectId: first.project,
            flowId: first.flow,
            trigger: first.trigger,
        })).toBe(1)
        await expect(officeInbox.resolve(first)).rejects.toBeInstanceOf(OfficeInboxBindingError)
    })

    it('office_event_stale_lease_cannot_commit', async () => {
        const row = await running()
        const attempted = await officeEffect.attempt(effect(row, 'idempotent'))
        expect(attempted.kind).toBe('dispatch')
        await databaseConnection().query(
            `UPDATE veritly_office_inbox
             SET generation = generation + 1, "commitToken" = $2, "leaseToken" = $2
             WHERE "runId" = $1`,
            [row.run, row.next],
        )
        if (attempted.kind !== 'dispatch') throw new Error('effect did not enter dispatch')
        await expect(officeEffect.complete({
            ...effect(row, 'idempotent'),
            operationId: attempted.operationId,
            output: { ok: true },
        })).rejects.toBeInstanceOf(OfficeEffectLeaseError)
        expect((await databaseConnection().getRepository('veritly_office_effect').findOneByOrFail({ operationId: attempted.operationId })).state).toBe('attempting')
    })

    it('office_event_worker_crash_after_claim', async () => {
        const row = await running()
        await databaseConnection().query(
            `UPDATE veritly_office_inbox SET "leaseExpiresAt" = now() - interval '1 second' WHERE "runId" = $1`,
            [row.run],
        )
        await expect(claimOfficeJob(row.run, row.next)).resolves.toEqual({ verdict: InterceptorVerdict.ALLOW })
        await expect(finishOfficeJob(row.run, row.claim, JobOutcome.COMPLETED)).rejects.toBeInstanceOf(OfficeJobLeaseError)
        await expect(finishOfficeJob(row.run, row.next, JobOutcome.COMPLETED)).resolves.toBeUndefined()
        await expect(claimOfficeJob(row.run, 'office-claim-0000000000000003')).resolves.toEqual({ verdict: InterceptorVerdict.DISCARD })
    })

    it('office_event_terminal_requeue', async () => {
        const row = await running()
        await runsMetadataQueue(app.log).add({
            id: row.run,
            projectId: row.project,
            status: FlowRunStatus.SUCCEEDED,
            finishTime: new Date().toISOString(),
            officeJobId: row.run,
            officeClaim: row.claim,
        })
        await runsMetadataQueue(app.log).add({
            id: row.run,
            projectId: row.project,
            status: FlowRunStatus.RUNNING,
            officeJobId: row.run,
            officeClaim: row.claim,
        })
        expect((await databaseConnection().getRepository('flow_run').findOneByOrFail({ id: row.run })).status)
            .toBe(FlowRunStatus.SUCCEEDED)
    })

    it('office_event_external_effect_response_lost_unknown', async () => {
        const row = await running()
        const first = await officeEffect.attempt(effect(row, 'non_idempotent'))
        const replay = await officeEffect.attempt(effect(row, 'non_idempotent'))
        expect(first.kind).toBe('dispatch')
        expect(replay).toEqual({ kind: 'unknown', operationId: operation(first) })
    })

    it('office_event_idempotent_effect_reconcile', async () => {
        const row = await running()
        const first = await officeEffect.attempt(effect(row, 'reconcilable'))
        const replay = await officeEffect.attempt(effect(row, 'reconcilable'))
        expect(first.kind).toBe('dispatch')
        expect(replay).toEqual({ kind: 'reconcile', operationId: operation(first) })
    })

    it('office_event_nonidempotent_not_reissued', async () => {
        const row = await running()
        const first = await officeEffect.attempt(effect(row, 'non_idempotent'))
        const replay = await officeEffect.attempt(effect(row, 'non_idempotent'))
        const last = await officeEffect.attempt(effect(row, 'non_idempotent'))
        expect(first.kind).toBe('dispatch')
        expect(replay.kind).toBe('unknown')
        expect(last).toEqual(replay)
    })

    it('office_event_completed_effect_replay_requires_exact_output', async () => {
        const row = await running()
        const first = await officeEffect.attempt(effect(row, 'idempotent'))
        if (first.kind !== 'dispatch') throw new Error('effect did not enter dispatch')
        await officeEffect.complete({
            ...effect(row, 'idempotent'),
            operationId: first.operationId,
            output: { ok: true },
        })
        await expect(officeEffect.complete({
            ...effect(row, 'idempotent'),
            operationId: first.operationId,
            output: { ok: true },
        })).resolves.toBeUndefined()
        await expect(officeEffect.complete({
            ...effect(row, 'idempotent'),
            operationId: first.operationId,
            output: { ok: false },
        })).rejects.toBeInstanceOf(OfficeEffectConflictError)
    })
})

async function binding() {
    const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()
    const flow = createMockFlow({ projectId: mockProject.id })
    const version = createMockFlowVersion({ flowId: flow.id, state: FlowVersionState.LOCKED, valid: true })
    await db.save('flow', flow)
    await db.save('flow_version', version)
    const planned = await officeInbox.plan({
        project: mockProject.id,
        flow: flow.id,
        version: version.id,
        trigger: version.trigger.name,
        endpoint: 'https://example.com/office',
        event: 'row_changed',
        file: 'office_file_0000000000000000000000000001',
        sheet: 'sheet_1',
        generation: version.id,
    })
    const attached = await officeInbox.attach({
        ...planned,
        destination: 'office_destination_000000000000000000000000001',
        registration: 'office_webhook_registration_00000000000000001',
    })
    return {
        ...await officeInbox.bind({
            ...attached,
            webhook: 'office_webhook_0000000000000000000000000001',
        }),
        platform: mockPlatform.id,
    }
}

async function running() {
    const { mockProject } = await mockAndSaveBasicSetup()
    const flow = createMockFlow({ projectId: mockProject.id })
    const version = createMockFlowVersion({ flowId: flow.id, state: FlowVersionState.LOCKED, valid: true })
    const run = createMockFlowRun({
        projectId: mockProject.id,
        flowId: flow.id,
        flowVersionId: version.id,
        status: FlowRunStatus.RUNNING,
    })
    await db.save('flow', flow)
    await db.save('flow_version', version)
    await db.save('flow_run', run)
    const claim = 'office-claim-0000000000000001'
    await db.save('veritly_office_inbox', {
        id: apId(),
        projectId: mockProject.id,
        flowId: flow.id,
        flowVersionId: version.id,
        trigger: version.trigger.name,
        eventId: `office_event_${apId()}`,
        requestHash: 'd'.repeat(64),
        payload: { eventId: 'event' },
        runId: run.id,
        state: 'running',
        generation: 1,
        commitToken: claim,
        leaseToken: claim,
        leaseExpiresAt: new Date(Date.now() + 30_000).toISOString(),
        terminalAt: null,
    })
    return { run: run.id, project: mockProject.id, claim, next: 'office-claim-0000000000000002' }
}

function effect(input: Awaited<ReturnType<typeof running>>, policy: 'idempotent' | 'reconcilable' | 'non_idempotent') {
    return {
        id: apId(),
        runId: input.run,
        claim: input.claim,
        step: 'office_step',
        path: '[]',
        policy,
        inputHash: 'e'.repeat(64),
    }
}

function operation(input: Awaited<ReturnType<typeof officeEffect.attempt>>) {
    if (input.kind !== 'dispatch') throw new Error('effect did not enter dispatch')
    return input.operationId
}
