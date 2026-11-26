export function edge() {
    const raw = process.env.AP_WEBHOOK_URL?.trim()
    if (!raw) throw new Error('AP_WEBHOOK_URL is required')
    const url = new URL(raw)
    const clusterLocal = url.protocol === 'http:' && url.hostname.endsWith('.svc.cluster.local')
    if ((!clusterLocal && url.protocol !== 'https:')
        || url.username
        || url.password
        || url.search
        || url.hash
        || url.pathname !== '/activepieces') {
        throw new Error('AP_WEBHOOK_URL must be the canonical Edge /activepieces endpoint')
    }
    return url.origin
}

export function webhook(flow: string) {
    return new URL(`/activepieces/api/v1/webhooks/${encodeURIComponent(flow)}`, edge()).toString()
}

// The gateway authenticates the configured public authority even when the TCP hop stays inside the cluster.
export function authority() {
    const raw = process.env.PUBLIC_BASE_URL?.trim()
    if (!raw) throw new Error('PUBLIC_BASE_URL is required')
    const url = new URL(raw)
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
        throw new Error('PUBLIC_BASE_URL must be the canonical public origin')
    }
    return url.host
}
