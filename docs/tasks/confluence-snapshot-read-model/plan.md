# confluence-snapshot-read-model Plan

## Summary
- Replace direct document fixtures with Confluence-shaped raw snapshot fixtures that are normalized into shared wiki documents.

## Impacted Modules
- `packages/wiki-core`
- `apps/web`
- `docs/tasks/confluence-snapshot-read-model`

## Architecture Approach
- Keep snapshot fixtures raw.
- Pass them through the same normalization layer intended for future live upstream data.
- Avoid changing page rendering contracts while changing the underlying source path.

## Data And API Impact
- Introduces `confluenceSnapshots.ts`.
- Changes `wikiDocuments.ts` from direct fixture ownership to normalized snapshot ownership.

## Validation Plan
- Add snapshot normalization tests.
- Run workspace tests, type checks, and build.

## Risks
- Snapshot content is still local fixture data, so upstream parity is partial.
- Real fetch integration still needs a loader boundary and space-guarded fetch path.

## Rollback Considerations
- Revert snapshot derivation and restore direct wiki document fixtures if the normalization pipeline changes.
