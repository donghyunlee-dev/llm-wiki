# article-ask-panel-resize-and-scroll-fix Result

## Delivered Scope
1. Fixed the Ask panel's auto-scroll to align to the latest turn's top instead of the container's absolute bottom — long answers now start in view instead of requiring a manual scroll-up.
2. Fixed the send button drooping below the panel's rounded edge when manually resized to a small height — `.article-ask-form` now keeps its natural size (`shrink-0`) and `.article-ask` clips any residual overflow (`overflow-hidden`).

## Changed Files
- `apps/web/src/ui/pages/ArticleAskPanel.tsx`
- `apps/web/src/ui/pages/ArticleAskPanel.test.tsx`
- `apps/web/src/styles.css`
- `docs/tasks/article-ask-panel-resize-and-scroll-fix/` (new)

## Key Decisions
- Kept the existing 64px minimum resize height and 0-shrink turns list as-is (not in scope) — fixed the visual overflow via `overflow-hidden` (defense-in-depth) rather than raising the minimum, since raising it would change the resize feature's actual behavior, not just its visual correctness.
- Root-caused both bugs before touching code, per `superpowers:systematic-debugging` — confirmed the scroll bug via live browser evaluation (`scrollTop` vs `offsetTop`/`scrollHeight`) and the resize bug via synthetic pointer-event drag + screenshot, rather than guessing from the bug description alone.

## Validation
See `test-result.md`. `pnpm -r typecheck`/`test` pass (316 tests), `pnpm --filter @sfood/web build` passes, and both fixes were visually confirmed in a real browser via Playwright against the local dev server.
