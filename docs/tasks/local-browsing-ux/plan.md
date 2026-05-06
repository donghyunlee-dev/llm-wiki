# local-browsing-ux Plan

## Approach
- Add a shared document list item component in the web UI.
- Update category pages with client-side controls over already-loaded wiki data.
- Update search pages with grouped result summaries and shared card rendering.
- Route search candidate selection through matching index pages before expanding into detailed documents.
- Cache Confluence `ops` pages separately as hidden AI policy context while keeping visible records unchanged.
- Keep source data and routing contracts unchanged.

## Validation
- `pnpm test`
- `pnpm typecheck`
- `pnpm build`
