import { randomUUID } from 'node:crypto'
import { responses } from '@veritly/contracts/zod'
import { FastifyBaseLogger } from 'fastify'
import { databaseConnection } from '../../database/database-connection'
import {
    destination,
    hook,
    registrationKey,
    removeDestination,
    unhook,
} from '../veritly-office.service'

const BATCH = 8
const LEASE_MS = 30_000
const SWEEP_MS = 3_000
const MAX_ATTEMPTS = 10_080

let timer: NodeJS.Timeout | undefined
let running: Promise<void> | undefined
let logger: FastifyBaseLogger | undefined

export const officeRegistrationCleanup = {
    start(log: FastifyBaseLogger) {
        if (timer) return
        logger = log
        timer = setInterval(() => void officeRegistrationCleanup.wake(), SWEEP_MS)
        timer.unref()
        void officeRegistrationCleanup.wake()
    },

    async wake() {
        if (running) return running
        if (!logger) return
        const log = logger
        running = drain(log)
            .catch(() => log.error('Office registration cleanup sweep failed'))
            .finally(() => {
                running = undefined
            })
        return running
    },

    async close() {
        if (timer) clearInterval(timer)
        timer = undefined
        await running
        logger = undefined
    },

    async removeFlow(input: { log: FastifyBaseLogger; project: string; flow: string }) {
        await databaseConnection().query(
            `UPDATE veritly_office_registration
             SET state = CASE WHEN state = 'active' THEN 'deleting' ELSE state END,
                 "cleanupAt" = now(),
                 updated = now()
             WHERE "projectId" = $1
               AND "flowId" = $2
               AND state IN ('destination_pending', 'hook_pending', 'active', 'deleting', 'idle')`,
            [input.project, input.flow],
        )
        await drain(input.log)
        const rows: Array<{ id: string }> = await databaseConnection().query(
            `SELECT id
             FROM veritly_office_registration
             WHERE "projectId" = $1
               AND "flowId" = $2
               AND state <> 'deleted'
             LIMIT 1`,
            [input.project, input.flow],
        )
        if (rows.length !== 0) throw new OfficeRegistrationCleanupIncompleteError()
    },
}

async function drain(log: FastifyBaseLogger): Promise<void> {
    const rows = await claim()
    await Promise.all(rows.map((row) => clean(log, row).catch(async () => {
        await fail(row)
        log.warn({ registrationId: row.id, attempts: row.cleanupAttempts }, 'Office registration cleanup deferred')
    })))
    if (rows.length === BATCH) await drain(log)
}

async function clean(log: FastifyBaseLogger, row: CleanupRow) {
    const ctx = { log, project: row.projectId }
    await renew(row)
    const created = await destination({
        ...ctx,
        key: registrationKey({
            project: row.projectId,
            flow: row.flowId,
            trigger: row.trigger,
            kind: 'destination',
        }),
        value: responses.OfficeDestinationCreateInput.parse({
            endpoint: row.endpoint,
            verification: 'office_managed',
        }),
    })
    if (created.kind === 'error' || created.value.verification !== 'office_managed') {
        throw new OfficeRegistrationCleanupError()
    }
    const destinationId = created.value.destination.id
    const registrationId = created.value.registrationId
    await attach(row, destinationId, registrationId)
    await renew(row)
    const registered = await hook({
        ...ctx,
        key: registrationKey({
            project: row.projectId,
            flow: row.flowId,
            trigger: row.trigger,
            kind: 'hook',
        }),
        value: responses.OfficeWebhookInput.parse({
            event: row.event,
            fileId: row.fileId,
            sheetId: row.sheetId,
            destinationId,
            generation: row.generation,
        }),
    })
    if (registered.kind === 'error') throw new OfficeRegistrationCleanupError()
    await attachHook(row, registered.value.id)
    await renew(row)
    const removed = await unhook({ ...ctx, webhook: registered.value.id })
    if (removed.kind === 'error' && removed.error.code !== 'webhook_not_found') {
        throw new OfficeRegistrationCleanupError()
    }
    await renew(row)
    const dropped = await removeDestination({ ...ctx, destination: destinationId })
    if (dropped.kind === 'error' && dropped.error.code !== 'destination_not_found') {
        throw new OfficeRegistrationCleanupError()
    }
    const result: Array<{ id: string }> = await databaseConnection().query(
        `UPDATE veritly_office_registration
         SET state = 'deleted',
             "cleanupAt" = NULL,
             "cleanupToken" = NULL,
             "cleanupExpiresAt" = NULL,
             "deletedAt" = now(),
             updated = now()
         WHERE id = $1
           AND state = 'purging'
           AND "cleanupToken" = $2
         RETURNING id`,
        [row.id, row.cleanupToken],
    )
    if (result.length !== 1) throw new OfficeRegistrationCleanupLeaseError()
}

