# Veritly spreadsheet piece

This piece is the Activepieces-facing shell for Veritly spreadsheet automations.

The runtime adapter is intentionally outside this package. The piece and API
consume the generated `@veritly/contracts` Office route, result, error, and
webhook schemas so there is one wire contract.

Expected behavior:

Rows include numeric `index`, stable `hash`, and a `values` array matching
zero-based spreadsheet columns.

Webhook delivery is accepted only after verifying the timestamp, event ID,
idempotency key, and HMAC over the exact raw request bytes. Typed payload
decoding happens after that verification.
