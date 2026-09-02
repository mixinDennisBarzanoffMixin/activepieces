import type { ServerContext } from '@activepieces/pieces-framework'
import type { DataRouteName, RouteErrorFor } from '@veritly/contracts/client'
import { decodeDataRouteError } from '@veritly/contracts/client'
import { responses } from '@veritly/contracts/zod'

class DataClient {
  constructor(private readonly server: ServerContext) {}

  async preps() {
    return await this.request({
      route: 'data_preps',
      path: 'preps?limit=100',
      parse: responses.PrepPage.parse,
    })
  }

  async datasets() {
    return await this.request({
      route: 'data_datasets',
      path: 'datasets?limit=100',
      parse: responses.DatasetPage.parse,
    })
  }

  async job(id: string) {
    if (!id) throw new Error('Job ID is required')
    return await this.request({
      route: 'data_job',
      path: `jobs/${encodeURIComponent(id)}`,
      parse: responses.Job.parse,
    })
  }

  private async request<T, Name extends DataRouteName>(input: Call<T, Name>) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 5_000)
    const res = await fetch(url(this.server.apiUrl, input.path), {
      method: 'GET',
      redirect: 'error',
      headers: { authorization: `Bearer ${this.server.token}` },
      signal: ctrl.signal,
    }).finally(() => clearTimeout(timer))
    const body = await res.text()
    if (!res.ok) fail({ route: input.route, status: res.status, body })
    return input.parse(JSON.parse(body))
  }
}

function fail<Name extends DataRouteName>(input: Failure<Name>): never {
  throw new DataClientError(
    input.status,
    decodeDataRouteError(input.route, input.status, input.body),
  )
}

function url(base: string, path: string) {
  const root = base.endsWith('/') ? base : `${base}/`
  return new URL(`v1/veritly/worker/data/${path}`, root)
}

export const data = { create: (server: ServerContext) => new DataClient(server) }

export class DataClientError<Name extends DataRouteName = DataRouteName> extends Error {
  constructor(
    readonly status: number,
    readonly route: RouteErrorFor<'data', Name>,
  ) {
    super(`Data request failed with ${route.code}/${status}`)
  }
}

type Call<T, Name extends DataRouteName> = {
  route: Name
  path: string
  parse: (input: unknown) => T
}

type Failure<Name extends DataRouteName> = {
  route: Name
  status: number
  body: string
}
