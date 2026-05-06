# remote-wiki-source Result

## Delivered Scope
- Hardened the remote wiki source boundary.
- Added runtime validation for remote payload shape, category, page fields, metadata fields, fixed space, public visibility, and current page status.
- Kept category/article/search page contracts unchanged by continuing to output normalized `WikiDocument[]`.
- Updated the web provider to prefer `VITE_WIKI_REMOTE_ENDPOINT` while keeping the previous endpoint env as a compatibility fallback.
- Replaced detailed remote load errors in the UI with a generic user-facing Korean failure message.
- Documented remote source runtime env usage in `README.md`.

## Changed Files
- `README.md`
- `apps/web/src/data/WikiDataProvider.tsx`
- `apps/web/src/vite-env.d.ts`
- `packages/wiki-core/src/lib/wikiDataSource.ts`
- `packages/wiki-core/src/lib/wikiDataSource.test.ts`
- `docs/tasks/remote-wiki-source/*`
- `docs/prd/implementation-status.md`

## Key Decisions
- Validation lives in `wiki-core` so UI components cannot bypass the source boundary.
- Remote records outside space `63111172` are rejected, not silently ignored.
- Non-public or non-current records are filtered before normalization.
- A missing production endpoint remains an environment/configuration task, not hard-coded source.

## Open Gaps
- A real production read-only endpoint URL is not available in the repository.
- CORS and hosting behavior still need to be verified against the actual endpoint.
- Metadata graph validation remains a later Phase 5 task.

## Next Steps
- Provide or deploy the actual browser-safe read-only endpoint and set `VITE_WIKI_REMOTE_ENDPOINT`.
- Run the app in `VITE_WIKI_DATA_SOURCE=remote` mode against that endpoint.
- Continue with metadata validation and graph model wiring after live remote loading is verified.
