# ai-ask-no-ops-context Plan

## Summary
- Remove `ops` from AI prompt context construction.
- Keep `policy` documents as the only hidden prompt policy context.
- Update prompt guide language to match the runtime.

## Impacted Modules
- `packages/wiki-core/src/lib/aiAsk.ts`
- `apps/web/vite.config.ts`
- `docs/prd/ai-ask-prompt-guide.md`
- `docs/prd/implementation-status.md`

## Architecture Approach
- Keep prompt assembly in code but reduce the context set.
- Preserve `ops` document parsing elsewhere if needed, but do not feed it into AI requests.

## Data And API Impact
- No public API shape change.
- AI request payload becomes smaller.

## Validation Plan
- Run `@sfood/wiki-core` tests and typecheck.
- Confirm `opsPolicyContext` no longer appears in AI prompt input.

## Risks
- Search/ops cache code could still appear to support `ops`, but AI input should not use it.

## Rollback Considerations
- Restore the removed argument and payload field if the behavior is later reconsidered.
