# search-setup-answer-structure Result

## Delivered Scope
- Reproduced the one-line search answer for the Claude CLI install query.
- Tightened the setup-question prompt so non-trivial install/setup answers require explicit sections and code blocks when commands are available.
- Revalidated the same question and confirmed the answer structure improved.

## Changed Files
- `packages/wiki-core/src/lib/aiAsk.ts`
- `packages/wiki-core/src/lib/aiAsk.test.ts`
- `docs/tasks/search-setup-answer-structure/spec.md`
- `docs/tasks/search-setup-answer-structure/plan.md`
- `docs/tasks/search-setup-answer-structure/tasks.md`
- `docs/tasks/search-setup-answer-structure/test-result.md`
- `docs/tasks/search-setup-answer-structure/result.md`

## Key Decisions
- Treat the original one-line output as a generation-constraint bug, not a renderer bug.
- Strengthen setup instructions before touching retrieval because the same query was already classified as `setup`.

## Open Gaps
- The search result parser still degrades when the model leaks schema-like fields into `answer`.
- A follow-up fix is needed in `parseAiSearchResult` and/or prompt contract enforcement.

## Next Steps
- Harden search response parsing so leaked schema fragments do not break `policyNotice`, evidence, and recommendations.
