# Veritly Univer piece

This piece is the Activepieces-facing shell for Veritly Univer automations.

The runtime adapter is intentionally outside this package. It uses
`@opencode-ai/univer-compat` so the Activepieces worker reads and writes the same
persisted workbook snapshots as the Univer service.

Expected behavior:

Rows include stable `id`, numeric `index`, ISO `updatedAt`, stable `hash`, and a
`values` array matching zero-based Univer columns.
