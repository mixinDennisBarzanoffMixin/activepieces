import { ActivepiecesError, EnginePrincipal, ErrorCode } from '@activepieces/shared'

const checks = new Set<EngineLeaseCheck>()

export const engineLease = {
    use(check: EngineLeaseCheck) {
        checks.add(check)
    },

    async assert(principal: EnginePrincipal) {
        const values = await Promise.all([...checks].map((check) => check(principal)))
        if (values.every(Boolean)) return
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'engine execution lease is no longer active',
            },
        })
    },
}

type EngineLeaseCheck = (principal: EnginePrincipal) => Promise<boolean>
