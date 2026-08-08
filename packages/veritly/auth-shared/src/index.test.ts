import { expect, test } from "bun:test"
import type { WorkOS } from "@workos-inc/node"
import { validateWorkosSession } from "./index"

const user = { id: "user_1" }

function workos(session: object) {
  return {
    userManagement: {
      loadSealedSession: async () => session,
    },
  } as unknown as WorkOS
}

test("expired WorkOS access tokens refresh and return the rotated seal", async () => {
  const result = await validateWorkosSession({
    workos: workos({
      authenticate: async () => ({ authenticated: false, reason: "invalid_jwt" }),
      refresh: async () => ({ authenticated: true, user, sealedSession: "rotated" }),
    }),
    sessionData: "sealed",
    cookiePassword: "password",
  })

  expect(result).toEqual({ ok: true, user, refreshedSessionData: "rotated" })
})

test("transient WorkOS refresh failures preserve the session", async () => {
  const result = await validateWorkosSession({
    workos: workos({
      authenticate: async () => ({ authenticated: false, reason: "invalid_jwt" }),
      refresh: async () => {
        throw new TypeError("fetch failed")
      },
    }),
    sessionData: "sealed",
    cookiePassword: "password",
  })

  expect(result).toEqual({
    ok: false,
    reason: "transient",
    message: "WorkOS session refresh is temporarily unavailable",
  })
})

test("terminal WorkOS refresh failures invalidate the session", async () => {
  const result = await validateWorkosSession({
    workos: workos({
      authenticate: async () => ({ authenticated: false, reason: "invalid_jwt" }),
      refresh: async () => ({ authenticated: false, reason: "invalid_grant" }),
    }),
    sessionData: "sealed",
    cookiePassword: "password",
  })

  expect(result).toEqual({
    ok: false,
    reason: "invalid",
    message: "WorkOS session refresh failed: invalid_grant",
  })
})
