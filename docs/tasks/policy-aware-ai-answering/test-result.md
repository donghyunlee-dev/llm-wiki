# policy-aware-ai-answering Test Result

## Scope
- Validate hidden policy parsing, policy selection, and AI prompt construction.

## Environment
- Profile: local workspace
- Database: none
- External dependencies: Confluence and OpenAI runtime only for end-to-end checks

## Commands
- `pnpm --filter @sfood/wiki-core test`
- `pnpm --filter @sfood/wiki-core typecheck`
- `pnpm test`
- `pnpm typecheck`
- `pnpm build`

## Results
- PASS: `packages/wiki-core` unit tests passed after policy parsing and prompt helper updates.
- PASS: `packages/wiki-core` typecheck passed.
- PASS: workspace `pnpm test` passed.
- PASS: workspace `pnpm typecheck` passed.
- PASS: workspace `pnpm build` passed.

## Failure Notes
- Initial run failed because `confluenceReadModel` still referenced removed `stripHtml` helpers and `policy` was not yet accepted in the remote doc-type validator.

## Retest Results
- Retested after restoring heading text extraction to use `htmlToPlainText` and adding `policy` support to the remote validator.

## Acceptance Criteria Coverage
- Hidden policy pages are parsed and cached separately.
- Both Ask flows include selected policy context.
- Policy context is compact and top-k selected before model calls.
- Policy pages remain out of visible search results and document recommendations.
