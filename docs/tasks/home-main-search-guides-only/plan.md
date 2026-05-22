# Home Main Search Guides Only Plan

## Summary
- Replace the current multi-section Home layout with a two-part layout: search first, recommended guides second.
- Derive a pinned starting guide item from the loaded wiki documents and link it to the actual guide route.
- Update the Home styling so the search control is rounded and the supporting sentence sits under the input.
- Restore the blueprint CTA as a secondary section below the guide list.
- Move the `사내 지식 위키` label into the centered site header so the hero stays focused on search.

## Impacted Modules
- `apps/web/src/ui/pages/HomePage.tsx`
- `apps/web/src/styles.css`
- `docs/prd/ui-spec.md`
- `docs/prd/development-prompt-reference.md`
- `docs/prd/implementation-status.md`

## Architecture Approach
- Keep the Home page data-driven through `useWikiData`.
- Build the recommendation list in the page component, with a small helper to identify the preferred starting guide.
- Leave the shared wiki-core content model unchanged.

## Data And API Impact
- No API or persistence changes.
- The pinned starting guide should resolve to a real guide slug already present in the wiki corpus.

## Validation Plan
- Run web package typecheck.
- Run web package tests.
- Run workspace typecheck.
- Add focused render tests for the Home page and the centered header label.

## Risks
- The preferred starting guide document may not exist in some data snapshots, so the helper must degrade gracefully.
- Hiding the other sections changes the Home page contract, so the UI spec and progress docs must be updated together.

## Rollback Considerations
- Reintroduce the removed Home sections and restore the previous recommendation list if the new compact layout is rejected.
