# search-quality-and-answer-rendering Test Result

## Scope
- Search retrieval ranking, follow-up query rewriting, and structured answer rendering.

## Environment
- Profile: local development
- Database: none
- External dependencies: Confluence, OpenAI Responses API

## Commands
- `pnpm --filter @sfood/wiki-core test -- src/lib/wikiDocuments.test.ts src/lib/aiAsk.test.ts`
- `pnpm --filter @sfood/web test -- src/ui/structuredAnswer.test.ts`
- `pnpm typecheck`
- `pnpm build`
- `pnpm test`
- `pnpm dev`

## Results
- PASS: `packages/wiki-core` tests passed, including ranking order, index expansion, and follow-up query checks.
- PASS: `apps/web` structured answer tests passed, including callouts and markdown table parsing.
- PASS: workspace typecheck passed.
- PASS: production build passed.
- PASS: root workspace tests passed.
- PASS: dev server started successfully at `http://localhost:5173/`.
- PASS: browser verification on `http://localhost:5173/search` showed the search answer screen rendering without raw JSON leakage for both `Windows에서 Codex CLI를 설치하는 최소 절차는?` and `윈도우에 codex를 설치하는 방법은?`.
- PASS: browser verification confirmed visible structured answer content with the top explanation section removed, while keeping the answer body, `추천 페이지`, warning callout, document links, and list-based content.
- PASS: accessibility follow-up added `aria-label` to the search input and `aria-expanded` / `aria-controls` to collapsible code controls.
- PASS: browser verification confirmed `핵심 인용` and `지원되지 않는 항목` are no longer visible in the rendered search answer body.
- PASS: browser verification confirmed the search answer body can surface inline wiki links when the answer supports a document directly, and those internal wiki links open new tabs rather than Confluence source pages.
- PASS: browser verification confirmed standalone commands such as `npm install -g @openai/codex` render as copyable code blocks instead of inline text.
- PASS: browser verification confirmed the code component now uses a smaller card with a compact header and better line-number alignment.

## Failure Notes
- Initial `pnpm dev -- --host 0.0.0.0` failed with `EPERM` under the sandboxed shell. The dev server was then started with an escalated `pnpm dev` session.
- A stale in-memory AI search cache could surface an older JSON-shaped answer payload until the cache was normalized on read/write.

## Retest Results
- After the retrieval and rendering patches, the targeted tests and workspace validation passed without further code changes.
- `pnpm benchmark:search` was rerun after the prompt and retrieval tuning.
- Latest benchmark: Wiki wins `5`, Generic wins `3`, Ties `0`, Avg wiki similarity `79.5 / 100`.
- Strongest case: `Codex CLI` minimal install flow reached `90 / 100`.
- Weakest cases: approval + weekly report automation, general troubleshooting, and the narrow project-planning follow-up question still lag behind generic answers.
- Browser verification after cache normalization showed raw JSON was no longer visible in the rendered answer surface.

## Acceptance Criteria Coverage
- 5 representative questions defined and grounded in Confluence content: in progress.
- Generic AI answers and wiki-based search answers compared with a rubric: in progress.
- Generic AI answers and wiki-based search answers compared with a rubric: passed at the benchmark level, but the 90 similarity target is still not met.
- Search retrieval or rendering improvements validated: passed.
- App launched for browser inspection: passed at the server level.
