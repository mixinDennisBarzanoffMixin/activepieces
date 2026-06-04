import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { healthStatusService } from './health.service'

const Public = {
    config: {
        security: securityAccess.public(),
    },
}

export const healthProbeModule: FastifyPluginAsyncZod = async (app) => {
    app.get('/livez', Public, async (_request, reply) => {
        await reply.status(StatusCodes.OK).send({
            service: 'activepieces-api',
            status: 'ok',
        })
    })

    app.get('/readyz', Public, async (_request, reply) => {
        const db = await healthStatusService(app.log).checkDatabaseHealth()
        const code = db ? StatusCodes.OK : StatusCodes.SERVICE_UNAVAILABLE
        await reply.status(code).send({
            service: 'activepieces-api',
            status: db ? 'ready' : 'not_ready',
            checks: {
                database: db,
            },
        })
    })
}
