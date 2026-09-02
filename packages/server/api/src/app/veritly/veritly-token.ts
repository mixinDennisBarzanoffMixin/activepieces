import { decodeJwt } from 'jose'

const CAP = 16 * 1024

export function validToken(value: string) {
    return value.length > 0 && value.length <= CAP && /^[!-~]+$/.test(value)
}

export function isWorkosToken(token: string) {
    if (!validToken(token)) return false
    try {
        const issuer = decodeJwt(token).iss
        return typeof issuer === 'string' && [
            process.env.WORKOS_USER_ISSUER?.trim(),
            process.env.WORKOS_MACHINE_ISSUER?.trim(),
        ].includes(issuer)
    }
    catch {
        return false
    }
}
