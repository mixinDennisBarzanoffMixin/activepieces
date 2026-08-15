import { PropertyType } from '@activepieces/pieces-framework'
import { PieceOptionRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { onlyoffice } from './veritly-onlyoffice.service'
import { data } from './veritly-data.service'

const File = z.object({ id: z.string(), path: z.string(), kind: z.string() })
const Files = z.array(File)
const Sheets = z.object({ sheets: z.array(z.object({ id: z.string(), name: z.string() })) })
const PIECE = '@activepieces/piece-veritly-onlyoffice'
const DATA_PIECE = '@activepieces/piece-veritly-data'
const Prep = z.object({ id: z.string(), path: z.string() }).passthrough()
const Preps = z.object({ preps: z.array(Prep) })
const Dataset = z.object({ id: z.string(), schema: z.string(), table: z.string() }).passthrough()
const Datasets = z.object({ datasets: z.array(Dataset) })

export async function veritlyOptions(log: FastifyBaseLogger, req: PieceOptionRequest) {
    if (req.pieceName === DATA_PIECE) return dataOptions(log, req)
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

async function dataOptions(log: FastifyBaseLogger, req: PieceOptionRequest) {
    if (req.propertyName === 'prep_id') {
        const res = await data({ log, project: req.projectId, schema: Preps, method: 'GET', path: '/preps' })
        return dropdown(res.preps.map((prep) => ({ label: prep.path, value: prep.id })), 'No project data preparations found', 'Select a preparation')
    }
    if (req.propertyName !== 'dataset_id') return
    const res = await data({ log, project: req.projectId, schema: Datasets, method: 'GET', path: '/datasets' })
    return dropdown(res.datasets.map((dataset) => ({ label: `${dataset.schema}.${dataset.table}`, value: dataset.id })), 'No published project datasets found', 'Select a dataset')
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
