# Search Answer Page Linking Result

## Summary
- Search AI answers now support page-linked actionable items instead of plain string-only steps.
- The search result UI now shows `답변 근거 페이지` from `confluenceData`.
- Each actionable item can render related wiki page links directly below the instruction text.
- The UI keeps a recommendation fallback when the model omits per-item page ids.

## Changed Files
- `packages/wiki-core/src/lib/aiAsk.ts`
- `packages/wiki-core/src/lib/aiAsk.test.ts`
- `apps/web/src/lib/aiSearchResponse.ts`
- `apps/web/src/lib/aiSearchResponse.test.ts`
- `apps/web/src/ui/pages/SearchPage.tsx`
- `apps/web/src/styles.css`

## Remaining Gap
- Public Confluence search candidates still do not reliably include prerequisite environment pages for the Claude CLI install question.
- That is now a retrieval/data-linking problem, not a missing UI linkage problem.
