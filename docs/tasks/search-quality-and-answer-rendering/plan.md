# search-quality-and-answer-rendering Plan

## Summary
- Build a repeatable evaluation loop that compares a generic AI baseline against the current wiki search answer for 5 representative questions, then use the observed gaps to tune retrieval and answer rendering.
- The first iteration will focus on fixing the search pipeline issues that most directly reduce answer quality, then improving the answer presentation layer so the output reads like a wiki page.

## Impacted Modules
- `packages/wiki-core/src/lib/wikiDocuments.ts`
- `packages/wiki-core/src/lib/wikiDataSource.ts`
- `packages/wiki-core/src/lib/aiAsk.ts`
- `apps/web/src/ui/pages/SearchPage.tsx`
- `apps/web/src/ui/StructuredAnswerView.tsx`
- `apps/web/src/ui/structuredAnswer.ts`
- `apps/web/src/ui/*` search answer components as needed
- `docs/prd/implementation-status.md`
- `docs/prd/development-plan.md`

## Architecture Approach
- Keep the search retrieval path deterministic and read-only.
- Treat the 5 representative questions as an evaluation harness, not product content.
- Compare answers using a simple rubric before and after each change so the improvement loop is observable.
- Prefer small retrieval fixes over larger structural changes:
  - preserve relevance order
  - tighten follow-up query rewriting
  - narrow index expansion
  - make internal-content filtering policy-driven where possible
- Improve answer rendering through reusable structured components instead of custom ad hoc markup in the page component.

## Data And API Impact
- No new persistent storage.
- No change to the canonical Confluence source.
- Search response shape may be extended only if it is required to support richer rendering or better comparison diagnostics.
- Any new rendering data should remain derived from the existing normalized document and AI response structures.

## Validation Plan
- Generate generic AI answers and wiki-based search answers for the same 5 representative questions.
- Compare the two answer sets using the rubric for structure, factual alignment, completeness, and actionability.
- Run unit tests or targeted checks for any retrieval or rendering code that changes.
- Run workspace validation:
  - `pnpm test`
  - `pnpm typecheck`
  - `pnpm build`
- Start the app and inspect the search experience in the browser.

## Risks
- Over-tuning retrieval for the evaluation set could make search worse for broader queries.
- Rendering changes may introduce fragile formatting or overcomplicate the search answer UI.
- If the evaluation questions are too narrow, the loop may miss regressions outside the chosen set.

## Rollback Considerations
- Keep the question set and comparison output isolated in task docs so it can be replaced without product changes.
- If retrieval tuning regresses search, revert the scoring or expansion changes first before touching presentation.
- If rendering changes regress readability, fall back to the previous structured answer renderer while keeping retrieval fixes.
