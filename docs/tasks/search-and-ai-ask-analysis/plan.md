# search-and-ai-ask-analysis Plan

## Summary
- Document the actual search and `AI Ask` runtime path, compare it against the intended product shape, and convert the observed gaps into a staged implementation roadmap.
- Keep the analysis grounded in existing code and prior task records so the next implementation step can start without rediscovery work.

## Impacted Modules
- `packages/wiki-core/src/lib/wikiDocuments.ts`
- `packages/wiki-core/src/lib/aiAsk.ts`
- `packages/wiki-core/src/lib/wikiDataSource.ts`
- `apps/web/vite.config.ts`
- `apps/web/src/ui/pages/SearchPage.tsx`
- `apps/web/src/ui/pages/ArticleAskPanel.tsx`
- `apps/web/src/ui/StructuredAnswerView.tsx`
- `apps/web/src/ui/searchRecommendations.ts`
- `apps/web/src/ui/pages/HomePage.tsx`
- `packages/wiki-core/src/lib/homeContent.ts`
- `docs/prd/implementation-status.md`
- `docs/prd/development-plan.md`

## Architecture Approach
- Trace the current runtime in this order:
  1. Home and route entry
  2. Visible wiki document loading
  3. Search candidate selection
  4. Policy-context selection
  5. OpenAI answer generation
  6. Search/article answer rendering
  7. Home-page link resolution
- Separate observed gaps by layer so future work does not mix retrieval tuning with UI redesign or Home wiring.

## Data And API Impact
- No runtime contracts change in this task.
- The analysis explicitly checks where the implementation still differs from the PRD/API targets:
  - `GET /api/wiki/home` is not implemented.
  - `GET /api/wiki/search?q=` is not implemented as a separate normalized search API.
  - Search currently depends on Vite-local `POST /api/wiki/ai/search` plus the visible wiki cache.

## Validation Plan
- Read the required PRD and ops docs.
- Inspect search, `AI Ask`, policy, and Home UI code paths.
- Cross-check prior task results and benchmark outputs.
- Record findings and recommended execution order in task docs and PRD progress docs.

## Risks
- The codebase and older task docs use terms like `semantic` or `guideDocuments` loosely, which can hide the actual behavior.
- Search quality can look acceptable in a few queries while still failing the broader benchmark and policy-governance expectations.
- Static Home content can mask the amount of work still needed for real page-level linking.

## Rollback Considerations
- This task is documentation-only. Reverting means removing the added task workspace and PRD analysis notes.
