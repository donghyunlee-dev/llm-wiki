# Home Main Search Guides Only Result

## Delivered Scope
- Simplified the Home screen to a search-first layout followed by a single recommended guide section.
- Removed the visible project examples, FAQ, library, and project design areas from Home.
- Restored the blueprint CTA below the recommended guide list.
- Moved the `사내 지식 위키` label into the centered site header.
- Pinned the starting guide to the top of the recommended guide list and showed five additional guides beneath it.
- Linked the starting guide to the actual `guides/agent-start` route.
- Matched the blueprint and recommended guide widths with the same `max-w-5xl` frame.

## Key Decisions
- Kept the starting guide as a dedicated start route rather than forcing the nav document into a normal category route.
- Kept the guide list data-driven so the top item can stay pinned while the remaining recommendations still come from loaded wiki documents.
- Kept `/guides/start` as a compatibility alias while the Home card uses `/guides/agent-start`.

## Validation Evidence
- `pnpm --filter @sfood/web typecheck`: Passed.
- `pnpm --filter @sfood/web test`: Passed, 8 files / 30 tests.
- `pnpm typecheck`: Passed.

## Remaining Gaps Or Risks
- The Home content fixture still contains the older prototype fields, but they are no longer rendered on the Home screen.
- The dedicated start route depends on a best-effort document match by slug/title/id when the fixed id is not present.
