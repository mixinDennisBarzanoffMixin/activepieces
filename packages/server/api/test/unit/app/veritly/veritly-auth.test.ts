import type { FastifyRequest } from 'fastify'
import { afterEach, describe, expect, it } from 'vitest'
import { headers } from '../../../../src/app/veritly/veritly-header'
import { isWorkosToken } from '../../../../src/app/veritly/veritly-token'

const user = process.env.WORKOS_USER_ISSUER
const machine = process.env.WORKOS_MACHINE_ISSUER

afterEach(() => {
    restore('WORKOS_USER_ISSUER', user)
    restore('WORKOS_MACHINE_ISSUER', machine)
})

describe('Veritly authentication routing', () => {
    it('preserves singleton headers and exposes duplicates', () => {
        expect(headers(request(['Authorization', 'Bearer first']), 'authorization')).toEqual(['Bearer first'])
        expect(headers(request([
            'Authorization', 'Bearer first',
            'authorization', 'Bearer second',
        ]), 'authorization')).toEqual(['Bearer first', 'Bearer second'])
    })

    it('routes only configured WorkOS issuers to WorkOS verification', () => {
        process.env.WORKOS_USER_ISSUER = 'https://auth.example.com/user'
        process.env.WORKOS_MACHINE_ISSUER = 'https://auth.example.com'
        expect(isWorkosToken(token('https://auth.example.com/user'))).toBe(true)
        expect(isWorkosToken(token('https://auth.example.com'))).toBe(true)
        expect(isWorkosToken(token('https://attacker.example.com'))).toBe(false)
        expect(isWorkosToken(token(undefined))).toBe(false)
        expect(isWorkosToken('not-a-jwt')).toBe(false)
    })
})

function request(raw: string[]) {
    return { raw: { rawHeaders: raw } } as FastifyRequest
}

function token(iss: string | undefined) {
    const payload = iss ? { iss } : { sub: 'user' }
    return `${part({ alg: 'RS256' })}.${part(payload)}.signature`
}

function part(value: object) {
    return Buffer.from(JSON.stringify(value)).toString('base64url')
}

function restore(name: string, value: string | undefined) {
    if (value === undefined) delete process.env[name]
    if (value !== undefined) process.env[name] = value
}
