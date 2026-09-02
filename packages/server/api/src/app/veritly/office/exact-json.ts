import { Node, ParseError, parseTree } from 'jsonc-parser'

const MAX_BYTES = 300_000

export function exactJson(raw: unknown) {
    if (typeof raw !== 'string' || Buffer.byteLength(raw) > MAX_BYTES) return false
    const errors: ParseError[] = []
    const root = parseTree(raw, errors, { allowTrailingComma: false, disallowComments: true })
    if (!root || errors.length > 0 || root.type !== 'object') return false
    if (raw.slice(root.offset + root.length).trim().length > 0) return false
    return unique(root)
}

function unique(node: Node): boolean {
    if (node.type === 'object') {
        const keys = new Set<string>()
        for (const prop of node.children ?? []) {
            const key = prop.children?.[0]
            const value = prop.children?.[1]
            if (typeof key?.value !== 'string' || !value || keys.has(key.value)) return false
            keys.add(key.value)
            if (!unique(value)) return false
        }
        return true
    }
    return (node.children ?? []).every(unique)
}
