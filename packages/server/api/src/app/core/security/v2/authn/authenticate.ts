import { ActivepiecesError, ErrorCode, isNil, Principal, PrincipalType } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyReply, FastifyRequest } from 'fastify'
import { nanoid } from 'nanoid'
import { accessTokenManager } from '../../../../authentication/lib/access-token-manager'
import { apiKeyService } from '../../../../ee/api-keys/api-key-service'
import { resolveVeritlyPrincipal } from '../../../../veritly/veritly-auth'

export const authenticateOrThrow = async ({ log, rawToken, request, reply }: AuthenticateParams): Promise<Principal> => {
    if (!isNil(rawToken) && rawToken.startsWith('Bearer sk-')) {
        const trimBearerPrefix = rawToken.replace('Bearer ', '')
        return createPrincipalForApiKey(trimBearerPrefix)
    }
    if (!isNil(rawToken) && rawToken.startsWith('Bearer ')) {
        const trimBearerPrefix = rawToken.replace('Bearer ', '')
        return accessTokenManager(log).verifyPrincipal(trimBearerPrefix)
    }
    const veritly = await resolveVeritlyPrincipal({ request, reply, log })
    if (veritly) return veritly
    return {
        id: nanoid(),
        type: PrincipalType.UNKNOWN,
    }
}

type AuthenticateParams = {
    log: FastifyBaseLogger
    rawToken: string | null
    request: FastifyRequest
    reply: FastifyReply
}


async function createPrincipalForApiKey(apiKeyValue: string): Promise<Principal> {
    const apiKey = await apiKeyService.getByValue(apiKeyValue)
    if (isNil(apiKey)) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHENTICATION,
            params: {
                message: 'invalid api key',
            },
        })
    }
    return {
        id: apiKey.id,
        type: PrincipalType.SERVICE,
        platform: {
            id: apiKey.platformId,
        },
    }
}
