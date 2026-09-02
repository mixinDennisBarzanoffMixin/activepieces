import { randomUUID } from 'node:crypto'
import { ConsumeJobRequest, ConsumeJobResponse, EngineResponseStatus, EngineScope, isNil, JobData, tryCatch } from '@activepieces/shared'
import { Worker as BullMQWorker, Job, UnrecoverableError } from 'bullmq'
import { BullMQOtel } from 'bullmq-otel'
import { FastifyBaseLogger } from 'fastify'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { redisConnections } from '../../database/redis-connections'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { failOfficeJob, finishOfficeJob, officeJobInterceptor } from '../../veritly/office/office-job-interceptor'
import { engineResponseWatcher } from '../engine-response-watcher'
import { QueueName } from '../job'
import { jobMigrations } from '../migrations/job-data-migrations'
import { rateLimiterInterceptor } from './interceptors/rate-limiter-interceptor'
import { zombiePollingInterceptor } from './interceptors/zombie-polling-interceptor'
import { InterceptorVerdict, JobInterceptor, JobOutcome } from './job-interceptor'
import { isUserInteractionJobData } from './job-queue'
import { createQueueDispatcher, QueueDispatcher } from './queue-dispatcher'

const DRAIN_DELAY_SECONDS = 15
const LOCK_DURATION_MS = 120_000

const interceptors: JobInterceptor[] = [officeJobInterceptor, rateLimiterInterceptor, zombiePollingInterceptor]
const workerPromises = new Map<string, Promise<BullMQWorker>>()
const dispatchers = new Map<string, QueueDispatcher>()

function ensureBullMQWorker(queueName: string, log: FastifyBaseLogger): Promise<BullMQWorker> {
    const existing = workerPromises.get(queueName)
    if (existing) return existing

    const promise = createBullMQWorker(queueName, log)
    workerPromises.set(queueName, promise)
    return promise
}

async function createBullMQWorker(queueName: string, log: FastifyBaseLogger): Promise<BullMQWorker> {
    const isOtelEnabled = system.getBoolean(AppSystemProp.OTEL_ENABLED)
    const worker = new BullMQWorker(
        queueName,
        undefined,
        {
            connection: await redisConnections.create(),
            telemetry: isOtelEnabled ? new BullMQOtel(queueName) : undefined,
            concurrency: 500,
            autorun: false,
            lockDuration: LOCK_DURATION_MS,
            stalledInterval: 30_000,
            maxStalledCount: 3,
            drainDelay: DRAIN_DELAY_SECONDS,
        },
    )
    await worker.waitUntilReady()
    await worker.startStalledCheckTimer()

    worker.on('stalled', (jobId: string) => {
        log.warn({ queueName, jobId }, '[jobBroker] Job stalled — BullMQ will retry automatically')
    })

    log.info({ queueName }, '[jobBroker] BullMQ worker initialized')
    return worker
}

async function fetchJobFromRedis(queueName: string, jobId: string, log: FastifyBaseLogger): Promise<Job | null> {
    const worker = await ensureBullMQWorker(queueName, log)
    const job = await Job.fromId(worker, jobId)
    if (isNil(job)) {
        log.warn({ jobId, queueName }, '[jobBroker] Job not found in Redis')
        return null
    }
    return job
}

function ensureDispatcher(queueName: string, worker: BullMQWorker, log: FastifyBaseLogger): QueueDispatcher {
    const existing = dispatchers.get(queueName)
    if (existing) return existing

    const dispatcher = createQueueDispatcher({
        queueName,
        worker,
        dequeue: tryDequeue,
        onOrphanedJob: returnJobToQueue,
        log,
    })
    dispatchers.set(queueName, dispatcher)
    return dispatcher
}

