import { databaseConnection } from '../../database/database-connection'
import {
    InterceptorVerdict,
    JobInterceptor,
    JobOutcome,
} from '../../workers/job-queue/job-interceptor'

const LEASE_MS = 3 * 60_000

export const officeJobInterceptor: JobInterceptor = {
    async preDispatch({ jobId, token }) {
        return claimOfficeJob(jobId, token)
    },

    async onJobFinished({ jobId, token, outcome }) {
        await finishOfficeJob(jobId, token, outcome)
    },

    async onJobHeartbeat({ jobId, token }) {
        await heartbeatOfficeJob(jobId, token)
    },
}

export async function claimOfficeJob(jobId: string, token: string) {
    return databaseConnection().transaction(async (manager) => {
        const rows: InboxRow[] = await manager.query(
            `SELECT state, "leaseToken", "leaseExpiresAt"
             FROM veritly_office_inbox
             WHERE "runId" = $1
             FOR UPDATE`,
            [jobId],
        )
        const row = rows[0]
        if (!row) return { verdict: InterceptorVerdict.ALLOW } as const
        if (row.state === 'succeeded' || row.state === 'failed') {
            return { verdict: InterceptorVerdict.DISCARD } as const
        }
        const expires = row.leaseExpiresAt ? new Date(row.leaseExpiresAt).getTime() : 0
        if (row.state === 'running' && row.leaseToken !== token && expires > Date.now()) {
            return { verdict: InterceptorVerdict.REJECT, delayInMs: 1_000 } as const
        }
        await manager.query(
            `UPDATE veritly_office_inbox
             SET state = 'running',
                 generation = generation + 1,
                 "commitToken" = $2,
                 "leaseToken" = $2,
                 "leaseExpiresAt" = $3,
                 updated = now()
             WHERE "runId" = $1`,
            [jobId, token, lease()],
        )
        return { verdict: InterceptorVerdict.ALLOW } as const
    })
}

export async function finishOfficeJob(jobId: string, token: string, outcome: JobOutcome) {
    if (outcome === JobOutcome.COMPLETED || outcome === JobOutcome.FAILED) {
        const rows: Array<{ runId: string }> = await databaseConnection().query(
            `UPDATE veritly_office_inbox
             SET state = $3,
                 "leaseToken" = NULL,
                 "leaseExpiresAt" = NULL,
                 "terminalAt" = now(),
                 updated = now()
             WHERE "runId" = $1
               AND state = 'running'
               AND "leaseToken" = $2
             RETURNING "runId"`,
            [jobId, token, outcome === JobOutcome.COMPLETED ? 'succeeded' : 'failed'],
        )
        await exact(jobId, rows)
        return
    }
    const rows: Array<{ runId: string }> = await databaseConnection().query(
        `UPDATE veritly_office_inbox
         SET state = 'queued',
             "commitToken" = NULL,
             "leaseToken" = NULL,
             "leaseExpiresAt" = NULL,
             updated = now()
         WHERE "runId" = $1
           AND state = 'running'
           AND "leaseToken" = $2
         RETURNING "runId"`,
        [jobId, token],
    )
    await exact(jobId, rows)
}

export async function heartbeatOfficeJob(jobId: string, token: string) {
    const result: Array<{ runId: string }> = await databaseConnection().query(
        `UPDATE veritly_office_inbox
         SET "leaseExpiresAt" = $3,
             updated = now()
         WHERE "runId" = $1
           AND state = 'running'
           AND "leaseToken" = $2
         RETURNING "runId"`,
        [jobId, token, lease()],
    )
    const exists: Array<{ runId: string }> = await databaseConnection().query(
        'SELECT "runId" FROM veritly_office_inbox WHERE "runId" = $1',
        [jobId],
    )
    if (exists.length > 0 && result.length !== 1) throw new OfficeJobLeaseError()
}

export async function failOfficeJob(jobId: string, token: string) {
    await databaseConnection().transaction(async (manager) => {
        const rows: InboxRow[] = await manager.query(
            `SELECT state, "leaseToken", "leaseExpiresAt"
             FROM veritly_office_inbox
             WHERE "runId" = $1
             FOR UPDATE`,
            [jobId],
        )
        const row = rows[0]
        if (!row || row.state === 'succeeded' || row.state === 'failed') return
        const expires = row.leaseExpiresAt ? new Date(row.leaseExpiresAt).getTime() : 0
        if (row.state === 'running' && row.leaseToken !== token && expires > Date.now()) {
            throw new OfficeJobLeaseError()
        }
        await manager.query(
            `UPDATE veritly_office_inbox
             SET state = 'failed',
                 "commitToken" = $2,
                 "leaseToken" = NULL,
                 "leaseExpiresAt" = NULL,
                 "terminalAt" = now(),
                 updated = now()
             WHERE "runId" = $1`,
            [jobId, token],
        )
    })
}

function lease() {
    return new Date(Date.now() + LEASE_MS).toISOString()
}

async function exact(jobId: string, rows: Array<{ runId: string }>) {
    if (rows.length === 1) return
    const tracked: Array<{ runId: string }> = await databaseConnection().query(
        'SELECT "runId" FROM veritly_office_inbox WHERE "runId" = $1',
        [jobId],
    )
    if (tracked.length > 0) throw new OfficeJobLeaseError()
}

export class OfficeJobLeaseError extends Error {}

type InboxRow = {
    state: 'queued' | 'running' | 'succeeded' | 'failed'
    leaseToken: string | null
    leaseExpiresAt: string | null
}
