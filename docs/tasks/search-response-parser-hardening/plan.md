# search-response-parser-hardening Plan

## Summary
- Extract search response parsing into a dedicated helper, add a labeled-fragment recovery path, and validate it with unit tests plus the reproduced local query.

## Impacted Modules
- `apps/web/src/lib/aiSearchResponse.ts`
- `apps/web/src/lib/aiSearchResponse.test.ts`
- `apps/web/vite.config.ts`

## Architecture Approach
- Parse valid full JSON first.
- Reject partial nested JSON fragments that do not look like a full search payload.
- If full JSON parsing fails, recover:
  - answer text before labeled schema sections
  - `policyNotice`
  - `confluenceData`
  - `unsupportedClaims`
  - `recommendedPages`

## Data And API Impact
- No contract change.
- Fallback parsing becomes more robust.

## Validation Plan
- `pnpm --filter @sfood/web test -- src/lib/aiSearchResponse.test.ts src/ui/searchRecommendations.test.ts`
- `pnpm typecheck`
- `curl -s -X POST http://localhost:5173/api/wiki/ai/search -H 'Content-Type: application/json' -d '{"question":"윈도우에서 claude code cli 설치하는 방법"}'`

## Risks
- Recovery rules can accidentally trim legitimate answer text if marker detection is too broad.
- Parser hardening can hide model-quality issues if used as a substitute for prompt cleanup.

## Rollback Considerations
- Revert helper extraction and fallback recovery together if they regress valid JSON handling.
