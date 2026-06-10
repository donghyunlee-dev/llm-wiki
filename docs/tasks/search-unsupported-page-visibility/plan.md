# Search Unsupported Page Visibility Plan

## Approach
- Add a shared client-side unsupported-answer predicate in `searchRecommendations.ts`.
- Return empty page sections and skip direct FAQ ranking for fully unsupported answers.
- Apply the same predicate in the dev search API before constructing recommended and related document arrays.
- Document the visibility condition in `search-flow-contract.md`.

## Impacted Areas
- `apps/web/vite.config.ts`
- `apps/web/src/ui/searchRecommendations.ts`
- `apps/web/src/ui/pages/SearchPage.tsx`
- Search recommendation tests
- Search-flow contract

## Validation
- Run focused web tests.
- Run workspace tests and typecheck.
- Reproduce `claude worktree 에 대해 설명해줘` with Playwright MCP.
- Confirm the answer remains visible and all three page-card sections are absent.

## Risks
- Treating every response with unsupported claims as fully unsupported would hide useful cards for partially supported answers. The guard therefore also requires empty `confluenceData`.
