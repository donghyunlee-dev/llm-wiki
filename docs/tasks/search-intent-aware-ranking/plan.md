# search-intent-aware-ranking Plan

## Summary
- Build a query-profile-aware ranking layer that scores documents by intent fit, document role signals, lexical match, and graph proximity.
- Use the same ranking for visible recommendation fallbacks so the UI and AI answer path stay aligned.

## Impacted Modules
- `packages/wiki-core/src/lib/wikiDocuments.ts`
- `packages/wiki-core/src/lib/aiAsk.ts`
- `apps/web/src/ui/searchRecommendations.ts`
- `apps/web/vite.config.ts`
- `packages/wiki-core/src/lib/wikiDocuments.test.ts`
- `packages/wiki-core/src/lib/aiAsk.test.ts`
- `apps/web/src/ui/searchRecommendations.test.ts`

## Architecture Approach
- Add a query-profile helper that infers whether a search question is concept/definition, setup/install, troubleshooting, comparison, planning, or general.
- Add document role signals based on title, summary, headings, body, and existing metadata.
- Re-score search candidates by combining:
  - lexical match
  - query intent fit
  - document role fit
  - graph proximity
  - central/overview page boosts
- Keep the current AI answer step, but feed it a better ordered candidate set.
- Reuse the same ranking helper for frontend fallback recommendations.

## Data And API Impact
- No schema change is required for the first pass.
- The visible recommendation order changes because the search ranking changes.

## Validation Plan
- Add unit tests that cover multiple question families:
  - concept/definition
  - setup/install
  - troubleshooting
  - planning
- Re-run the actual search API for at least one query from each family.
- Verify that `mcp가 뭐지?` prefers the conceptual overview page family rather than setup-only pages.

## Risks
- Heuristic intent detection can still misclassify ambiguous questions.
- A strong setup/query bias could hide overview pages when the user really wants a concept page.
- The ranking may need tuning after live corpus validation.

## Rollback Considerations
- Revert the ranking helper if the new scoring regresses existing setup/troubleshooting flows.
- Keep the old lexical path available so the change can be narrowed quickly if needed.
