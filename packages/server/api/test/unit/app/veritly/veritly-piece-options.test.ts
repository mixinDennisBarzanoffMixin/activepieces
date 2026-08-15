import { PropertyType } from '@activepieces/pieces-framework'
import { PieceOptionRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { describe, expect, it } from 'vitest'
import { veritlyOptions } from '../../../../src/app/veritly/veritly-piece-options'

const log = {} as FastifyBaseLogger
const req: PieceOptionRequest = {
    projectId: 'project',
    pieceName: '@activepieces/piece-veritly-onlyoffice',
    pieceVersion: '0.1.0',
    actionOrTriggerName: 'get_rows',
    propertyName: 'sheet_id',
    flowId: 'flow',
    flowVersionId: 'version',
    input: {},
}

describe('veritlyOptions', () => {
    it('returns sheet guidance without starting a worker when no workbook is selected', async () => {
        expect(await veritlyOptions(log, req)).toEqual({
            type: PropertyType.DROPDOWN,
            options: {
                disabled: true,
                placeholder: 'Select a workbook first',
                options: [],
            },
        })
    })

    it('leaves other pieces on the generic worker path', async () => {
        expect(await veritlyOptions(log, { ...req, pieceName: '@activepieces/piece-slack' })).toBeUndefined()
    })

    it('leaves static Veritly Data properties on the generic worker path', async () => {
        expect(await veritlyOptions(log, {
            ...req,
            pieceName: '@activepieces/piece-veritly-data',
            propertyName: 'resource_id',
        })).toBeUndefined()
    })
})
