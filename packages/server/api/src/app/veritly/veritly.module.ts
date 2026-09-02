import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { engineLease } from '../authentication/lib/engine-lease'
import { officeLease } from './office/office-inbox-service'
import { veritlyAutomationController } from './veritly-automation.controller'
import { veritlyDataController } from './veritly-data.controller'
import { veritlyOfficeController } from './veritly-office.controller'
import { officeOutbox } from './office/office-outbox'
import { officeRegistrationCleanup } from './office/office-registration-cleanup'

export const veritlyModule: FastifyPluginAsyncZod = async (app) => {
    engineLease.use((principal) => officeLease(principal))
    officeOutbox.start(app.log)
    officeRegistrationCleanup.start(app.log)
    await app.register(veritlyAutomationController, { prefix: '/v1/veritly' })
    await app.register(veritlyOfficeController, { prefix: '/v1/veritly' })
    await app.register(veritlyDataController, { prefix: '/v1/veritly' })
    app.addHook('onClose', async () => {
        await officeOutbox.close()
        await officeRegistrationCleanup.close()
    })
}
