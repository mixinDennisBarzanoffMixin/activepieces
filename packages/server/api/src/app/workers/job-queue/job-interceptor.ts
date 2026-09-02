import { JobData } from '@activepieces/shared'
import { Job } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'

export enum InterceptorVerdict {
    ALLOW = 'ALLOW',
    REJECT = 'REJECT',
    DISCARD = 'DISCARD',
}

export enum JobOutcome {
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    RETRY = 'RETRY',
    RELEASED = 'RELEASED',
}

export type InterceptorResult =
    | { verdict: InterceptorVerdict.ALLOW }
    | { verdict: InterceptorVerdict.REJECT, delayInMs: number, priority?: number }
    | { verdict: InterceptorVerdict.DISCARD }

export type JobInterceptor = {
    preDispatch(params: {
        jobId: string
        jobData: JobData
        job: Job
        token: string
        log: FastifyBaseLogger
    }): Promise<InterceptorResult>
    onJobFinished(params: {
        jobId: string
        jobData: JobData
        token: string
        outcome: JobOutcome
        log: FastifyBaseLogger
    }): Promise<void>
    onJobHeartbeat?(params: {
        jobId: string
        token: string
        log: FastifyBaseLogger
    }): Promise<void>
}
