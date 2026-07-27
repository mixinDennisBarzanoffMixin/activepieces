# Veritly ONLYOFFICE piece

This piece is the Activepieces-facing shell for Veritly ONLYOFFICE automations.

The runtime adapter is intentionally outside this package. It uses
`@veritly/onlyoffice-contract` so the Activepieces worker and server agree on the
same row automation HTTP shape.

Expected behavior:

Rows include numeric `index`, stable `hash`, and a `values` array matching
zero-based ONLYOFFICE columns.
