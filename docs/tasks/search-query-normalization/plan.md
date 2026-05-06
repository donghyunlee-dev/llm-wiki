# search-query-normalization Plan

## Summary
- Improve search token normalization and add a small email/setup synonym layer so setup guides are reachable from common mixed-language questions.

## Impacted Modules
- `packages/wiki-core/src/lib/wikiDocuments.ts`
- `packages/wiki-core/src/lib/wikiDocuments.test.ts`

## Architecture Approach
- Keep search local and deterministic.
- Normalize query tokens by stripping common Korean particles from token endings.
- Expand a limited synonym set for email and setup terminology before scoring.
- Include slug and docType as lightweight scoring signals.

## Data And API Impact
- No public API shape changes.
- No persistence changes.
- Search relevance changes only in ranking and candidate selection.

## Validation Plan
- Unit tests for particle stripping and synonym expansion.
- Unit tests that verify Gmail and Microsoft 365 setup pages are found from Korean mixed-language queries.
- Workspace test, typecheck, and build.

## Risks
- Over-expanding synonyms could introduce noisy matches.
- Particle stripping must not remove meaningful trailing characters from short tokens.

## Rollback Considerations
- Remove synonym expansion and revert to the prior tokenization path if search relevance regresses.
