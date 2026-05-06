# search-quality-and-answer-rendering Tasks

## Implementation Tasks
- [x] Define 5 representative wiki-grounded search questions.
- [ ] Build the baseline comparison workflow for generic AI answers versus wiki-based search answers.
- [x] Fix search retrieval issues that weaken relevance order or broaden candidate selection too much.
- [ ] Tighten internal-content filtering where heuristics are currently too loose.
- [x] Improve search answer rendering with Confluence-like structured components.
- [ ] Run iterative comparison and refine the implementation until results stabilize.

## Test Tasks
- [ ] Validate the 5-question comparison set against current Confluence-backed content.
- [x] Add or update unit tests for any retrieval or rendering behavior that changes.
- [x] Run `pnpm test`.
- [x] Run `pnpm typecheck`.
- [x] Run `pnpm build`.
- [x] Launch the app and manually inspect the search answer screen.
- [x] Verify the live search screen in-browser for raw JSON leakage after cache normalization.

## Documentation Tasks
- [x] Update `docs/prd/implementation-status.md`.
- [ ] Update `docs/prd/development-plan.md` if the search flow definition changes as a result of the work.
- [x] Record validation and iteration notes in `docs/tasks/search-quality-and-answer-rendering/test-result.md` and `result.md`.

## Progress Notes
- Search ranking now preserves global relevance order.
- Follow-up query rewriting no longer injects prior answer prose into the retrieval query.
- Search answers now render tables, callouts, inline links, and collapsible code blocks.
- Search answer payloads are normalized before cache reuse so raw JSON-shaped artifacts do not reappear on repeated searches.
- Search input and code block controls now expose basic accessibility metadata for screen readers.
- Evaluation set:
  - `윈도우에서 codex에 gamil mcp 설정을 어떻게 해?`
  - `codex를 cli 환경에서 설치를 어떻게 해?`
  - `Agent 시작하기`와 `사내 위키 활용 방법` 중 먼저 읽어야 할 순서는 무엇인가?
  - `프로젝트 설계 시작하기` 전에 어떤 준비를 해야 하나?
  - `업무 승인 요청 도구`와 `주간 보고서 자동화` 사례를 참고해 어떤 흐름으로 만들면 좋은가?

## Review Notes
- Use specialized agents for question selection, retrieval review, and answer rendering review before editing the implementation.
