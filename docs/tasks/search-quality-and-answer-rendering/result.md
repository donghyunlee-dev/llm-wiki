# search-quality-and-answer-rendering Result

## Delivered Scope
- Search retrieval now preserves global relevance order instead of flattening by category order.
- Index-first expansion is narrower and no longer broadens matches to unrelated same-category pages.
- Follow-up search query rewriting no longer injects prior answer prose into retrieval.
- Search and article answers now render richer wiki-like content blocks: inline links, tables, info/warning callouts, and collapsible code blocks.
- Standalone terminal commands such as `npm install -g @openai/codex` are promoted into copyable code blocks instead of staying inline.
- The search answer screen no longer shows the `문서 기반 답변` eyebrow and now keeps the visible header focused on the answer title and summary.
- Search answer payloads are normalized before caching and rendering so older JSON-shaped answer artifacts do not leak into the visible UI.
- The visible search answer screen no longer shows `핵심 인용` or `지원되지 않는 항목`; those details stay internal to answer generation.
- The search answer body now asks the model to place relevant wiki page links inline when a step or detail is directly supported by a document, and internal wiki links open in a new tab.
- The search result answer header no longer shows the extra explanation section above the answer body.
- The code component now uses a smaller GitHub/Notion-style card with compact header actions, better line-number alignment, and copyable shell snippets.
- Search input and collapsible code blocks now expose clearer accessibility metadata (`aria-label`, `aria-expanded`, `aria-controls`).
- Validation passed for targeted tests, workspace typecheck, workspace build, and root workspace tests.

## Evaluation Set
- `Codex에서 Jira MCP를 설정할 때 먼저 준비할 항목과 검증 순서는 무엇인가?`
- `codex를 cli 환경에서 설치를 어떻게 해?`
- `Agent 시작하기`와 `사내 위키 활용 방법` 중 먼저 읽어야 할 순서는 무엇인가?
- `프로젝트 설계 시작하기` 전에 어떤 준비를 해야 하나?
- `업무 승인 요청 도구`와 `주간 보고서 자동화` 사례를 참고해 어떤 흐름으로 만들면 좋은가?
- `Codex CLI를 처음 설치할 때 인증과 버전 확인까지 최소 절차는 무엇인가?`
- `프로젝트 설계를 시작할 때 반드시 정해야 하는 항목과 뒤로 미뤄도 되는 항목은 무엇인가?`
- `설정이 잘 안 될 때 먼저 확인해야 하는 순서는 무엇인가?`

## Comparison Summary
- Generic answers are expected to be broader and less grounded in the wiki corpus.
- Wiki-based answers should win on exact document grounding, internal page selection, and next-step recommendations.
- The current patches improved the wiki path by keeping relevance order intact, reducing follow-up noise, expanding broad-planning retrieval, and making the response look more like a wiki page.
- The latest benchmark reached `79.5 / 100` average wiki similarity. That is better than the previous run, but it is still below the requested `90 / 100` threshold.
- Strongest benchmark case: `Codex CLI` minimal install flow reached `90 / 100`.
- Weakest benchmark cases: approval + weekly report automation, general troubleshooting, and the still-too-short project planning follow-up question.

## Changed Files
- `packages/wiki-core/src/lib/wikiDocuments.ts`
- `packages/wiki-core/src/lib/wikiDocuments.test.ts`
- `packages/wiki-core/src/lib/aiAsk.ts`
- `packages/wiki-core/src/lib/aiAsk.test.ts`
- `apps/web/src/ui/structuredAnswer.ts`
- `apps/web/src/ui/StructuredAnswerView.tsx`
- `apps/web/src/ui/structuredAnswer.test.ts`
- `apps/web/src/ui/pages/SearchPage.tsx`
- `apps/web/src/styles.css`
- `docs/tasks/search-quality-and-answer-rendering/spec.md`
- `docs/tasks/search-quality-and-answer-rendering/plan.md`
- `docs/tasks/search-quality-and-answer-rendering/tasks.md`
- `docs/tasks/search-quality-and-answer-rendering/test-result.md`
- `docs/tasks/search-quality-and-answer-rendering/result.md`

## Key Decisions
- Keep search ranking deterministic and local instead of adding a separate index.
- Remove prior AI answer prose from the retrieval query to reduce noise in follow-up searches.
- Use reusable structured rendering instead of hard-coded answer formatting in the page component.

## Open Gaps
- The explicit generic-AI-vs-wiki answer comparison loop is now captured as a benchmark script, but the observed average similarity still does not meet the `90 / 100` target.
- Internal-content filtering still relies on the current Confluence metadata shape and a small set of heuristics.

## Next Steps
- Persist or automate the 5-question comparison loop if the team wants a repeatable benchmark inside the repo.
- Tighten internal-content filtering if the Confluence corpus exposes more public-but-internal pages later.
