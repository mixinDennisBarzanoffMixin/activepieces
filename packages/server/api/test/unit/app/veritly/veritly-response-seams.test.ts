import type { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ get: vi.fn(), request: vi.fn() }))

vi.mock('@activepieces/server-utils', () => ({
    safeHttp: { axios: { get: mocks.get, request: mocks.request } },
}))

vi.mock('../../../../src/app/project/project-service', () => ({
    projectService: () => ({
        getOneOrThrow: () => Promise.resolve({
            externalId: 'veritly:project:project_123456',
            metadata: { veritly: { projectId: 'project_123456', tenantId: 'org_123456' } },
        }),
    }),
}))

vi.mock('../../../../src/app/veritly/veritly-edge', () => ({ edge: () => 'https://edge.test' }))
vi.mock('../../../../src/app/veritly/veritly-machine-auth', () => ({ machineToken: () => Promise.resolve('machine') }))
vi.mock('../../../../src/app/veritly/veritly-token', () => ({ validToken: () => true }))

import { data } from '../../../../src/app/veritly/veritly-data.service'
import { files, removeDestination, unhook } from '../../../../src/app/veritly/veritly-office.service'
import { projectAccess } from '../../../../src/app/veritly/veritly-workos-auth'

const log = {} as FastifyBaseLogger

describe('Veritly upstream response seams', () => {
    beforeEach(() => {
        mocks.get.mockReset()
        mocks.request.mockReset()
    })

    it('rejects literal and escaped-equivalent duplicates from Office', async () => {
        for (const body of duplicates('{"items":[],"nextCursor":null}', 'items')) {
            mocks.request.mockResolvedValue(wire(200, body))
            await expect(files(scope())).rejects.toBeInstanceOf(SyntaxError)
        }
    })

    it('rejects literal and escaped-equivalent duplicates from Data', async () => {
        for (const body of duplicates('{"datasets":[],"next_cursor":null}', 'datasets')) {
            mocks.request.mockResolvedValue(wire(200, body))
            await expect(
                data.datasets({ ...scope(), query: { limit: 100, cursor: null } }),
            ).rejects.toBeInstanceOf(SyntaxError)
        }
    })

    it('rejects literal and escaped-equivalent duplicates from project access', async () => {
        const body = JSON.stringify({
            tenant_id: 'org_123456',
            project_id: 'project_123456',
            principal: { kind: 'user', id: 'user_123456' },
            role: 'owner',
            capabilities: ['project:read'],
            revision: 1,
        })
        for (const value of duplicates(body, 'project_id')) {
            mocks.get.mockResolvedValue(wire(200, value))
            await expect(projectAccess({ token: 'token', project: 'project_123456' })).rejects.toBeInstanceOf(SyntaxError)
        }
    })

    it('rejects bodies on no-content Office responses', async () => {
        mocks.request.mockResolvedValue(wire(204, '{}'))
        await expect(unhook({ ...scope(), webhook: 'webhook_123456' })).rejects.toBeInstanceOf(TypeError)
        mocks.request.mockResolvedValue(wire(204, '{}'))
        await expect(removeDestination({ ...scope(), destination: 'destination_123456' })).rejects.toBeInstanceOf(TypeError)
    })
})

function duplicates(body: string, key: string) {
    return [
        body.replace(`"${key}":`, `"${key}":null,"${key}":`),
        body.replace(
            `"${key}":`,
            `"${key}":null,"\\u${key.charCodeAt(0).toString(16).padStart(4, '0')}${key.slice(1)}":`,
        ),
    ]
}

function wire(status: number, data: string) {
    return { status, data, headers: {} }
}

function scope() {
    return { log, project: 'project_123456' }
}
