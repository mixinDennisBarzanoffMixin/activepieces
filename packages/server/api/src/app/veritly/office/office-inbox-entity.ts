import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'

export const OfficeRegistrationEntity = new EntitySchema<OfficeRegistration>({
    name: 'veritly_office_registration',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: ApIdSchema,
        flowId: ApIdSchema,
        flowVersionId: ApIdSchema,
        trigger: bounded(128),
        endpoint: bounded(2048),
        event: bounded(32),
        fileId: bounded(80),
        sheetId: bounded(256),
        generation: bounded(128),
        destinationId: { ...bounded(80), nullable: true },
        registrationId: { ...bounded(80), nullable: true },
        webhookId: { ...bounded(80), nullable: true },
        state: bounded(24),
        cleanupAt: { type: 'timestamp with time zone', nullable: true },
        cleanupAttempts: { type: Number, default: 0 },
        cleanupToken: { ...bounded(128), nullable: true },
        cleanupExpiresAt: { type: 'timestamp with time zone', nullable: true },
        deletedAt: { type: 'timestamp with time zone', nullable: true },
    },
    indices: [
        {
            name: 'uq_office_registration_project_flow_trigger',
            columns: ['projectId', 'flowId', 'trigger'],
            unique: true,
        },
        {
            name: 'uq_office_registration_project_webhook',
            columns: ['projectId', 'webhookId'],
            unique: true,
        },
        {
            name: 'idx_office_registration_cleanup',
            columns: ['state', 'cleanupAt'],
        },
        {
            name: 'idx_office_registration_retention',
            columns: ['deletedAt'],
        },
    ],
})

export const OfficeInboxEntity = new EntitySchema<OfficeInbox>({
    name: 'veritly_office_inbox',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: ApIdSchema,
        flowId: ApIdSchema,
        flowVersionId: ApIdSchema,
        trigger: bounded(128),
        eventId: bounded(80),
        requestHash: bounded(64),
        payload: { type: 'jsonb' },
        runId: ApIdSchema,
        state: bounded(16),
        generation: { type: Number, default: 0 },
        commitToken: { ...bounded(128), nullable: true },
        leaseToken: { ...bounded(128), nullable: true },
        leaseExpiresAt: { type: 'timestamp with time zone', nullable: true },
        terminalAt: { type: 'timestamp with time zone', nullable: true },
    },
    uniques: [
        {
            name: 'uq_office_inbox_event',
            columns: ['projectId', 'flowId', 'trigger', 'eventId'],
        },
        {
            name: 'uq_office_inbox_run',
            columns: ['runId'],
        },
    ],
    indices: [
        {
            name: 'idx_office_inbox_retention',
            columns: ['terminalAt'],
        },
    ],
})

export const OfficeOutboxEntity = new EntitySchema<OfficeOutbox>({
    name: 'veritly_office_outbox',
    columns: {
        ...BaseColumnSchemaPart,
        runId: ApIdSchema,
        state: bounded(16),
        failure: { ...bounded(32), nullable: true },
        job: { type: 'jsonb' },
        attempts: { type: Number, default: 0 },
        availableAt: { type: 'timestamp with time zone' },
        leaseToken: { ...bounded(128), nullable: true },
        leaseExpiresAt: { type: 'timestamp with time zone', nullable: true },
        deliveredAt: { type: 'timestamp with time zone', nullable: true },
        terminalAt: { type: 'timestamp with time zone', nullable: true },
    },
    uniques: [
        {
            name: 'uq_office_outbox_run',
            columns: ['runId'],
        },
    ],
    indices: [
        {
            name: 'idx_office_outbox_pending',
            columns: ['state', 'availableAt'],
        },
    ],
})

export const OfficeEffectEntity = new EntitySchema<OfficeEffect>({
    name: 'veritly_office_effect',
    columns: {
        ...BaseColumnSchemaPart,
        runId: ApIdSchema,
        step: bounded(128),
        path: bounded(1024),
        policy: bounded(24),
        operationId: bounded(80),
        inputHash: bounded(64),
        state: bounded(24),
        output: { type: 'jsonb', nullable: true },
        outputHash: { ...bounded(64), nullable: true },
        terminalAt: { type: 'timestamp with time zone', nullable: true },
    },
    uniques: [
        {
            name: 'uq_office_effect_scope',
            columns: ['runId', 'step', 'path'],
        },
        {
            name: 'uq_office_effect_operation',
            columns: ['operationId'],
        },
    ],
})

function bounded(length: number) {
    return { type: String, length } as const
}

export type OfficeRegistration = {
    id: string
    created: string
    updated: string
    projectId: string
    flowId: string
    flowVersionId: string
    trigger: string
    endpoint: string
    event: string
    fileId: string
    sheetId: string
    generation: string
    destinationId: string | null
    registrationId: string | null
    webhookId: string | null
    state: 'destination_pending' | 'hook_pending' | 'active' | 'deleting' | 'idle' | 'purging' | 'deleted' | 'cleanup_failed'
    cleanupAt: string | null
    cleanupAttempts: number
    cleanupToken: string | null
    cleanupExpiresAt: string | null
    deletedAt: string | null
}

export type OfficeInbox = {
    id: string
    created: string
    updated: string
    projectId: string
    flowId: string
    flowVersionId: string
    trigger: string
    eventId: string
    requestHash: string
    payload: object
    runId: string
    state: 'queued' | 'running' | 'succeeded' | 'failed'
    generation: number
    commitToken: string | null
    leaseToken: string | null
    leaseExpiresAt: string | null
    terminalAt: string | null
}

export type OfficeOutbox = {
    id: string
    created: string
    updated: string
    runId: string
    state: 'pending' | 'delivered' | 'failed'
    failure: 'job_invalid' | 'enqueue_exhausted' | null
    job: unknown
    attempts: number
    availableAt: string
    leaseToken: string | null
    leaseExpiresAt: string | null
    deliveredAt: string | null
    terminalAt: string | null
}

export type OfficeEffect = {
    id: string
    created: string
    updated: string
    runId: string
    step: string
    path: string
    policy: 'pure' | 'idempotent' | 'reconcilable' | 'non_idempotent'
    operationId: string
    inputHash: string
    state: 'attempting' | 'succeeded' | 'outcome_unknown'
    output: JsonValue
    outputHash: string | null
    terminalAt: string | null
}

export type JsonValue = null | boolean | number | string | object
