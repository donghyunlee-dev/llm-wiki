# search-overall-reconciliation Spec

## Problem Statement
- The search flow is currently split across several layers: retrieval ranking, index-first expansion, AI prompt construction, response parsing, visible answer rendering, recommendation selection, and cache behavior.
- The documented search rules and the implemented behavior have drifted in multiple places, so the search experience can still leak JSON fragments, show unwanted prefixes, or prioritize the wrong document family.

## Business Context
- Search is the main entry point into the wiki.
- Users rely on search to choose the right index page, then follow the most relevant guide or supporting page without being sent to the wrong setup document.
- Search needs to stay readable and stable even when the AI returns mixed-format output.
- The implementation must remain deterministic, read-only, and grounded in the current Confluence corpus.

## Scope
- Reconcile the search behavior with the documented contract across:
  - query intent classification
  - index-first candidate selection
  - guide keyword expansion
  - ranking and scoring
  - public-only and onboarding exclusions
  - policy context handling
  - AI response normalization
  - visible answer formatting
  - recommended and related page ordering
  - memory cache behavior and invalidation rules
- Update or add tests that prove the search flow no longer leaks raw JSON or prefix labels into the visible answer.
- Update the relevant PRD/task documents so they match the finalized search behavior.
- Make the recommendation section multi-card aware so the strongest index/family page appears first and additional strong follow-up pages can stay in `추천 페이지` before weaker reads move to `관련 페이지`.

## Out Of Scope
- Write-back or editing workflows.
- A persistent search index or database.
- Home screen redesign.
- Guide index graph redesign.
- Non-search article-page behavior unless it uses the same shared normalization helpers.

## User Or Operator Scenarios
- A user asks a conceptual question and sees an overview or index-driven page first rather than a narrow setup page.
- A user asks a setup question and gets an actionable answer with the correct guide pages, not an unrelated overview page.
- A user sees a search answer that starts with the explanation instead of `짧답:` or another prefix label.
- A user sees no raw JSON fragments or schema names in the visible search answer.

## Acceptance Criteria
- AC1: Search candidate selection follows the documented `index -> 하위 문서 -> 관련 문서 -> 점수 보정` flow for guide-heavy questions.
- AC2: Public-only, `ops`, `policy`, and onboarding exclusions are enforced consistently in the candidate path and the visible recommendation path.
- AC3: Visible search answers no longer expose raw JSON fragments, schema labels, or prefix labels such as `짧답:`.
- AC4: `추천 페이지` and `관련 페이지` still render in the documented order, and the recommendation set is stable and deduplicated.
- AC4: `추천 페이지` can render multiple strong pages in strongest-first order, while `관련 페이지` contains the weaker follow-up pages.
- AC5: Cache behavior stays memory-based with TTL/version invalidation rules and is documented at the same level as the implementation.
- AC6: The updated behavior is covered by tests and browser verification on representative concept, setup, troubleshooting, and planning questions.

## Edge Cases
- A question mixes concept and setup intent.
- A question returns malformed AI output with a JSON wrapper or labeled schema fragments.
- A search question has weak lexical signal but a strong index-page signal.
- A policy-sensitive question should still avoid exposing policy page names in the visible answer.
- A follow-up question should reuse recent history without losing the current question intent.

## Assumptions
- The current Confluence corpus and metadata are sufficient to support deterministic heuristic ranking.
- In-memory caching is acceptable for the current product stage.
- The search UI remains read-only.
- Existing search response contracts can be refined without adding a persistent search backend.

## Clarifications
- Question: Does this include article-page `AI Ask`?
- Answer: Only where shared search helpers are reused. The main scope is the `/search` flow and the shared prompt/normalization logic it depends on.
