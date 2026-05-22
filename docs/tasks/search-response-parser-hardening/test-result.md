# search-response-parser-hardening Test Result

## Scope
- Search response parser hardening for schema-leak recovery.

## Environment
- Profile: local development
- Database: none
- External dependencies: local dev server, OpenAI, Confluence

## Commands
- `pnpm --filter @sfood/web test -- src/lib/aiSearchResponse.test.ts src/ui/searchRecommendations.test.ts`
- `pnpm typecheck`
- `curl -s -X POST http://localhost:5173/api/wiki/ai/search -H 'Content-Type: application/json' -d '{"question":"윈도우에서 claude code cli 설치하는 방법"}'`

## Results
- PASS: parser unit tests passed for normal JSON and leaked labeled-schema recovery.
- PASS: web tests passed after wiring the new helper.
- PASS: workspace typecheck passed.
- PASS: local service returned recovered `confluenceData` and `recommendedDocuments` for the Claude CLI query instead of the previous degraded empty-field fallback.
- FAIL: the same local query still returned a one-line `answer`, which confirms the remaining issue is answer generation quality rather than parser recovery.

## Failure Notes
- Parser hardening does not guarantee structured prose quality.

## Retest Results
- Not applicable beyond the first successful validation pass.

## Acceptance Criteria Coverage
- AC1: Passed.
- AC2: Passed.
- AC3: Passed.
