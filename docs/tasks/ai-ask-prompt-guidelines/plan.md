# ai-ask-prompt-guidelines Plan

## Summary
- Add a Korean prompt guideline document under `docs/prd/`.
- Update `packages/wiki-core/src/lib/aiAsk.ts` to point to the guideline as the source to check before prompt changes.
- Update PRD read order so the new guideline is part of the standard reading path.

## Impacted Modules
- `docs/prd/ai-ask-prompt-guide.md`
- `docs/prd/README.md`
- `packages/wiki-core/src/lib/aiAsk.ts`
- `docs/prd/implementation-status.md`

## Architecture Approach
- Keep the prompt text in code, but make the document the review-first reference.
- Separate visible answer contracts from prompt-writing guidance.
- Keep search display rules in `search-flow-contract.md`.

## Data And API Impact
- No API contract change.
- No runtime data model change.
- Only prompt guidance and documentation change.

## Validation Plan
- Review the new guideline for coverage of page types and answer order.
- Confirm `aiAsk.ts` has an explicit comment or reference to the guideline.
- Confirm `docs/prd/README.md` includes the new document in read order.

## Risks
- The guideline can drift from the prompt text if future changes update only one side.
- Too much overlap with `search-flow-contract.md` could create duplication.

## Rollback Considerations
- Remove the new guideline document and the small reference comment from `aiAsk.ts` if needed.
- Restore the PRD read order if the new document does not fit the workflow.
