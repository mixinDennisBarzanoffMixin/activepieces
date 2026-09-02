import {
    EngineOperationType,
    EngineResponseStatus,
    ExecuteTriggerResponse,
    FlowVersion,
    isNil,
    parseToJsonIfPossible,
    PieceTrigger,
    StreamStepProgress,
    TriggerHookType,
    TriggerPayload,
    tryCatch,
    WebhookJobData,
    WorkerJobType,
} from '@activepieces/shared'
import { flowCache } from '../../cache/flow/flow-cache'
import { workerSettings } from '../../config/worker-settings'
import { FireAndForgetJobResult, JobContext, JobHandler, JobResultKind } from '../types'
import { provisionFlowPieces } from '../utils/flow-helpers'
import { resolvePayload } from '../utils/resolve-payload'
import { isSandboxTimeout } from '../utils/sandbox-helpers'
import { getAppWebhookUrl, getWebhookUrl } from '../utils/webhook-url'

function getAppWebhookDetails(flowVersion: FlowVersion, publicApiUrl: string, appWebhookSecretsJson: string): { appWebhookUrl?: string, webhookSecret?: string | Record<string, string> } {
    const trigger = flowVersion.trigger as PieceTrigger
    const pieceName = trigger?.settings?.pieceName
    if (isNil(pieceName)) {
        return {}
    }
    const secrets = parseToJsonIfPossible(appWebhookSecretsJson) as Record<string, { webhookSecret: string | Record<string, string> }> | undefined
    const webhookSecret = secrets?.[pieceName]?.webhookSecret
    const pieceUrlName = pieceName.replace('@activepieces/piece-', '')
    return {
        appWebhookUrl: getAppWebhookUrl(publicApiUrl, pieceUrlName),
        webhookSecret,
    }
}

