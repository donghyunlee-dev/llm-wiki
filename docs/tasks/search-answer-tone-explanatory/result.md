# search-answer-tone-explanatory Result

## Delivered Scope
- Updated the search and AI Ask prompt instructions so answers now aim for a friendly, explanatory, blog-like tone for 초·중급 AI 바이브코딩 users.
- Kept the existing answer structure and recommendation ordering rules intact while making the opening explanation more teaching-oriented.
- Softened the fixed `바로 할 일` / `예시` / `확인` / `주의` / `확인 필요` template so those sections are now optional helpers instead of the default shape.
- Updated the PRD guidance so natural prose is the default and structured sections appear only when they materially help the reader.

## Changed Files
- `packages/wiki-core/src/lib/aiAsk.ts`
- `packages/wiki-core/src/lib/aiAsk.test.ts`
- `docs/prd/ai-ask-prompt-guide.md`
- `docs/prd/search-flow-contract.md`
- `docs/prd/implementation-status.md`
- `apps/web/src/ui/pages/WikiDocumentListItem.tsx`
- `docs/tasks/search-answer-tone-explanatory/spec.md`
- `docs/tasks/search-answer-tone-explanatory/plan.md`
- `docs/tasks/search-answer-tone-explanatory/tasks.md`
- `docs/tasks/search-answer-tone-explanatory/test-result.md`

## Key Decisions
- The prompt now explicitly says to explain the document family and why the page matters before moving into steps.
- Search answers should feel like a friendly guide, not a terse summary.

## Open Gaps
- Live browser verification of the new tone is still pending because the search endpoint may reuse cached AI responses.

## Next Steps
- If needed, run a cache-bypassed live search query to inspect the new tone in rendered output.
