import { WorkOS, type User } from "@workos-inc/node"

export const WORKOS_SESSION_COOKIE_NAME = "wos-session"

export type AuthUser = Pick<User, "id"> & Partial<User>

export type SessionResolverResult =
  | {
      ok: true
      user: AuthUser
      refreshedSessionData?: string
    }
  | {
      ok: false
      reason: "missing" | "invalid" | "misconfigured"
      message: string
    }

export interface SessionResolver {
  resolve(request: Request): Promise<SessionResolverResult>
}

export interface WorkosClientConfig {
  apiKey: string
  clientId: string
}

export interface ValidateWorkosSessionInput {
  workos: WorkOS
  sessionData: string
  cookiePassword: string
}

export type ValidateWorkosSessionResult =
  | {
      ok: true
      user: User
      refreshedSessionData?: string
    }
  | {
      ok: false
      reason: string
    }

export function requireNonEmpty(value: string | undefined, name: string): string {
  const trimmed = value?.trim()
  if (!trimmed) {
    throw new Error(`${name} is missing`)
  }
  return trimmed
}

export function requireCookiePassword(value: string | undefined): string {
  const password = requireNonEmpty(value, "COOKIE_PASSWORD")
  if (password.length < 32) {
    throw new Error("COOKIE_PASSWORD must be at least 32 characters")
  }
  return password
}

export function createWorkOSClient(config: WorkosClientConfig): WorkOS {
  return new WorkOS(config.apiKey, { clientId: config.clientId })
}

export async function validateWorkosSession(input: ValidateWorkosSessionInput): Promise<ValidateWorkosSessionResult> {
  const { workos, sessionData, cookiePassword } = input

  const session = await workos.userManagement.loadSealedSession({
    sessionData,
    cookiePassword,
  })
  const auth = await session.authenticate()
  if (auth.authenticated && auth.user) {
    return { ok: true, user: auth.user }
  }

  if ("reason" in auth && (auth.reason === "invalid_jwt" || auth.reason === "invalid_session_cookie")) {
    const refresh = await session.refresh()
    if (refresh.authenticated && refresh.user) {
      return {
        ok: true,
        user: refresh.user,
        refreshedSessionData: refresh.sealedSession,
      }
    }
  }

  return { ok: false, reason: "Invalid WorkOS session" }
}

/** Shared Set-Cookie shape for `wos-session` across authenticated services. */
export function workosSessionCookieBase() {
  const raw = process.env.PUBLIC_BASE_URL?.trim() || process.env.WORKOS_REDIRECT_URI?.trim()
  if (!raw) throw new Error("PUBLIC_BASE_URL or WORKOS_REDIRECT_URI is required for WorkOS cookie options")
  const url = new URL(raw)
  const host = url.hostname.toLowerCase()
  const domain = (() => {
    if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]") return undefined
    if (host.endsWith(".svc.cluster.local")) {
      const parts = host.split(".")
      if (parts.length < 5) throw new Error(`Unsupported cluster cookie host: ${host}`)
      return `.${parts.slice(-4).join(".")}`
    }
    if (host === "veritly.co.uk" || host.endsWith(".veritly.co.uk")) return ".veritly.co.uk"
    throw new Error(`Unsupported WorkOS cookie host: ${host}`)
  })()
  return {
    path: "/" as const,
    httpOnly: true,
    secure: url.protocol === "https:",
    sameSite: "lax" as const,
    ...(domain ? { domain } : {}),
  }
}

const WOS_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7

export function workosSessionCookieOptions() {
  return { ...workosSessionCookieBase(), maxAge: WOS_SESSION_MAX_AGE_SEC }
}

function cookie(request: Request, name: string) {
  const header = request.headers.get("cookie")
  if (!header) return
  let value: string | undefined
  for (const part of header.split(";")) {
    const trimmed = part.trim()
    const index = trimmed.indexOf("=")
    if (index === -1) continue
    if (trimmed.slice(0, index) !== name) continue
    value = decodeURIComponent(trimmed.slice(index + 1))
  }
  return value
}

export function fixedSessionResolver(id: string): SessionResolver {
  return {
    async resolve() {
      const user = id.trim()
      if (!user) return { ok: false, reason: "misconfigured", message: "Fixed auth user id is missing" }
      return { ok: true, user: { id: user } }
    },
  }
}

export function headerSessionResolver(name: string, validate?: (id: string) => void): SessionResolver {
  return {
    async resolve(request) {
      const id = request.headers.get(name)?.trim()
      if (!id) return { ok: false, reason: "missing", message: "Unauthorized" }
      validate?.(id)
      return { ok: true, user: { id } }
    },
  }
}

export function workosSessionResolver(): SessionResolver {
  return {
    async resolve(request) {
      const apiKey = process.env.WORKOS_API_KEY?.trim()
      const clientId = process.env.WORKOS_CLIENT_ID?.trim()
      if (!apiKey || !clientId) {
        return { ok: false, reason: "misconfigured", message: "WorkOS not configured" }
      }

      const sessionData = cookie(request, WORKOS_SESSION_COOKIE_NAME)
      if (!sessionData) return { ok: false, reason: "missing", message: "Unauthorized" }

      const result = await validateWorkosSession({
        workos: createWorkOSClient({
          apiKey: requireNonEmpty(apiKey, "WORKOS_API_KEY"),
          clientId: requireNonEmpty(clientId, "WORKOS_CLIENT_ID"),
        }),
        sessionData,
        cookiePassword: requireCookiePassword(process.env.COOKIE_PASSWORD),
      })

      if (!result.ok) return { ok: false, reason: "invalid", message: "Invalid session" }
      return {
        ok: true,
        user: result.user,
        refreshedSessionData: result.refreshedSessionData,
      }
    },
  }
}
