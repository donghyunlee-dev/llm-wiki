# SFOOD-LLM-WIKI
AI를 활용한 Confluence LLM 방식의 WIKI 사이트

## Development

- `pnpm install`: install workspace dependencies
- `pnpm dev`: run the web app locally
- `pnpm test`: run workspace tests
- `pnpm typecheck`: run TypeScript checks
- `pnpm build`: build the web app

## Wiki Data Source

The app defaults to local snapshot data.

For local Confluence-backed development, create `apps/web/.env.local` from
`apps/web/.env.example`:

```env
ATLASSIAN_SITE_NAME=your-site-name
ATLASSIAN_USER_EMAIL=your-email@example.com
ATLASSIAN_API_TOKEN=your-atlassian-api-token
CONFLUENCE_SPACE_ID=63111172
```

When those values are present, `pnpm dev` exposes a server-side local endpoint at
`/api/wiki-pages` and the browser reads that same-origin JSON endpoint. Atlassian
tokens stay server-side and must not use `VITE_` prefixes.

Each visible Confluence page must have content property key `wiki.metadata`.
Only current pages from space `63111172` with `visibility=public` are used.

## Serverless Wiki Endpoint

`packages/serverless` exports a Lambda-compatible `wikiPagesHandler` for the
production equivalent of the local Vite `/api/wiki-pages` endpoint. Deploy it
behind API Gateway or another serverless HTTP adapter and configure the same
server-side env values:

```env
ATLASSIAN_SITE_NAME=your-site-name
ATLASSIAN_USER_EMAIL=your-email@example.com
ATLASSIAN_API_TOKEN=your-atlassian-api-token
CONFLUENCE_SPACE_ID=63111172
WIKI_ALLOWED_ORIGIN=https://your-web-origin.example
```

Point the static web build at the deployed endpoint with:

```env
VITE_WIKI_DATA_SOURCE=remote
VITE_WIKI_REMOTE_ENDPOINT=https://your-api.example.com/api/wiki-pages
```
