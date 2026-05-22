# search-overall-reconciliation Result

## Follow-up Fix
- Constrained search-answer sections and code-frame components with `min-width: 0` / `max-width: 100%` so the visible answer no longer forces horizontal overflow on mobile viewports.
- The search result page now keeps the code example inside the answer column instead of stretching the whole layout wider than the screen.

## Current Recommendation Rule
- `추천 페이지` now shows multiple cards in strongest-first order instead of a single primary card.
- AI recommendations stay first, and the UI can fill strong follow-up cards from the same search corpus before weaker documents move to `관련 페이지`.

## Delivered Scope
- Search recommendation flow now reflects the index-page intent: the first card is the strongest family entry, and additional strong follow-up pages can stay in the recommendation block.
- Search answer rendering still keeps the direct answer, action blocks, and document cards in the documented order.

## Changed Files
- `apps/web/src/ui/searchRecommendations.ts`
- `apps/web/src/ui/pages/SearchPage.tsx`
- `apps/web/src/ui/searchRecommendations.test.ts`
- `apps/web/src/styles.css`
- `docs/prd/search-flow-contract.md`
- `docs/prd/ai-ask-prompt-guide.md`
- `packages/wiki-core/src/lib/aiAsk.ts`
- `docs/tasks/search-overall-reconciliation/spec.md`
- `docs/tasks/search-overall-reconciliation/plan.md`

## Key Decisions
- Recommendation cards are now ordered strongest-first and may include more than one strong page.
- The search UI can supplement a short AI recommendation list with fallback candidates from the same query to keep the recommendation block useful.

## Open Gaps
- The live search answer still depends on the current cached AI response path, so browser validation should be repeated after cache refresh or query variation.

## Next Steps
- Re-run a live concept question after cache refresh to confirm the first recommendation is the overview/index page family entry and the next cards remain strong follow-ups.
