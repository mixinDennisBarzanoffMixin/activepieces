import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { veritlyAutomationController } from './veritly-automation.controller'
import { veritlyDataController } from './veritly-data.controller'

export const veritlyModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(veritlyAutomationController, { prefix: '/v1/veritly' })
    await app.register(veritlyDataController, { prefix: '/v1/veritly' })
}
