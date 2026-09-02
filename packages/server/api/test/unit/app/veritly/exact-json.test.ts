import { describe, expect, it } from 'vitest'
import { exactJson } from '../../../../src/app/veritly/office/exact-json'

describe('exactJson', () => {
    it('accepts one exact object', () => {
        expect(exactJson('{"outer":{"eventId":"evt_1"},"rows":[{"value":1}]}')).toBe(true)
    })

    it('rejects literal and nested duplicates', () => {
        expect(exactJson('{"eventId":"first","eventId":"second"}')).toBe(false)
        expect(exactJson('{"outer":{"eventId":"first","eventId":"second"}}')).toBe(false)
    })

    it('rejects escaped-equivalent duplicates', () => {
        expect(exactJson('{"eventId":"first","event\\u0049d":"second"}')).toBe(false)
    })

    it('rejects trailing, commented, and oversized input', () => {
        expect(exactJson('{}{}')).toBe(false)
        expect(exactJson('{/* hidden */}')).toBe(false)
        expect(exactJson(`{"body":"${'x'.repeat(300_000)}"}`)).toBe(false)
    })
})
