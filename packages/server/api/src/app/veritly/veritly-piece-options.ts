import { PropertyType } from '@activepieces/pieces-framework'
import { PieceOptionRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { files, type OfficeFiles } from './veritly-office.service'

const PIECE = '@activepieces/piece-veritly-office'

export async function veritlyOptions(log: FastifyBaseLogger, req: PieceOptionRequest) {
    if (req.pieceName !== PIECE) return
    if (req.propertyName === 'workbook_id') {
        const list = await officeFiles(log, req.projectId)
        return dropdown(list.filter((file) => file.kind === 'cell').map((file) => ({ label: file.path, value: file.id })), 'No Veritly workbooks found', 'Select a workbook')
    }
    if (req.propertyName === 'document_id') {
        const list = await officeFiles(log, req.projectId)
        return dropdown(list.filter((file) => file.kind === 'word' || file.kind === 'slide').map((file) => ({ label: file.path, value: file.id })), 'No Veritly documents or presentations found', 'Select a file')
    }
    return undefined
}

async function officeFiles(log: FastifyBaseLogger, project: string): Promise<OfficeFiles> {
    const result = await files({ log, project })
    if (result.kind === 'error') throw new OfficeOptionsError()
    return result.value.items
}

function dropdown(options: Array<{ label: string, value: string }>, empty: string, ready: string) {
    return {
        type: PropertyType.DROPDOWN,
        options: {
            disabled: options.length === 0,
            placeholder: options.length === 0 ? empty : ready,
            options,
        },
    }
}

class OfficeOptionsError extends Error {}
