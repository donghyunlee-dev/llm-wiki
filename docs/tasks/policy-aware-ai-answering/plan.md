# policy-aware-ai-answering Plan

## Summary
- Add a hidden policy document path, precompute compact policy summaries, and thread the selected policy context into both AI Ask pipelines.

## Impacted Modules
- `packages/wiki-core/src/lib/confluenceReadModel.ts`
- `packages/wiki-core/src/lib/wikiDataSource.ts`
- `packages/wiki-core/src/lib/aiAsk.ts`
- `apps/web/vite.config.ts`

## Architecture Approach
- Treat `policy` as a separate hidden document class from visible wiki documents.
- Build policy summaries at cache-load time, then rank only the top relevant policy snippets per request.
- Keep policy selection deterministic and in-memory so prompt construction stays fast without adding persistence.

## Data And API Impact
- Extend the raw Confluence read model to recognize `docType: policy`.
- Add hidden policy document records alongside the existing `ops` policy cache path.
- Thread a `policyContext` payload into the Responses API input for both Ask flows.

## Validation Plan
- Unit tests for policy parsing and hidden filtering.
- Unit tests for policy summary selection and prompt assembly.
- Integration-style checks for document Ask and search Ask prompt inputs.
- Full workspace `test`, `typecheck`, and `build`.

## Risks
- Too many policy snippets could increase prompt size if selection is too broad.
- Conflicting policy pages could make answers less stable if precedence is not explicit.

## Rollback Considerations
- Remove the policy context wiring while leaving the existing ops hidden context path intact.
- Keep visible document routing unchanged so the rollback only affects AI prompt construction.
