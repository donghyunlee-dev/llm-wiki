# claude-worktree-search-investigation Result

## Delivered Scope
- Verified the Confluence state of page `95780877` and the local search API behavior for `claude worktree를 설명하세요.`.
- Determined that the page property setup is valid and that the failure is in the current search/AI response path, not in missing page metadata.
- Traced the failure to candidate ranking/context construction before the AI answer stage:
  - target page rank `23` in direct lexical search
  - target page rank `18` in index-first ranking
  - target page excluded from the top-seed/top-context slice actually sent to AI

## Changed Files
- docs/tasks/claude-worktree-search-investigation/spec.md
- docs/tasks/claude-worktree-search-investigation/plan.md
- docs/tasks/claude-worktree-search-investigation/tasks.md
- docs/tasks/claude-worktree-search-investigation/test-result.md
- docs/tasks/claude-worktree-search-investigation/result.md

## Key Decisions
- Keep this task investigation-only until a concrete defect is confirmed.
- Treat page `95780877` as publicly eligible search corpus input based on its current metadata.
- Treat Stage 1 query understanding as non-contributory for this query because the reproduced OpenAI response did not complete within the current `max_output_tokens` limit.

## Open Gaps
- Search still has two concrete weaknesses for this case:
  - Stage 1 query understanding times out/truncates and does not provide bilingual keyword expansion.
  - Stage 2 concept ranking underweights the specific `worktree/worktrees` page relative to broad Claude guide pages, so the target never reaches AI.
- The reproduced response also shows an inconsistency: the answer says no page exists while `unsupportedClaims` is empty and unrelated recommendations are still attached.

## Next Steps
- Fix retrieval first:
  - make query-understanding return usable keywords for this class of query
  - strengthen lexical handling for singular/plural technical terms like `worktree` / `worktrees`
  - reduce concept-mode bias that favors broad Claude guides over the exact subject page
- Then retest the same query through `/api/wiki/ai/search` and verify that page `95780877` enters AI context and appears in `recommendedDocuments` or `confluenceData`.