async function renew(row: CleanupRow) {
    const result: Array<{ id: string }> = await databaseConnection().query(
        `UPDATE veritly_office_registration
         SET "cleanupExpiresAt" = $3,
             updated = now()
         WHERE id = $1
           AND state = 'purging'
           AND "cleanupToken" = $2
         RETURNING id`,
        [row.id, row.cleanupToken, new Date(Date.now() + LEASE_MS).toISOString()],
    )
    if (result.length !== 1) throw new OfficeRegistrationCleanupLeaseError()
}

async function claim(): Promise<CleanupRow[]> {
    const token = randomUUID()
    return databaseConnection().transaction((manager) => manager.query(
        `WITH next AS (
             SELECT id
             FROM veritly_office_registration
             WHERE (
                    state IN ('destination_pending', 'hook_pending', 'deleting', 'idle')
                    AND "cleanupAt" <= now()
                 ) OR (
                    state = 'purging'
                    AND "cleanupExpiresAt" <= now()
                 )
             ORDER BY "cleanupAt", id
             FOR UPDATE SKIP LOCKED
             LIMIT $1
         )
         UPDATE veritly_office_registration item
         SET state = 'purging',
             "cleanupToken" = $2,
             "cleanupExpiresAt" = $3,
             "cleanupAttempts" = LEAST("cleanupAttempts" + 1, $4),
             updated = now()
         FROM next
         WHERE item.id = next.id
         RETURNING item.*`,
        [BATCH, token, new Date(Date.now() + LEASE_MS).toISOString(), MAX_ATTEMPTS],
    ))
}

async function attach(row: CleanupRow, destinationId: string, registrationId: string) {
    if (row.destinationId && row.destinationId !== destinationId) throw new OfficeRegistrationCleanupError()
    if (row.registrationId && row.registrationId !== registrationId) throw new OfficeRegistrationCleanupError()
    const result: Array<{ id: string }> = await databaseConnection().query(
        `UPDATE veritly_office_registration
         SET "destinationId" = $3,
             "registrationId" = $4,
             updated = now()
         WHERE id = $1
           AND state = 'purging'
           AND "cleanupToken" = $2
         RETURNING id`,
        [row.id, row.cleanupToken, destinationId, registrationId],
    )
    if (result.length !== 1) throw new OfficeRegistrationCleanupLeaseError()
}

async function attachHook(row: CleanupRow, webhook: string) {
    if (row.webhookId && row.webhookId !== webhook) throw new OfficeRegistrationCleanupError()
    const result: Array<{ id: string }> = await databaseConnection().query(
        `UPDATE veritly_office_registration
         SET "webhookId" = $3,
             updated = now()
         WHERE id = $1
           AND state = 'purging'
           AND "cleanupToken" = $2
         RETURNING id`,
        [row.id, row.cleanupToken, webhook],
    )
    if (result.length !== 1) throw new OfficeRegistrationCleanupLeaseError()
}

async function fail(row: CleanupRow) {
    const terminal = row.cleanupAttempts >= MAX_ATTEMPTS
    const result: Array<{ id: string }> = await databaseConnection().query(
        `UPDATE veritly_office_registration
         SET state = CASE
                 WHEN $3 THEN 'cleanup_failed'
                 WHEN "destinationId" IS NULL THEN 'destination_pending'
                 WHEN "webhookId" IS NULL THEN 'hook_pending'
                 ELSE 'idle'
             END,
             "cleanupAt" = CASE WHEN $3 THEN NULL ELSE now() + interval '1 minute' END,
             "cleanupToken" = NULL,
             "cleanupExpiresAt" = NULL,
             "deletedAt" = CASE WHEN $3 THEN now() ELSE NULL END,
             updated = now()
         WHERE id = $1
           AND state = 'purging'
           AND "cleanupToken" = $2
         RETURNING id`,
        [row.id, row.cleanupToken, terminal],
    )
    if (result.length !== 1) throw new OfficeRegistrationCleanupLeaseError()
}

class OfficeRegistrationCleanupError extends Error {}
export class OfficeRegistrationCleanupLeaseError extends Error {}
export class OfficeRegistrationCleanupIncompleteError extends Error {}

type CleanupRow = {
    id: string
    projectId: string
    flowId: string
    trigger: string
    endpoint: string
    event: string
    fileId: string
    sheetId: string
    generation: string
    destinationId: string | null
    registrationId: string | null
    webhookId: string | null
    cleanupAttempts: number
    cleanupToken: string
}
