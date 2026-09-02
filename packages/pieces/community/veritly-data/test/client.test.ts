import { describe, expect, test } from 'bun:test'
import { DataClientError, data } from '../src/lib/client'

describe('Veritly Data automation client', () => {
  test('decodes canonical dataset pages from the engine proxy', async () => {
    const server = Bun.serve({
      port: 0,
      fetch(request) {
        expect(new URL(request.url).pathname).toBe('/v1/veritly/worker/data/datasets')
        expect(new URL(request.url).searchParams.get('limit')).toBe('100')
        expect(request.headers.get('authorization')).toBe('Bearer engine')
        return Response.json({ datasets: [], next_cursor: null })
      },
    })
    const value = await data.create(context(server.port)).datasets()
    server.stop(true)
    expect(value).toEqual({ datasets: [], next_cursor: null })
  })

  test('preserves route-narrowed Data errors', async () => {
    const server = Bun.serve({
      port: 0,
      fetch() {
        return Response.json({
          code: 'project_unavailable',
          request: '01992e25-6f9d-4a4c-8fb6-548d014a1ff2',
        }, { status: 404 })
      },
    })
    const request = data.create(context(server.port)).preps()
    await expect(request).rejects.toMatchObject({
      status: 404,
      route: {
        code: 'project_unavailable',
        request: '01992e25-6f9d-4a4c-8fb6-548d014a1ff2',
      },
    })
    await expect(request).rejects.toBeInstanceOf(DataClientError)
    server.stop(true)
  })
})

function context(port: number) {
  const apiUrl = `http://127.0.0.1:${port}`
  return { apiUrl, publicUrl: apiUrl, token: 'engine' }
}
