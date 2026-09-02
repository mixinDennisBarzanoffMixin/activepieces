import { randomUUID } from 'node:crypto'
import { ExecuteFlowJobData, tryCatch } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { databaseConnection } from '../../database/database-connection'
import { jobQueue, JobType } from '../../workers/job-queue/job-queue'

const BATCH = 16
const LEASE_MS = 30_000
const SWEEP_MS = 3_000
const RETENTION_MS = 30 * 24 * 60 * 60_000
const MAX_ATTEMPTS = 10_080

let timer: NodeJS.Timeout | undefined
let running: Promise<void> | undefined
let logger: FastifyBaseLogger | undefined
let pruned = 0

export const officeOutbox = {
    start(log: FastifyBaseLogger) {
        if (timer) return
        logger = log
        timer = setInterval(() => void officeOutbox.wake(), SWEEP_MS)
        timer.unref()
        void officeOutbox.wake()
    },

    async wake(): Promise<void> {
        if (running) return running
        if (!logger) return
        const log = logger
        running = drain(log)
            .catch(() => log.error('Office outbox sweep failed'))
            .finally(() => {
                running = undefined
            })
        return running
    },

    async close(): Promise<void> {
        if (timer) clearInterval(timer)
        timer = undefined
        await running
        logger = undefined
    },
}

async function drain(log: FastifyBaseLogger): Promise<void> {
    const rows = await claim()
    await Promise.all(rows.map(async (row) => {
        const parsed = ExecuteFlowJobData.safeParse(row.job)
        if (!parsed.success) {
            await dead(row, 'job_invalid')
            log.error({ runId: row.runId, issues: parsed.error.issues }, 'Office outbox job is invalid')
            return
        }
        const result = await tryCatch(() => jobQueue(log).add({
            id: row.runId,
            type: JobType.ONE_TIME,
            data: parsed.data,
        }))
        if (result.error) {
            if (row.attempts >= MAX_ATTEMPTS) await dead(row, 'enqueue_exhausted')
            else await fail(row, backoff(row.attempts))
            log.warn({ runId: row.runId, attempts: row.attempts }, 'Office outbox enqueue deferred')
            return
        }
        await delivered(row)
    }))
    if (Date.now() - pruned > 60 * 60_000) {
        await prune()
        pruned = Date.now()
    }
    if (rows.length === BATCH) await drain(log)
}

async function claim(): Promise<OutboxRow[]> {
    const token = randomUUID()
    return databaseConnection().transaction((manager) => manager.query(
        `WITH next AS (
             SELECT id
             FROM veritly_office_outbox
             WHERE state = 'pending'
               AND "availableAt" <= now()
               AND (
                    (attempts < $4 AND ("leaseExpiresAt" IS NULL OR "leaseExpiresAt" <= now()))
                    OR (attempts = $4 AND "leaseExpiresAt" <= now())
               )
             ORDER BY "availableAt", id
             FOR UPDATE SKIP LOCKED
             LIMIT $1
         )
         UPDATE veritly_office_outbox item
         SET "leaseToken" = $2,
             "leaseExpiresAt" = $3,
             attempts = CASE WHEN attempts < $4 THEN attempts + 1 ELSE attempts END,
             updated = now()
         FROM next
         WHERE item.id = next.id
         RETURNING item.id, item."runId", item.job, item.attempts, item."leaseToken"`,
        [BATCH, token, new Date(Date.now() + LEASE_MS).toISOString(), MAX_ATTEMPTS],
    ))
}

async function delivered(row: OutboxRow) {
    const result: Array<{ id: string }> = await databaseConnection().query(
        `UPDATE veritly_office_outbox
         SET state = 'delivered',
             "leaseToken" = NULL,
             "leaseExpiresAt" = NULL,
             "deliveredAt" = now(),
             "terminalAt" = now(),
             updated = now()
         WHERE id = $1
           AND state = 'pending'
           AND "leaseToken" = $2
         RETURNING id`,
        [row.id, row.leaseToken],
    )
    if (result.length !== 1) throw new OfficeOutboxLeaseError()
}

async function dead(row: OutboxRow, failure: 'job_invalid' | 'enqueue_exhausted') {
    await databaseConnection().transaction(async (manager) => {
        const result: Array<{ runId: string }> = await manager.query(
            `UPDATE veritly_office_outbox
             SET state = 'failed',
                 failure = $3,
                 "leaseToken" = NULL,
                 "leaseExpiresAt" = NULL,
                 "terminalAt" = now(),
                 updated = now()
             WHERE id = $1
               AND state = 'pending'
               AND "leaseToken" = $2
             RETURNING "runId"`,
            [row.id, row.leaseToken, failure],
        )
        if (result.length !== 1) throw new OfficeOutboxLeaseError()
        await manager.query(
            `UPDATE veritly_office_inbox
             SET state = 'failed',
                 "commitToken" = NULL,
                 "terminalAt" = now(),
                 updated = now()
             WHERE "runId" = $1
               AND state = 'queued'`,
            [row.runId],
        )
    })
}

async function fail(row: OutboxRow, delay: number) {
    const result: Array<{ id: string }> = await databaseConnection().query(
        `UPDATE veritly_office_outbox
         SET "leaseToken" = NULL,
             "leaseExpiresAt" = NULL,
             "availableAt" = $3,
             updated = now()
         WHERE id = $1
           AND state = 'pending'
           AND "leaseToken" = $2
         RETURNING id`,
        [row.id, row.leaseToken, new Date(Date.now() + delay).toISOString()],
    )
    if (result.length !== 1) throw new OfficeOutboxLeaseError()
}

async function prune() {
    const before = new Date(Date.now() - RETENTION_MS).toISOString()
    await databaseConnection().transaction(async (manager) => {
        await manager.query(
            `DELETE FROM veritly_office_outbox
             WHERE id IN (
                 SELECT id FROM veritly_office_outbox
                 WHERE state IN ('delivered', 'failed') AND "terminalAt" < $1
                 ORDER BY "terminalAt"
                 LIMIT 1000
             )`,
            [before],
        )
        await manager.query(
            `DELETE FROM veritly_office_effect
             WHERE id IN (
                 SELECT effect.id
                 FROM veritly_office_effect effect
                 JOIN veritly_office_inbox inbox ON inbox."runId" = effect."runId"
                 WHERE inbox.state IN ('succeeded', 'failed') AND inbox."terminalAt" < $1
                 ORDER BY effect."terminalAt", effect.id
                 LIMIT 1000
             )`,
            [before],
        )
        await manager.query(
            `DELETE FROM veritly_office_inbox
             WHERE id IN (
                 SELECT id FROM veritly_office_inbox
                 WHERE state IN ('succeeded', 'failed')
                   AND "terminalAt" < $1
                   AND NOT EXISTS (
                       SELECT 1 FROM veritly_office_effect
                       WHERE veritly_office_effect."runId" = veritly_office_inbox."runId"
                   )
                 ORDER BY "terminalAt"
                 LIMIT 1000
             )`,
            [before],
        )
        await manager.query(
            `DELETE FROM veritly_office_registration
             WHERE id IN (
                 SELECT id FROM veritly_office_registration
                 WHERE state = 'deleted' AND "deletedAt" < $1
                 ORDER BY "deletedAt"
                 LIMIT 1000
             )`,
            [before],
        )
    })
}

function backoff(attempts: number) {
    return Math.min(60_000, 500 * 2 ** Math.min(attempts, 7))
}

export class OfficeOutboxLeaseError extends Error {}

type OutboxRow = {
    id: string
    runId: string
    job: unknown
    attempts: number
    leaseToken: string
}
