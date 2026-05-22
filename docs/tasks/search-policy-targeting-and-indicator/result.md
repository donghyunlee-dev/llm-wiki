# search-policy-targeting-and-indicator Result

## Delivered Scope
- Extended both AI answer contracts with a visible `policyNotice` object.
- Updated the search and article answer UIs to render a compact policy notice when the answer is policy-related.
- Removed the duplicated `guideDocuments` field from the search response path.
- Updated PRD and task docs to record that hidden Confluence policy pages are part of the answer-generation target set.

## Changed Files
- `packages/wiki-core/src/lib/aiAsk.ts`
- `packages/wiki-core/src/lib/aiAsk.test.ts`
- `apps/web/vite.config.ts`
- `apps/web/src/ui/pages/SearchPage.tsx`
- `apps/web/src/ui/pages/ArticleAskPanel.tsx`
- `apps/web/src/ui/searchRecommendations.ts`
- `apps/web/src/styles.css`
- `docs/prd/api-spec.md`
- `docs/prd/implementation-status.md`
- `docs/tasks/search-policy-targeting-and-indicator/spec.md`
- `docs/tasks/search-policy-targeting-and-indicator/plan.md`
- `docs/tasks/search-policy-targeting-and-indicator/tasks.md`
- `docs/tasks/search-policy-targeting-and-indicator/test-result.md`
- `docs/tasks/search-policy-targeting-and-indicator/result.md`

## Key Decisions
- Policy pages remain hidden from visible search results and recommendations.
- The UI exposes policy influence through a short generic notice instead of page titles or raw policy excerpts.
- `recommendedDocuments` remains the single visible search recommendation list.

## Open Gaps
- Live Confluence/OpenAI validation is still needed to tune how often the model sets the policy notice.
- Search retrieval quality itself is not improved yet in this task.

## Next Steps
- Continue Phase 1 with retrieval regression coverage and contract cleanup around the remaining weak benchmark cases.
- Add live validation for policy-sensitive queries so the new notice can be tuned against real answers.
