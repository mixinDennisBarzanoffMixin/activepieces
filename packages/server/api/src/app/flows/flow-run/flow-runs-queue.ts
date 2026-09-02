import { apId, FlowRun, FlowRunStatus, isFlowRunStateTerminal, isNil, spreadIfDefined } from '@activepieces/shared'
import { Queue, Worker } from 'bullmq'
import { BullMQOtel } from 'bullmq-otel'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager } from 'typeorm'
import { databaseConnection } from '../../database/database-connection'
import { distributedLock, distributedStore, redisConnections } from '../../database/redis-connections'
import { domainHelper } from '../../helper/domain-helper'
import { exceptionHandler } from '../../helper/exception-handler'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { QueueName, redisMetadataKey, RunsMetadataJobData, RunsMetadataQueueConfig, runsMetadataQueueFactory, RunsMetadataUpsertData } from '../../workers/job'
import { flowService } from '../flow/flow.service'
import { flowRunRepo } from './flow-run-service'
import { flowRunSideEffects } from './flow-run-side-effects'
import { resumeService } from './waitpoint/resume-service'
import { waitpointService } from './waitpoint/waitpoint-service'
import { WaitpointStatus } from './waitpoint/waitpoint-types'

let runsMetadataWorker: Worker<RunsMetadataJobData> | undefined = undefined

const queue = runsMetadataQueueFactory({ createRedisConnection: redisConnections.create, distributedStore })

export const runsMetadataQueue = (log: FastifyBaseLogger) => ({
    async init(): Promise<void> {
        const queueName = QueueName.RUNS_METADATA
        const isOtelEnabled = system.getBoolean(AppSystemProp.OTEL_ENABLED) ?? false

        const config: RunsMetadataQueueConfig = {
            isOtelEnabled,
            redisFailedJobRetentionDays: system.getNumberOrThrow(AppSystemProp.REDIS_FAILED_JOB_RETENTION_DAYS),
            redisFailedJobRetentionMaxCount: system.getNumberOrThrow(AppSystemProp.REDIS_FAILED_JOB_RETENTION_MAX_COUNT),
        }
        await queue.init(config)
        runsMetadataWorker = new Worker<RunsMetadataJobData>(
            queueName,
            async (job) => {
                log.info({
                    jobId: job.id,
                    runId: job.data.runId,
                }, '[runsMetadataQueue#worker] Saving runs metadata')
                const key = redisMetadataKey(job.data.runId)
                await distributedLock(log).runExclusive({
                    key: `runs_metadata_${job.data.runId}`,
                    timeoutInSeconds: 30,
                    fn: async () => {
                        try {
                            await runsMetadataQueue(log).get().removeDeduplicationKey(job.data.runId)
                            const runMetadata = await distributedStore.hgetJson<RunsMetadataUpsertData>(key)
                            if (isNil(runMetadata) || Object.keys(runMetadata).length === 0) {
                                log.info({
                                    jobId: job.id,
                                    runId: job.data.runId,
                                }, '[runsMetadataQueue#worker] Runs metadata not found, skipping job')
                                return
                            }

                            const savedFlowRun = await persist(runMetadata, log)
                            if (!savedFlowRun) {
                                if (!isNil(runMetadata.requestId)) {
                                    await distributedStore.deleteKeyIfFieldValueMatches(key, 'requestId', runMetadata.requestId)
                                }
                                log.info({ jobId: job.id, runId: job.data.runId }, '[runsMetadataQueue#worker] Stale Office metadata discarded')
                                return
                            }

                            const parentRunId = savedFlowRun.parentRunId
                            const shouldMarkParentAsFailed = savedFlowRun.failParentOnFailure && !isNil(parentRunId) && ![FlowRunStatus.SUCCEEDED, FlowRunStatus.RUNNING, FlowRunStatus.PAUSED, FlowRunStatus.QUEUED].includes(savedFlowRun.status)
                            if (shouldMarkParentAsFailed) {
                                await markParentRunAsFailed({
                                    parentRunId,
                                    childRunId: savedFlowRun.id,
                                    projectId: savedFlowRun.projectId,
                                    log,
                                })
                            }

                            if (!isNil(runMetadata.requestId)) {
                                await distributedStore.deleteKeyIfFieldValueMatches(key, 'requestId', runMetadata.requestId)
                            }
                            if (!isNil(runMetadata.finishTime)) {
                                await flowRunSideEffects(log).onFinish(savedFlowRun)
                            }

                            if (savedFlowRun.status === FlowRunStatus.PAUSED) {
                                const latestWaitpoint = await waitpointService(log).getByFlowRunId(savedFlowRun.id)
                                const isPreCompleted = !isNil(latestWaitpoint)
                                    && latestWaitpoint.status === WaitpointStatus.COMPLETED
                                if (isPreCompleted) {
                                    await resumeService(log).resumeFromWaitpoint({
                                        flowRunId: savedFlowRun.id,
                                        waitpointId: latestWaitpoint.id,
                                        resumePayload: latestWaitpoint.resumePayload,
                                    })
                                }
                            }
                        }
                        catch (error) {
                            log.error({
                                error,
                                data: job.data,
                            }, '[runsMetadataQueue#worker] Error saving runs metadata')
                            exceptionHandler.handle(error, log)
                            throw error
                        }
                    },
                })

            },
            {
                connection: await redisConnections.create(),
                telemetry: isOtelEnabled ? new BullMQOtel(queueName) : undefined,
                concurrency: system.getNumberOrThrow(AppSystemProp.RUNS_METADATA_UPDATE_CONCURRENCY),
                autorun: true,
            },
        )

        await runsMetadataWorker.waitUntilReady()
    },

    async add(params: RunsMetadataUpsertData): Promise<void> {
        const add = async () => {
            log.info({
                runId: params.id,
                projectId: params.projectId,
            }, '[runsMetadataQueue#add] Adding runs metadata to queue')
            if (params.officeJobId && !await persist(params, log)) return
            await queue.add(params)
        }
        if (!params.officeJobId) return add()
        await distributedLock(log).runExclusive({
            key: `runs_metadata_${params.id}`,
            timeoutInSeconds: 30,
            fn: add,
        })
    },

    get(): Queue<RunsMetadataJobData> {
        return queue.get()
    },
    async close(): Promise<void> {
        if (queue.get()) {
            await queue.get().close()
        }

        if (runsMetadataWorker) {
            await runsMetadataWorker.close()
        }
    },

})

