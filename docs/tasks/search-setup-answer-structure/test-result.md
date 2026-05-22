# search-setup-answer-structure Test Result

## Scope
- Setup-question answer structure enforcement.

## Environment
- Profile: local development
- Database: none
- External dependencies: local dev server, OpenAI, Confluence

## Commands
- `curl -s -X POST http://localhost:5173/api/wiki/ai/search -H 'Content-Type: application/json' -d '{"question":"윈도우에서 claude code cli 설치하는 방법"}'`
- `pnpm --filter @sfood/wiki-core test -- src/lib/aiAsk.test.ts`
- `pnpm typecheck`
- `curl -s -X POST http://localhost:5173/api/wiki/ai/search -H 'Content-Type: application/json' -d '{"question":"윈도우에서 claude code cli 설치하는 방법"}'`

## Results
- PASS: Reproduced the original problem. The local search API returned a single-line answer for `윈도우에서 claude code cli 설치하는 방법`.
- PASS: The question is classified as `setup`, so the issue is not the intent classifier.
- PASS: After the setup-prompt tightening, targeted tests and workspace typecheck passed.
- PASS: Revalidation returned a multi-section answer for the same query, proving the original one-line issue was a prompt-constraint problem.
- FAIL: The revalidated response still leaked schema-like fields into `answer`, causing `parseAiSearchResult` to fall back and lose parsed `policyNotice`, `confluenceData`, and recommendations.

## Failure Notes
- The remaining issue is response parsing/contract robustness, not setup-answer structure anymore.

## Retest Results
- Before fix: one-line summary only.
- After fix: structured answer with `바로 할 일`, `예시`, `확인`, `주의`, but mixed with leaked schema text.

## Acceptance Criteria Coverage
- AC1: Passed.
- AC2: Passed for the reproduced query.
- AC3: Partially passed. The visible answer structure improved, but the response still violates the JSON contract in a way the current parser does not fully recover from.
