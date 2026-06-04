import * as esbuild from 'esbuild'
import fs from 'fs'
import { createServer } from 'http'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outputPath = path.resolve(__dirname, '../../../dist/packages/engine/main.js')
const outdir = path.resolve(__dirname, '../../../dist/packages/engine')

const watch = process.argv.includes('--watch')
let lastBuildOk = false
let lastBuildAt = null
let lastErrorCount = 0

fs.rmSync(outdir, { recursive: true, force: true })

const buildOptions = {
    entryPoints: [path.resolve(__dirname, 'src/main.ts')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: outputPath,
    format: 'cjs',
    sourcemap: true,
    minify: !watch,
    metafile: true,
    treeShaking: true,
    alias: {
        '@activepieces/shared': path.resolve(__dirname, '../../shared/src'),
        '@activepieces/pieces-framework': path.resolve(__dirname, '../../pieces/framework/src'),
        '@activepieces/pieces-common': path.resolve(__dirname, '../../pieces/common/src'),
    },
    external: ['isolated-vm', 'utf-8-validate', 'bufferutil'],
    plugins: [
        {
            name: 'engine-rebuild-logger',
            setup(build) {
                let startedAt = 0
                build.onStart(() => {
                    startedAt = Date.now()
                    lastBuildOk = false
                    console.log('[engine] rebuilding…')
                })
                build.onEnd((result) => {
                    if (result.metafile) {
                        fs.writeFileSync(outputPath + '.meta.json', JSON.stringify(result.metafile))
                    }
                    const errors = result.errors?.length ?? 0
                    lastBuildOk = errors === 0
                    lastBuildAt = new Date().toISOString()
                    lastErrorCount = errors
                    if (errors > 0) {
                        console.log(`[engine] rebuild failed with ${errors} error(s)`)
                    } else {
                        console.log(`[engine] rebuild done in ${Date.now() - startedAt}ms`)
                    }
                })
            },
        },
    ],
}

function startHealthServer() {
    const host = process.env.AP_ENGINE_HEALTH_HOST || '127.0.0.1'
    const port = Number(process.env.AP_ENGINE_HEALTH_PORT || '3002')
    const server = createServer((req, res) => {
        const url = req.url ? req.url.split('?')[0] : ''
        if (req.method === 'GET' && url === '/livez') {
            sendHealth(res, 200, {
                service: 'activepieces-engine',
                status: 'ok',
            })
            return
        }
        if (req.method === 'GET' && url === '/readyz') {
            const ready = lastBuildOk && fs.existsSync(outputPath)
            sendHealth(res, ready ? 200 : 503, {
                service: 'activepieces-engine',
                status: ready ? 'ready' : 'not_ready',
                checks: {
                    bundle: ready,
                    errors: lastErrorCount,
                },
                builtAt: lastBuildAt,
            })
            return
        }
        res.writeHead(404)
        res.end()
    })
    server.listen(port, host, () => {
        console.log(`[engine] health server listening on http://${host}:${port}`)
    })
}

function sendHealth(res, code, body) {
    res.writeHead(code, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(body))
}

if (watch) {
    const ctx = await esbuild.context(buildOptions)
    await ctx.rebuild()
    startHealthServer()
    await ctx.watch()
} else {
    await esbuild.build(buildOptions)
}
