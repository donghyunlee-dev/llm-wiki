# confluence-env-source Test Result

## Scope
- Validate Confluence env-based source loading, dev endpoint wiring, and unchanged production build.

## Environment
- Local development workspace
- `apps/web/.env.local` keys present
- No separate database

## Commands
- `pnpm test`
- `pnpm typecheck`
- `pnpm build`
- `pnpm dev -- --host 127.0.0.1`
- Local fetch to `http://localhost:5175/api/wiki-pages`
- Direct diagnostic fetch to Confluence page list and first page properties
- Local fetch to `http://localhost:5176/api/wiki-pages`
- Playwright checks for `/guides`, `/guides/how-to-use-wiki`, and `/search?q=Wiki`

## Results
- PASS: `pnpm test`
- PASS: `pnpm typecheck`
- PASS: `pnpm build`
- PASS: Vite dev endpoint responded with HTTP 200.
- PASS: Confluence API returned current pages from space `63111172`.
- PASS: `/api/wiki-pages` returned 130 page records after metadata was available.
- PASS: Category, article, and search pages rendered from remote data.

## Failure Notes
- `apps/web` test initially failed because `vite.config.ts` imported the workspace package index directly. Changed it to import the server-only adapter source file.
- Live Confluence diagnostic returned first page `Playbook` in space `63111172`, but its property key list was empty.
- Remote UI initially stayed in an error/loading path because some Confluence pages had empty body HTML. Adjusted remote validation to allow empty `bodyHtml`.

## Retest Results
- PASS: Re-ran `pnpm test`, `pnpm typecheck`, and `pnpm build` after the Vite config import fix.
- PASS: Re-ran local endpoint check after starting Vite dev server.
- PASS: Re-ran `pnpm test`, `pnpm typecheck`, and `pnpm build` after allowing empty body HTML.
- PASS: Re-ran remote category/article/search browser checks.

## Acceptance Criteria Coverage
- AC1: Covered. Atlassian credentials are read only in Vite config/dev middleware.
- AC2: Covered. Development mode auto-selects `/api/wiki-pages` when Confluence env is configured.
- AC3: Covered. Endpoint returns `{ pages }`.
- AC4: Covered by `confluenceClient` unit tests.
- AC5: Covered by `pnpm test`, `pnpm typecheck`, and `pnpm build`.
