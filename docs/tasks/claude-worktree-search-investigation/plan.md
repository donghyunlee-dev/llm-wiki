# claude-worktree-search-investigation Plan

## Summary
- Inspect the search contract and implementation, then verify the target page through the same Confluence-backed read path used by the app.
- Compare page eligibility rules against the actual property payload for page `95780877`, then check whether the search ranking path can surface it for the reproduced query.

## Impacted Modules
- `apps/web/vite.config.ts`
- `packages/wiki-core/src/lib/confluenceClient.ts`
- `packages/wiki-core/src/lib/wikiDataSource.ts`
- `packages/wiki-core/src/lib/wikiDocuments.ts`
- `docs/prd/search-flow-contract.md`

## Architecture Approach
- Keep the investigation read-only.
- Use the existing Confluence data-source and search modules as the source of truth instead of ad hoc logic.

## Data And API Impact
- No contract or persistence changes are planned.
- The task may inspect live/local Confluence-backed page data and content properties for page `95780877`.

## Validation Plan
- Reproduce or inspect the search path for `claude worktree를 설명하세요.`.
- Confirm the target page's `wiki.metadata` property shape and public eligibility.
- Confirm whether the page is present in the normalized corpus and how search ranking treats the query.

## Risks
- Local env access for live Confluence-backed inspection may depend on existing credentials.
- Existing uncommitted changes in search-related files must not be disturbed during the investigation.

## Rollback Considerations
- Read-only investigation with documentation updates only; rollback is limited to removing the task documents if needed.
