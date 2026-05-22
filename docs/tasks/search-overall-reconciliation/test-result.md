# search-overall-reconciliation Test Result

## Scope
- Validation for the end-to-end search flow reconciliation.

## Environment
- Profile: local web app
- Database: none
- External dependencies: Confluence and OpenAI only if the live path is exercised

## Commands
- `pnpm --filter @sfood/wiki-core test -- src/lib/wikiDocuments.test.ts src/lib/aiAsk.test.ts`
- `pnpm --filter @sfood/wiki-core typecheck`
- `pnpm --filter @sfood/web test -- src/lib/aiSearchResponse.test.ts src/ui/structuredAnswer.test.ts src/ui/searchRecommendations.test.ts`
- `pnpm typecheck`
- `pnpm --filter @sfood/web test -- src/lib/aiSearchResponse.test.ts src/ui/structuredAnswer.test.ts src/ui/searchRecommendations.test.ts`

## Browser Check
- Verified `http://localhost:5173/search?q=mcp가 뭐지?` in Playwright.
- PASS: visible answer starts with the explanation and policy notice, not a raw JSON fragment or prefix label.
- PASS: recommendation sections render after the answer and the page does not expose schema keys in the visible text.
- PASS: mobile viewport no longer produces horizontal overflow after constraining code-block and answer-section width.
- PASS: the cached `mcp가 뭐지?` path now renders three cards in `추천 페이지` and three cards in `관련 페이지`, proving the recommendation block is no longer single-card only.

## Results
- PASS: wiki-core tests passed after removing the concept-question bypass from index-first candidate selection.
- PASS: wiki-core typecheck passed.
- PASS: web parser and rendering tests passed.
- PASS: search recommendation fallback now prefers AI-recommended pages and only uses generic fallback pages when AI page links are omitted.
- PASS: full workspace typecheck passed.
- PASS: CSS regression on the search answer code block was fixed with `min-width`/`max-width` containment on answer sections and code frames.
- PASS: targeted web search rendering tests passed after the CSS containment update.
- PASS: search recommendation section now supports multiple strong cards in strongest-first order.

## Failure Notes
- Initial version of the new concept-question regression test expected the wrong visible seed page and was corrected to reflect that index pages are seeds, not visible results.

## Retest Results
- Re-ran wiki-core tests after adjusting the concept-question expansion test fixture; all wiki-core tests passed.

## Acceptance Criteria Coverage
- AC1: covered by `getIndexFirstSearchWikiDocumentsIn` tests and ranking tests
- AC2: partially covered by existing exclusion tests and search-context tests
- AC3: covered by existing parser and structured-answer tests
- AC4: covered by recommendation ordering and fallback tests
- AC5: pending final cache verification
- AC6: covered by targeted unit tests, parser checks, and browser verification
