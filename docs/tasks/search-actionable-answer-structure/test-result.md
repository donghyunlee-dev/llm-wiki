# search-actionable-answer-structure Test Result

## Scope
- Search actionable answer structure.

## Environment
- Profile: local development
- Database: none
- External dependencies: local dev server, OpenAI, Confluence

## Commands
- `pnpm --filter @sfood/wiki-core test -- src/lib/aiAsk.test.ts`
- `pnpm --filter @sfood/web test -- src/lib/aiSearchResponse.test.ts src/ui/searchRecommendations.test.ts`
- `pnpm typecheck`
- `curl -s -X POST http://localhost:5173/api/wiki/ai/search -H 'Content-Type: application/json' -d '{"question":"윈도우에서 claude code cli 설치하는 방법"}'`

## Results
- PASS: wiki-core tests passed after adding structured actionable search fields.
- PASS: web parser tests passed after normalizing the new actionable arrays.
- PASS: workspace typecheck passed.
- PASS: the reproduced Claude CLI install query returned structured actionable fields:
  - `immediateActions`
  - `exampleCommands`
  - `verificationChecks`
  - `cautions`
  - `recommendedDocuments`
- PASS: the same response also preserved `policyNotice` and Confluence evidence.

## Failure Notes
- None in the final validation pass for the reproduced query.

## Retest Results
- Earlier iterations showed either a one-line answer or schema leakage degradation.
- Final iteration returned detailed actionable arrays plus guide links.

## Acceptance Criteria Coverage
- AC1: Passed.
- AC2: Passed.
- AC3: Passed for the reproduced Claude CLI install query.
