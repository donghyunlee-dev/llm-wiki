# search-setup-answer-structure Plan

## Summary
- Strengthen setup-question answer instructions so the model treats one-line summaries as invalid and emits explicit sections for action, example, verification, and caution.

## Impacted Modules
- `packages/wiki-core/src/lib/aiAsk.ts`
- `packages/wiki-core/src/lib/aiAsk.test.ts`
- `docs/tasks/search-setup-answer-structure/*`

## Architecture Approach
- Keep retrieval unchanged.
- Tighten the setup-specific system instruction lines and the search output requirement text.
- Validate with the exact failing question against the running local service.

## Data And API Impact
- No schema change.
- Prompt/instruction change only.

## Validation Plan
- Run `pnpm --filter @sfood/wiki-core test -- src/lib/aiAsk.test.ts`
- Re-run the local search API for:
  - `윈도우에서 claude code cli 설치하는 방법`

## Risks
- The model may still ignore the stronger instruction on some queries.
- Over-constraining could make short trivial setup answers too verbose.

## Rollback Considerations
- Revert the prompt lines if they regress other answer classes.
