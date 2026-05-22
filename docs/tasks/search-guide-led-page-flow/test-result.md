# Search Guide-Led Page Flow Test Result

## Executed
- `pnpm --filter @sfood/web typecheck`
- `pnpm --filter @sfood/web test -- src/ui/searchRecommendations.test.ts src/lib/aiSearchResponse.test.ts`
- `pnpm --filter @sfood/web test -- src/ui/pages/ArticleContentRenderer.test.tsx src/ui/searchRecommendations.test.ts src/lib/aiSearchResponse.test.ts src/ui/structuredAnswer.test.ts`
- `pnpm typecheck`
- `rg -n "페이지 열기|content: \\\"wiki\\\"|article-code-header|article-code-language|article-code-linecount|article-ask-code-header|chat-structured-code-header|article-ask-code-toggle|chat-structured-code-toggle" apps/web/src`
- `curl -s -X POST http://localhost:5173/api/wiki/ai/search -H 'Content-Type: application/json' -d '{"question":"윈도우에서 claude code cli 설치하는 방법"}'`

## Result
- Pass: web typecheck passed after the search/article layout changes.
- Pass: targeted tests passed, including the new primary-vs-related recommendation split.
- Pass: workspace typecheck passed.
- Pass: repo scan confirmed the visible UI code no longer contains the removed `페이지 열기`, `wiki` badge, or code-header labels.
- Pass: the new link-resolution unit test confirmed that `data-linked-resource-id` and `data-linked-resource-title` resolve to the local wiki route for `Guide Node.js Setup`, and unresolved internal wiki links now fall back to a local search route instead of the raw Confluence URL.
- Pass: example commands now render as a single shared code frame, and callouts no longer show the icon rail or old title treatment.
- Pass: guide-page article layout no longer renders a separate related-page block under the content, and TOC clicks now set the active item immediately while syncing the hash and scroll position.
- Pass: nested content inside callouts is rendered through the same block parser, which keeps code blocks and links inside panels from flattening into raw HTML.
- Pass: Playwright MCP verification on `http://localhost:5173/guides/guide-codex-cli-setup` confirmed the guide view now renders one visible code frame, no separate related-page section, and TOC active state updates on click and at the bottom of the page.
- Pass: Playwright MCP verification on `http://localhost:5173/guides/guide-codex-cli-setup` confirmed the `Guide Node.js Setup`, `Guide npm Setup`, and `Guide npx Setup` entries render as local wiki links and the Confluence code macros now surface their `bash` command text instead of empty code frames.
- Pass: The guide table of contents no longer shows an active-selection highlight after click or scroll; it behaves as a plain navigation list while still jumping to the selected heading.
- Pass: live local AI search response still returned `Claude CLI Setup` as the first matching page for the reproduced query.

## Notes
- The local API still returns evidence payloads and structured action fields, but the search UI no longer exposes the evidence quotes directly.
- A live local response still produced the prefix `가장 짧게:`, so the web UI now strips that label at render time and the setup prompt now explicitly forbids it.
- The remaining gap is retrieval breadth: prerequisite environment guides are still not entering the visible candidate set strongly enough for the Claude CLI install query.
- Search result ordering now matches the contract: answer explanation, support detail sections, `추천 페이지`, then `관련 페이지`.
- Guide-page Confluence links now fall back to title/slug matching first and then to a local search route for unresolved internal links, which keeps guide navigation inside the wiki app instead of exposing raw external Confluence URLs.
- Guide-page active TOC styling now follows click and hash changes as well as scroll-based intersection updates.
- The search `예시` section no longer renders one code frame per line; it uses a single combined shell code frame for the whole command set.
- Guide-page content now keeps nested callout links and code blocks structurally intact instead of flattening them into plain HTML.
- Playwright MCP verified the page’s first command now renders as a code frame instead of staying as plain inline code in the paragraph.
