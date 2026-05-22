# search-overall-reconciliation Tasks

## Implementation Tasks
- Review current search flow against `search-flow-contract.md` and `ai-ask-prompt-guide.md`.
- Align the query-intent/ranking path with the documented index-first candidate flow.
- Remove remaining visible prefix and JSON leakage paths from the search response rendering surface.
- Reconcile recommendation selection, deduplication, and ordering with the contract.
- Update cache behavior notes and any code paths that still contradict the documented rules.

## Test Tasks
- Add regression tests for prefix stripping and embedded JSON recovery.
- Add or update search ranking tests for concept, setup, troubleshooting, and planning questions.
- Verify representative search queries in the browser.
- Run workspace test and typecheck commands after changes.

## Documentation Tasks
- Update `docs/prd/search-flow-contract.md` if the implementation contract needs to change.
- Update `docs/prd/ai-ask-prompt-guide.md` if prompt rules need to change.
- Update `docs/prd/development-plan.md` and `docs/prd/implementation-status.md` after implementation.
- Record validation results in `test-result.md` and the final delivery summary in `result.md`.

## Progress Notes
- Initial scope confirmed from docs and current code.
- Search work is being treated as one end-to-end pipeline rather than isolated UI cleanup.
- Candidate selection now keeps the index-first path active for all question families instead of bypassing it for concept-style questions.
- wiki-core ranking and search-context tests passed after the candidate-selection adjustment.
- Recommendation selection now prefers AI-recommended pages first and only falls back to generic ranking when the model omits page links.
- web searchRecommendation tests and full workspace typecheck passed after the fallback-rule adjustment.
- Playwright verified the live search page for `mcp가 뭐지?` now renders a clean answer and the expected recommendation flow.

## Review Notes
- The implementation must not introduce a new persistent search index or broaden scope into write-back or unrelated navigation changes.