export const executeWebhookJob: JobHandler<WebhookJobData, FireAndForgetJobResult> = {
    jobType: WorkerJobType.EXECUTE_WEBHOOK,
    async execute(ctx: JobContext, data: WebhookJobData): Promise<FireAndForgetJobResult> {
        const settings = workerSettings.getSettings()
        const timeoutInSeconds = settings.TRIGGER_TIMEOUT_SECONDS
        ctx.log.info({
            flowId: data.flowId,
            flowVersionIdToRun: data.flowVersionIdToRun,
            projectId: data.projectId,
            saveSampleData: data.saveSampleData,
            execute: data.execute,
            runEnvironment: data.runEnvironment,
        }, '[executeWebhookJob] Start')
        const resolvedPayload = await resolvePayload(data.payload, data.projectId, ctx.apiClient)
        ctx.log.info({
            flowId: data.flowId,
            body: typeof (resolvedPayload as { body?: unknown }).body,
            method: (resolvedPayload as { method?: unknown }).method,
        }, '[executeWebhookJob] Payload resolved')

        const flowVersion = await flowCache(ctx.log, ctx.apiClient).getVersion({ flowVersionId: data.flowVersionIdToRun })
        if (isNil(flowVersion)) {
            ctx.log.info({ flowVersionId: data.flowVersionIdToRun }, 'Flow version not found for webhook, skipping')
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
        }
        ctx.log.info({
            flowVersionId: flowVersion.id,
            flowId: flowVersion.flowId,
            state: flowVersion.state,
            valid: flowVersion.valid,
            trigger: (flowVersion.trigger as PieceTrigger).settings?.triggerName,
        }, '[executeWebhookJob] Flow version loaded')

        const { appWebhookUrl, webhookSecret } = getAppWebhookDetails(flowVersion, ctx.publicApiUrl, settings.APP_WEBHOOK_SECRETS)

        const provisioned = await provisionFlowPieces({ flowVersion, platformId: data.platformId, flowId: data.flowId, projectId: data.projectId, log: ctx.log, apiClient: ctx.apiClient })
        if (!provisioned) {
            ctx.log.warn({ flowId: data.flowId }, '[executeWebhookJob] Pieces not provisioned')
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
        }

        const sandbox = ctx.sandboxManager.acquire({ log: ctx.log, apiClient: ctx.apiClient })
        const { data: execResult, error } = await tryCatch(async () => {
            await sandbox.start({
                flowVersionId: flowVersion.id,
                platformId: data.platformId,
                mounts: [],
            })

            if (data.saveSampleData) {
                const sampleResult = await sandbox.execute(
                    EngineOperationType.EXECUTE_TRIGGER_HOOK,
                    {
                        hookType: TriggerHookType.RUN,
                        flowVersion,
                        webhookUrl: getWebhookUrl(ctx.publicApiUrl, data.flowId, true),
                        triggerPayload: resolvedPayload as TriggerPayload,
                        test: true,
                        projectId: data.projectId,
                        platformId: data.platformId,
                        engineToken: ctx.engineToken,
                        jobId: ctx.jobId,
                        claim: ctx.claim,
                        internalApiUrl: ctx.internalApiUrl,
                        publicApiUrl: ctx.publicApiUrl,
                        timeoutInSeconds,
                        appWebhookUrl,
                        webhookSecret,
                    },
                    { timeoutInSeconds },
                )

                if (sampleResult.status === EngineResponseStatus.OK) {
                    const sampleTriggerResult = sampleResult.response as ExecuteTriggerResponse<TriggerHookType.RUN>
                    if (sampleTriggerResult.output.length > 0) {
                        await ctx.apiClient.savePayloads({
                            flowId: data.flowId,
                            flowVersionId: flowVersion.id,
                            projectId: data.projectId,
                            payloads: sampleTriggerResult.output,
                        })
                    }
                }
            }

            if (!data.execute) {
                ctx.log.warn({
                    flowId: data.flowId,
                    saveSampleData: data.saveSampleData,
                }, '[executeWebhookJob] Skipping trigger run because execute=false')
                return null
            }

            const result = await sandbox.execute(
                EngineOperationType.EXECUTE_TRIGGER_HOOK,
                {
                    hookType: TriggerHookType.RUN,
                    flowVersion,
                    webhookUrl: getWebhookUrl(ctx.publicApiUrl, data.flowId),
                    triggerPayload: resolvedPayload as TriggerPayload,
                    test: false,
                    projectId: data.projectId,
                    platformId: data.platformId,
                    engineToken: ctx.engineToken,
                    jobId: ctx.jobId,
                    claim: ctx.claim,
                    internalApiUrl: ctx.internalApiUrl,
                    publicApiUrl: ctx.publicApiUrl,
                    timeoutInSeconds,
                    appWebhookUrl,
                    webhookSecret,
                },
                { timeoutInSeconds },
            )

            return result
        })
        await ctx.sandboxManager.release(ctx.log)

        if (error) {
            await ctx.sandboxManager.invalidate(ctx.log)
            if (isSandboxTimeout(error)) {
                ctx.log.warn({ flowVersionId: data.flowVersionIdToRun }, 'Webhook execution timed out in sandbox')
                return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
            }
            throw error
        }

        if (isNil(execResult)) {
            ctx.log.warn({
                flowId: data.flowId,
                saveSampleData: data.saveSampleData,
                execute: data.execute,
            }, '[executeWebhookJob] No trigger result')
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
        }

        ctx.log.info({ status: execResult.status }, '[executeWebhookJob] Trigger hook finished')

        if (execResult.status === EngineResponseStatus.OK) {
            const triggerResult = execResult.response as ExecuteTriggerResponse<TriggerHookType.RUN>
            ctx.log.info({ outputCount: triggerResult.output.length }, '[executeWebhookJob] Trigger hook output')
            if (triggerResult.output.length > 0) {
                const runs = await ctx.apiClient.submitPayloads({
                    flowVersionId: flowVersion.id,
                    projectId: data.projectId,
                    payloads: triggerResult.output,
                    httpRequestId: data.requestId,
                    environment: data.runEnvironment,
                    streamStepProgress: StreamStepProgress.NONE,
                    parentRunId: data.parentRunId,
                    failParentOnFailure: data.failParentOnFailure,
                })
                ctx.log.info({ runCount: runs.length }, '[executeWebhookJob] Payloads submitted')
            }
        }
        else {
            ctx.log.warn({ status: execResult.status, response: execResult.response }, '[executeWebhookJob] Trigger hook did not return OK')
        }

        return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK, logs: execResult.logs }
    },
}
