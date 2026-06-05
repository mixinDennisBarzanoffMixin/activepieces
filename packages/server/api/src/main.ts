import './instrumentation'

import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { appPostBoot } from './app/app'
import { initializeDatabase } from './app/database'
import { distributedLock } from './app/database/redis-connections'
import { system } from './app/helper/system/system'
import { AppSystemProp } from './app/helper/system/system-props'
import { setupServer } from './app/server'

const start = async (app: FastifyInstance): Promise<void> => {
    try {
        const port = Number(system.get(AppSystemProp.PORT))
        console.info('[veritly-ap-api] listen:start', { port })
        await app.listen({
            host: '::',
            port,
        })
        console.info('[veritly-ap-api] listen:done', { port })
        if (system.isApp()) {
            console.info('[veritly-ap-api] postboot:start')
            await appPostBoot(app)
            console.info('[veritly-ap-api] postboot:done')
        }
    }
    catch (err) {
        app.log.error({ err }, 'Failed to start server')
        process.exit(1)
    }
}

// This might be needed as it can be called twice
let shuttingDown = false

const stop = async (app: FastifyInstance): Promise<void> => {
    if (shuttingDown) return
    shuttingDown = true

    try {
        await app.close()
        process.exit(0)
    }
    catch (err) {
        app.log.error({ err }, 'Error stopping server')
        process.exit(1)
    }
}

function setupTimeZone(): void {
    // It's important to set the time zone to UTC when working with dates in PostgreSQL.
    // If the time zone is not set to UTC, there can be problems when storing dates in UTC but not considering the UTC offset when converting them back to local time. This can lead to incorrect fields being displayed for the created
    // https://stackoverflow.com/questions/68240368/typeorm-find-methods-returns-wrong-timestamp-time
    process.env.TZ = 'UTC'
}

const main = async (): Promise<void> => {
    console.info('[veritly-ap-api] main:start', {
        type: process.env.AP_CONTAINER_TYPE,
        port: process.env.AP_PORT,
        db: process.env.AP_POSTGRES_HOST,
        redis: process.env.AP_REDIS_HOST,
    })
    setupTimeZone()
    if (system.isApp()) {
        console.info('[veritly-ap-api] migration:start')
        await distributedLock(system.globalLogger()).runExclusive({
            key: 'database-migration-lock',
            timeoutInSeconds: dayjs.duration(10, 'minutes').asSeconds(),
            fn: async () => initializeDatabase({ runMigrations: true }),
        })
        console.info('[veritly-ap-api] migration:done')
    }
    console.info('[veritly-ap-api] setup:start')
    const app = await setupServer()
    console.info('[veritly-ap-api] setup:done')

    process.on('SIGINT', async () => {
        await stop(app).catch((e) => system.globalLogger().error({ err: e }, '[main#stop] Failed to stop server'))
    })

    process.on('SIGTERM', async () => {
        await stop(app).catch((e) => system.globalLogger().error({ err: e }, '[main#stop] Failed to stop server'))
    })

    await start(app)
}

main().catch((e) => {
    system.globalLogger().error({ err: e }, '[main#start] Failed to start server')
    process.exit(1)
})