async function tryDequeue(worker: BullMQWorker, queueName: string, log: FastifyBaseLogger): Promise<ConsumeJobRequest | null> {
    const token = randomUUID()
    const job = await worker.getNextJob(token)
    if (isNil(job)) {
        return null  // waiting list empty — drainDelay provided backpressure
    }

    if (job.deferredFailure) {
        log.warn(
            { queueName, jobId: job.id, jobName: job.name, deferredFailure: job.deferredFailure },
            '[jobBroker#tryDequeue] Failing job with deferred failure (BullMQ stalled limit exceeded)',
        )
        await failOfficeJob(job.id ?? job.name, token)
        const { error: failError } = await tryCatch(() => job.moveToFailed(new UnrecoverableError(job.deferredFailure), token, false))
        if (failError) {
            log.error(
                { queueName, jobId: job.id, error: String(failError) },
                '[jobBroker#tryDequeue] Failed to fail deferred-failure job',
            )
        }
        return tryDequeue(worker, queueName, log)
    }

    log.info({ queueName, jobId: job.id, jobName: job.name }, '[jobBroker#tryDequeue] Dequeued job')

    const originalSchemaVersion = (job.data as Record<string, unknown>).schemaVersion
    const migratedData = await jobMigrations(log).apply(job.data)
    const jobId = job.id ?? job.name

    if (migratedData.schemaVersion !== originalSchemaVersion) {
        await job.updateData(migratedData)
    }

    const parseResult = JobData.safeParse(migratedData)
    if (!parseResult.success) {
        const issues = parseResult.error.issues.map(issue => `${issue.path.join('.') || '<root>'}: ${issue.message}`).join('; ')
        const reason = `Job data failed schema validation after migration: ${issues}`
        log.error(
            { queueName, jobId, schemaVersion: migratedData.schemaVersion, jobType: migratedData.jobType, issues: parseResult.error.issues },
            '[jobBroker#tryDequeue] Failing job with invalid schema as unrecoverable',
        )
        await failOfficeJob(jobId, token)
        const { error: failError } = await tryCatch(() => job.moveToFailed(new UnrecoverableError(reason), token, false))
        if (failError) {
            log.error({ queueName, jobId, error: String(failError) }, '[jobBroker#tryDequeue] Failed to fail invalid-schema job')
        }
        return tryDequeue(worker, queueName, log)
    }

    const interceptorResult = await runInterceptors({ jobId, jobData: migratedData, job, token, log })
    if (interceptorResult === 'DISCARD') {
        await job.moveToCompleted(null, token, false)
        return tryDequeue(worker, queueName, log)
    }
    if (interceptorResult !== null) {
        await job.moveToDelayed(Date.now() + interceptorResult.delayInMs, token)
        if (interceptorResult.priority !== undefined) {
            await job.changePriority({ priority: interceptorResult.priority })
        }
        return tryDequeue(worker, queueName, log)  // retry getNextJob instead of returning null
    }

    const engineToken = await accessTokenManager(log).generateEngineToken({
        jobId,
        claim: token,
        scope: scope(migratedData),
        projectId: migratedData.projectId as string,
        platformId: migratedData.platformId,
    })

    return {
        jobId,
        jobData: migratedData,
        attempsStarted: job.attemptsMade,
        engineToken,
        token,
        queueName,
    }
}

async function returnJobToQueue(jobId: string, token: string, queueName: string, log: FastifyBaseLogger): Promise<void> {
    const job = await fetchJobFromRedis(queueName, jobId, log)
    if (isNil(job)) {
        return
    }
    const jobData = JobData.parse(job.data)
    await job.moveToDelayed(Date.now() + 100, token)
    for (const interceptor of interceptors) {
        const { error } = await tryCatch(() => interceptor.onJobFinished({
            jobId,
            jobData,
            token,
            outcome: JobOutcome.RELEASED,
            log,
        }))
        if (error) {
            log.error({ jobId, error: String(error) }, '[jobBroker#returnJobToQueue] interceptor cleanup failed')
        }
    }
    log.info({ jobId }, '[jobBroker#returnJobToQueue] orphaned job returned to queue')
}

async function runInterceptors({ jobId, jobData, job, token, log }: {
    jobId: string
    jobData: JobData
    job: Job
    token: string
    log: FastifyBaseLogger
}): Promise<{ delayInMs: number, priority?: number } | 'DISCARD' | null> {
    const passed: JobInterceptor[] = []
    for (const interceptor of interceptors) {
        const result = await interceptor.preDispatch({ jobId, jobData, job, token, log })
        if (result.verdict === InterceptorVerdict.DISCARD) {
            for (const passedInterceptor of passed) {
                const { error } = await tryCatch(() => passedInterceptor.onJobFinished({
                    jobId,
                    jobData,
                    token,
                    outcome: JobOutcome.RELEASED,
                    log,
                }))
                if (error) {
                    log.error({ jobId, error: String(error) }, '[jobBroker] Failed to clean up interceptor on discard')
                }
            }
            return 'DISCARD'
        }
        if (result.verdict === InterceptorVerdict.REJECT) {
            for (const passedInterceptor of passed) {
                const { error } = await tryCatch(() => passedInterceptor.onJobFinished({
                    jobId,
                    jobData,
                    token,
                    outcome: JobOutcome.RELEASED,
                    log,
                }))
                if (error) {
                    log.error({ jobId, error: String(error) }, '[jobBroker] Failed to clean up interceptor on reject')
                }
            }
            return { delayInMs: result.delayInMs, priority: result.priority }
        }
        passed.push(interceptor)
    }
    return null
}

function buildFailedReason(errorMessage: string, logs?: string): string {
    if (!logs) return errorMessage
    return `${errorMessage}\n${logs}`
}

