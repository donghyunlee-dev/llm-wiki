# guide-claude-code-checkpointing-related-pages Plan

## Summary
- Start the local web app, inspect the live checkpointing guide in a browser-compatible headless run, and compare the rendered DOM against the `/api/wiki-pages` payload.
- Use the comparison to decide whether the malformed markup is already present in Confluence-derived HTML or appears during app rendering.

## Impacted Modules
- `apps/web/vite.config.ts`
- `apps/web/src/ui/pages/ArticleContentRenderer.tsx`
- `packages/wiki-core/src/lib/confluenceReadModel.ts`

## Architecture Approach
- Treat the Confluence payload as the source of truth for the investigation.
- Use browser-rendered DOM output as the final verification point.
- Only change code if the browser comparison proves the app is mis-rendering valid source HTML.

## Data And API Impact
- No schema or API changes are expected for the investigation.
- The only runtime data dependency is the existing `/api/wiki-pages` endpoint.

## Validation Plan
- Start the dev server locally.
- Fetch the live wiki payload and extract the checkpointing guide record.
- Dump the browser-rendered DOM for `/guides/guide-claude-code-checkpointing`.
- Compare the related-pages block in source and rendered output.

## Risks
- The local browser binary may be restricted by the environment.
- The page may be generated from already malformed upstream HTML, which would limit any local fix options.

## Rollback Considerations
- No code rollback is needed if this remains an investigation-only task.
- If a fix is later implemented, keep it isolated to the smallest rendering layer that is actually responsible.
