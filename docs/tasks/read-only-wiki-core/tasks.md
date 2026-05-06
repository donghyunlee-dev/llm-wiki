# read-only-wiki-core Tasks

## Implementation Tasks
- [x] Add shared wiki document models and search helpers.
- [x] Add Confluence normalization and sanitization helpers.
- [x] Replace placeholder category views with shared document-backed category pages.
- [x] Add article detail routes backed by shared documents.
- [x] Replace hard-coded search placeholders with shared document search groups.

## Test Tasks
- [x] Add normalization and sanitization unit tests.
- [x] Run `pnpm test`, `pnpm typecheck`, and `pnpm build`.

## Documentation Tasks
- [x] Update PRD progress tracking docs after implementation.
- [x] Record the next follow-up step for real Confluence wiring.

## Progress Notes
- This step bridges the frontend from layout-only placeholders to a reusable read model without violating the no-DB rule.

## Review Notes
- The normalization helper is intentionally lightweight and ready to be replaced or extended when live Confluence fetch wiring is added.
