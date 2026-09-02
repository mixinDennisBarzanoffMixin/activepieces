import type { FastifyRequest } from 'fastify'

export function headers(request: FastifyRequest, name: string) {
    const raw = request.raw.rawHeaders
    if (raw.length % 2 !== 0) return []
    return raw.flatMap((value, index) => (
        index % 2 === 0 && value.toLowerCase() === name ? [raw[index + 1]!] : []
    ))
}
