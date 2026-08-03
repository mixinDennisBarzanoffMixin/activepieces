import { PropertyType } from '@activepieces/pieces-framework'
import { PieceOptionRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { onlyoffice } from './veritly-onlyoffice.service'

const File = z.object({ id: z.string(), path: z.string(), kind: z.string() })
const Files = z.array(File)
const Sheets = z.object({ sheets: z.array(z.object({ id: z.string(), name: z.string() })) })
const PIECE = '@activepieces/piece-veritly-onlyoffice'

export async function veritlyOptions(log: FastifyBaseLogger, req: PieceOptionRequest) {
    if (req.pieceName !== PIECE) return
    if (req.propertyName === 'workbook_id') {
        const files = await onlyoffice(log, req.projectId, Files, 'GET', '/files')
        return dropdown(files.filter((file) => file.kind === 'cell').map((file) => ({ label: file.path, value: file.id })), 'No Veritly workbooks found', 'Select a workbook')
    }
    if (req.propertyName === 'document_id') {
        const files = await onlyoffice(log, req.projectId, Files, 'GET', '/files')
        return dropdown(files.filter((file) => file.kind === 'word' || file.kind === 'slide').map((file) => ({ label: file.path, value: file.id })), 'No Veritly documents or presentations found', 'Select a file')
    }
    if (req.propertyName !== 'sheet_id') return
    const input = record(req.input) ? req.input : undefined
    const book = input?.workbook_id
    if (typeof book !== 'string' || !book) return dropdown([], 'Select a workbook first', 'Select a workbook first')
    const res = await onlyoffice(log, req.projectId, Sheets, 'GET', `/files/${encodeURIComponent(book)}/sheets`)
    return dropdown(res.sheets.map((sheet) => ({ label: sheet.name, value: sheet.id })), 'No sheets found', 'Select a sheet')
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

function record(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
}
