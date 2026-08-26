# @veritly/onlyoffice-contract

Tiny shared HTTP contract for Veritly spreadsheet automation.

This package owns schemas, route builders, small value parsers, and the fetch
client used by Activepieces pieces. It must not import Activepieces server code,
the document runtime, storage, auth internals, or database code.

## Private Publish

GitHub Packages needs a token with `write:packages` for publish and
`read:packages` for install:

```sh
cd packages/veritly/onlyoffice-contract
bun run build
npm publish
```

The package scope must exist as a GitHub user or organization. If `@veritly`
does not exist as the publishing owner yet, either create/move the GitHub org or
temporarily change the package scope before publishing.
