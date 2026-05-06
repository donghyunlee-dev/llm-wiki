# read-only-wiki-core Result

## Delivered Scope
- Added a normalized shared wiki document model.
- Added lightweight Confluence read-model normalization helpers.
- Refactored category, article, and search pages to use shared read-only data.

## Changed Files
- `packages/wiki-core/*`
- `apps/web/src/router.tsx`
- `apps/web/src/ui/pages/*`
- `docs/tasks/read-only-wiki-core/*`

## Key Decisions
- Keep normalization logic in shared modules.
- Keep live Confluence access out of the browser path for now.
- Use local read-only fixtures as the bridge between Home MVP and real upstream integration.

## Open Gaps
- Real Confluence fetch wiring is not connected yet.
- Metadata validation against real upstream pages is not active yet.
- HTML normalization is intentionally lightweight.

## Next Steps
- Wire real Confluence page snapshots into the shared normalization layer.
- Add visibility-aware category/article loading from normalized upstream content.
