import { isNil } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { resolveVeritlyPrincipal } from '../../../../veritly/veritly-auth'
import { RouteKind } from '../../authorization/common'
import { authenticateOrThrow } from './authenticate'

export const authenticationMiddleware = async (request: FastifyRequest): Promise<void> => {
    const security = request.routeOptions.config?.security
    // Todo(@chaker): remove this once we remove v1 authn
    if (isNil(security)) {
        return
    }
    if (security.kind === RouteKind.PUBLIC) {
        return
    }

    const veritly = await resolveVeritlyPrincipal({ request, log: request.log })
    if (veritly) {
        request.principal = veritly
        return
    }

    const principal = await authenticateOrThrow(request.log, request.headers['authorization'] ?? null)
    request.principal = principal
}
