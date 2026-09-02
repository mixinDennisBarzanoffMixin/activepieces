import {
    FileType,
    Flow,
    FlowStatus,
    FlowVersion,
    isNil,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { triggerSourceService } from '../../trigger/trigger-source/trigger-source-service'
import { sampleDataService } from '../step-run/sample-data.service'
import { officeRegistrationCleanup } from '../../veritly/office/office-registration-cleanup'

export const flowSideEffects = (log: FastifyBaseLogger) => ({
    async preUpdateStatus({
        newStatus,
        flowToUpdate,
        publishedFlowVersion,
        templateId,
    }: PreUpdateStatusParams): Promise<void> {
        switch (newStatus) {
            case FlowStatus.ENABLED: {
                await triggerSourceService(log).enable({
                    flowVersion: publishedFlowVersion,
                    projectId: flowToUpdate.projectId,
                    simulate: false,
                    templateId,
                })
                break
            }
            case FlowStatus.DISABLED: {
                await triggerSourceService(log).disable({
                    flowId: publishedFlowVersion.flowId,
                    projectId: flowToUpdate.projectId,
                    simulate: false,
                    ignoreError: false,
                    templateId,
                })
                break
            }
        }
    },

    async preDelete({ flowToDelete }: PreDeleteParams): Promise<void> {
        const disabled = flowToDelete.status === FlowStatus.DISABLED || isNil(flowToDelete.publishedVersionId)
        if (!disabled) {
            await triggerSourceService(log).disable({
                flowId: flowToDelete.id,
                projectId: flowToDelete.projectId,
                simulate: false,
                ignoreError: true,
            })
        }
        await officeRegistrationCleanup.removeFlow({
            log,
            project: flowToDelete.projectId,
            flow: flowToDelete.id,
        })
        if (disabled) return

        await sampleDataService(log).deleteForFlow({
            projectId: flowToDelete.projectId,
            flowId: flowToDelete.id,
            fileType: FileType.SAMPLE_DATA,
        })

        await sampleDataService(log).deleteForFlow({
            projectId: flowToDelete.projectId,
            flowId: flowToDelete.id,
            fileType: FileType.SAMPLE_DATA_INPUT,
        })
    },
})

type PreUpdateStatusParams = {
    flowToUpdate: Flow
    publishedFlowVersion: FlowVersion
    newStatus: FlowStatus
    templateId?: string 
}


type PreDeleteParams = {
    flowToDelete: Flow
}