async function persist(input: RunsMetadataUpsertData, log: FastifyBaseLogger): Promise<FlowRun | undefined> {
    return databaseConnection().transaction(async (manager) => {
        if (Boolean(input.officeJobId) !== Boolean(input.officeClaim)) throw new OfficeMetadataScopeError()
        if (input.officeJobId && !await allowed(manager, input)) return undefined
        const repo = flowRunRepo(manager)
        const current = await repo.findOneBy({ id: input.id })
        if (current) {
            const terminal = isFlowRunStateTerminal({ status: current.status, ignoreInternalError: false })
            if (input.officeJobId && terminal && input.status !== current.status) return undefined
            await repo.update(input.id, {
                ...spreadIfDefined('projectId', input.projectId),
                ...spreadIfDefined('flowId', input.flowId),
                ...spreadIfDefined('flowVersionId', input.flowVersionId),
                ...spreadIfDefined('environment', input.environment),
                ...spreadIfDefined('startTime', input.startTime),
                ...spreadIfDefined('finishTime', input.finishTime),
                ...spreadIfDefined('status', input.status),
                ...spreadIfDefined('tags', input.tags),
                ...spreadIfDefined('failedStep', input.failedStep),
                ...spreadIfDefined('stepNameToTest', input.stepNameToTest),
                ...spreadIfDefined('parentRunId', input.parentRunId),
                ...spreadIfDefined('failParentOnFailure', input.failParentOnFailure),
                ...spreadIfDefined('logsFileId', input.logsFileId),
                ...spreadIfDefined('updated', input.updated),
                ...spreadIfDefined('stepsCount', input.stepsCount),
            })
            return await repo.findOneBy({ id: input.id }) ?? undefined
        }
        const flowId = input.flowId
        if (isNil(flowId) || !await flowService(log).exists(flowId)) return undefined
        return repo.save(input)
    })
}

async function allowed(manager: EntityManager, input: RunsMetadataUpsertData) {
    const rows: OfficeLeaseRow[] = await manager.query(
        `SELECT state, "commitToken", "leaseToken", "leaseExpiresAt"
         FROM veritly_office_inbox
         WHERE "runId" = $1
         FOR UPDATE`,
        [input.id],
    )
    const row = rows[0]
    if (!row) return true
    if (input.officeJobId !== input.id || !input.officeClaim) return false
    if (row.commitToken !== input.officeClaim) return false
    if (row.state === 'succeeded' || row.state === 'failed') {
        return input.status !== undefined
            && isFlowRunStateTerminal({ status: input.status, ignoreInternalError: false })
    }
    return row.state === 'running'
        && row.leaseToken === input.officeClaim
        && Boolean(row.leaseExpiresAt)
        && new Date(row.leaseExpiresAt!).getTime() > Date.now()
}

class OfficeMetadataScopeError extends Error {}

type OfficeLeaseRow = {
    state: 'queued' | 'running' | 'succeeded' | 'failed'
    commitToken: string | null
    leaseToken: string | null
    leaseExpiresAt: string | null
}

async function markParentRunAsFailed({
    parentRunId,
    childRunId,
    projectId,
    log,
}: MarkParentRunAsFailedParams): Promise<void> {
    const flowRun = await flowRunRepo().findOneBy({
        id: parentRunId,
    })

    if (isNil(flowRun) || isFlowRunStateTerminal({ status: flowRun.status, ignoreInternalError: false })) {
        return
    }

    const childRunUrl = await domainHelper.getPublicUrl({ path: `/projects/${projectId}/runs/${childRunId}` })
    const errorPayload = {
        body: {
            status: 'error',
            data: {
                message: 'Subflow execution failed',
                link: childRunUrl,
            },
        },
        headers: {},
        queryParams: {},
    }

    const existingWaitpoint = await waitpointService(log).getByFlowRunId(parentRunId)
    const result = await waitpointService(log).complete({
        flowRunId: parentRunId,
        projectId: flowRun.projectId,
        waitpointId: existingWaitpoint?.id ?? apId(),
        resumePayload: errorPayload,
    })

    if (result.completedExisting && !isNil(result.waitpoint)) {
        await resumeService(log).resumeFromWaitpoint({
            flowRunId: parentRunId,
            waitpointId: result.waitpoint.id,
            resumePayload: result.waitpoint.resumePayload,
        })
    }
}

type MarkParentRunAsFailedParams = {
    parentRunId: string
    childRunId: string
    projectId: string
    log: FastifyBaseLogger
}
