export function edge() {
    const raw = process.env.AP_WEBHOOK_URL?.trim()
    if (!raw) throw new Error('AP_WEBHOOK_URL is required')
    const url = new URL(raw)
    if (url.protocol !== 'https:'
        || url.username
        || url.password
        || url.search
        || url.hash
        || url.pathname !== '/activepieces') {
        throw new Error('AP_WEBHOOK_URL must be the canonical HTTPS Edge /activepieces endpoint')
    }
    return url.origin
}

export function webhook(flow: string) {
    return new URL(`/activepieces/api/v1/webhooks/${encodeURIComponent(flow)}`, edge()).toString()
}
