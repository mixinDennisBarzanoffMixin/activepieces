import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { veritlyAutomationController } from './veritly-automation.controller'

export const veritlyModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(veritlyAutomationController, { prefix: '/v1/veritly' })
}
