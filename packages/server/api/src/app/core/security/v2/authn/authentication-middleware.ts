import { isNil } from '@activepieces/shared'
import { FastifyReply, FastifyRequest } from 'fastify'
import { RouteKind } from '../../authorization/common'
import { authenticateOrThrow } from './authenticate'

export const authenticationMiddleware = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const security = request.routeOptions.config?.security
    // Todo(@chaker): remove this once we remove v1 authn
    if (isNil(security)) {
        return
    }
    if (security.kind === RouteKind.PUBLIC) {
        return
    }

    const principal = await authenticateOrThrow({
        log: request.log,
        rawToken: request.headers['authorization'] ?? null,
        request,
        reply,
    })
    request.principal = principal
}
