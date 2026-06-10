# search-rovo-like-answer-quality Tasks

## Implementation Tasks
- [x] Document the retrieval/answer gaps against the Rovo benchmark.
- [x] Improve search retrieval for direct topic pages like `Claude Code Worktrees`.
- [x] Improve Stage 1 fallback handling when query-understanding returns no usable result.
- [x] Normalize inconsistent no-page answer payloads.

## Test Tasks
- [x] Add retrieval regression tests for `worktree` / `worktrees` and page-backed concept queries.
- [x] Add response consistency regression tests for no-page answers with empty evidence.
- [x] Run focused package tests and typecheck.

## Documentation Tasks
- [x] Record validation and decisions in task docs.
- [ ] Update `docs/prd/implementation-status.md`.
- [x] Update `docs/prd/search-flow-contract.md` if behavior changes need to be codified.

## Progress Notes
- Created to close the quality gap between internal wiki search and Confluence Rovo for employee-facing answers.
- Retrieval changes now promote direct page-backed matches through token coverage, title/slug multi-token boosts, and singular/plural English variant handling.
- Stage 1 fallback now uses a cleaned fallback query instead of the raw user sentence when query-understanding returns no usable keywords.
- Dev API retest for `claude worktree를 설명하세요.` now returns page `95780877` in both `confluenceData` and `recommendedDocuments`.

## Review Notes
- Preserve unrelated user changes in `apps/web/src/ui/*` and existing task folders.
