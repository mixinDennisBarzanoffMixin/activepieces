import { z } from 'zod'

export const VeritlyUniverCell = z.union([z.string(), z.number(), z.boolean(), z.null()])

export const VeritlyUniverBook = z.object({
    id: z.string(),
    name: z.string(),
})

export const VeritlyUniverRow = z.object({
    id: z.string(),
    index: z.number(),
    values: z.array(VeritlyUniverCell),
    updatedAt: z.string(),
    hash: z.string(),
})

export const VeritlyUniverWorkbooks = z.object({
    workbooks: z.array(VeritlyUniverBook),
})

export const VeritlyUniverSheets = z.object({
    sheets: z.array(VeritlyUniverBook),
})

export const VeritlyUniverAppend = z.object({
    values: z.array(VeritlyUniverCell),
})

export const VeritlyUniverUpdate = z.object({
    rowIndex: z.number(),
    columnIndex: z.number(),
    value: VeritlyUniverCell,
})

export const VeritlyUniverUpdateResult = z.object({
    workbookId: z.string(),
    sheetId: z.string(),
    rowIndex: z.number(),
    columnIndex: z.number(),
    value: VeritlyUniverCell,
    revision: z.number(),
})

export type VeritlyUniverBook = z.infer<typeof VeritlyUniverBook>
export type VeritlyUniverRow = z.infer<typeof VeritlyUniverRow>
export type VeritlyUniverWorkbooks = z.infer<typeof VeritlyUniverWorkbooks>
export type VeritlyUniverSheets = z.infer<typeof VeritlyUniverSheets>
export type VeritlyUniverUpdateResult = z.infer<typeof VeritlyUniverUpdateResult>
