# read-only-wiki-core Plan

## Summary
- Build a shared read-only wiki document layer and refactor the app to consume it.

## Impacted Modules
- `packages/wiki-core`
- `apps/web`
- `docs/tasks/read-only-wiki-core`

## Architecture Approach
- Keep normalization and document lookup in shared modules.
- Keep browser-visible pages dependent on shared read models rather than local page-only fixture strings.
- Add Confluence read-model helpers without forcing live upstream access in the frontend.

## Data And API Impact
- Introduces normalized `WikiDocument` models and category/search read functions.
- Introduces sanitization and heading extraction helpers for future Confluence integration.

## Validation Plan
- Add unit tests for sanitization and normalization.
- Run workspace tests, type checks, and build.

## Risks
- HTML parsing is intentionally lightweight and should be treated as an interim normalizer until the real upstream pipeline is wired.
- Category mapping still uses local fixture documents until live Confluence fetch integration lands.

## Rollback Considerations
- Revert shared document model modules and restore placeholder pages if the normalization approach changes.
