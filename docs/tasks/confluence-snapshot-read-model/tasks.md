# confluence-snapshot-read-model Tasks

## Implementation Tasks
- [x] Add raw Confluence snapshot fixtures.
- [x] Derive shared wiki documents from the normalization pipeline.
- [x] Expose source snapshot links in article pages.

## Test Tasks
- [x] Add snapshot normalization tests.
- [x] Run `pnpm test`, `pnpm typecheck`, and `pnpm build`.

## Documentation Tasks
- [x] Update PRD progress tracking docs after implementation.
- [x] Record the next follow-up step for live upstream fetch wiring.

## Progress Notes
- This step keeps the frontend unchanged at the route contract level while shifting the underlying data path closer to the final Confluence model.

## Review Notes
- Live fetch integration is now primarily a source-loading task, not a document-shape redesign task.