export { tryDequeue }

export const jobBroker = (log: FastifyBaseLogger) => ({
    async init(): Promise<void> {
        await ensureBullMQWorker(QueueName.WORKER_JOBS, log)
        log.info('[jobBroker] Job broker initialized')
    },

    async poll(queueName: string = QueueName.WORKER_JOBS): Promise<ConsumeJobRequest | null> {
        const worker = await ensureBullMQWorker(queueName, log)
        const dispatcher = ensureDispatcher(queueName, worker, log)
        return dispatcher.poll()
    },

    async completeJob(input: ConsumeJobResponse & { jobId: string, token: string, queueName: string }): Promise<void> {
        const job = await fetchJobFromRedis(input.queueName, input.jobId, log)
        if (isNil(job)) {
            return
        }

        const jobData = JobData.parse(job.data)
        const userJobData = isUserInteractionJobData(jobData) ? jobData : null
        const outcome = input.status !== EngineResponseStatus.INTERNAL_ERROR
            ? JobOutcome.COMPLETED
            : job.attemptsMade + 1 >= Math.max(job.opts.attempts === undefined ? 1 : job.opts.attempts, 1)
                ? JobOutcome.FAILED
                : JobOutcome.RETRY

        // The PostgreSQL run claim is the durable authority. Commit it before the
        // Redis terminal transition so a crash can only leave a replayable Bull job.
        await finishOfficeJob(input.jobId, input.token, outcome)

        const { error } = await tryCatch(async () => {
            if (input.status === EngineResponseStatus.INTERNAL_ERROR) {
                await job.moveToFailed(new Error(buildFailedReason(input.errorMessage ?? 'Internal error', input.logs)), input.token)
                if (userJobData) {
                    await engineResponseWatcher(log).publish(userJobData.webserverId, userJobData.requestId, {
                        status: EngineResponseStatus.INTERNAL_ERROR,
                        response: undefined,
                        error: input.errorMessage ?? 'Internal error',
                        logs: input.logs,
                    })
                }
                return
            }

            await job.moveToCompleted({ response: input.response ?? undefined }, input.token, false)
            if (userJobData) {
                await engineResponseWatcher(log).publish(userJobData.webserverId, userJobData.requestId, {
                    status: input.status,
                    response: input.response,
                    error: input.errorMessage,
                    logs: input.logs,
                })
            }
        })
        if (error) {
            log.error({ jobId: input.jobId, error: String(error), originalError: input.errorMessage }, '[jobBroker] Failed to move job to final state — leaving for stalled-scan recovery')
            if (userJobData) {
                await engineResponseWatcher(log).publish(userJobData.webserverId, userJobData.requestId, {
                    status: EngineResponseStatus.INTERNAL_ERROR,
                    response: undefined,
                    error: String(error),
                })
            }
        }

        for (const interceptor of interceptors) {
            if (interceptor === officeJobInterceptor) continue
            const { error: interceptorError } = await tryCatch(() => interceptor.onJobFinished({
                jobId: input.jobId,
                jobData,
                token: input.token,
                outcome: isNil(error) ? outcome : JobOutcome.RELEASED,
                log,
            }))
            if (interceptorError) {
                log.error({ jobId: input.jobId, error: String(interceptorError) }, '[jobBroker] Interceptor onJobFinished failed')
            }
        }
    },

    async extendLock(input: { jobId: string, token: string, queueName: string }): Promise<void> {
        const job = await fetchJobFromRedis(input.queueName, input.jobId, log)
        if (isNil(job)) {
            return
        }
        await job.extendLock(input.token, LOCK_DURATION_MS)
        for (const interceptor of interceptors) {
            if (!interceptor.onJobHeartbeat) continue
            await interceptor.onJobHeartbeat({ jobId: input.jobId, token: input.token, log })
        }
        log.debug({ jobId: input.jobId }, '[jobBroker] Lock extended')
    },

    async close(): Promise<void> {
        for (const dispatcher of dispatchers.values()) {
            dispatcher.close()
        }
        dispatchers.clear()

        const workers = await Promise.allSettled([...workerPromises.values()])
        await Promise.allSettled(
            workers
                .filter((r): r is PromiseFulfilledResult<BullMQWorker> => r.status === 'fulfilled')
                .map(r => r.value.close()),
        )
        workerPromises.clear()
    },
})

function scope(input: JobData): EngineScope {
    const data = input as unknown as Record<string, unknown>
    if (typeof data.flowId !== 'string' || typeof data.flowVersionId !== 'string') return { kind: 'system' }
    return {
        kind: 'flow',
        flowId: data.flowId,
        flowVersionId: data.flowVersionId,
        ...(typeof data.runId === 'string' ? { runId: data.runId } : {}),
    }
}
