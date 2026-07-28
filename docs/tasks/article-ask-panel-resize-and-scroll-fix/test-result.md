# article-ask-panel-resize-and-scroll-fix Test Result

## Automated
| Command | Result |
|---|---|
| `pnpm -r typecheck` | ✅ Pass |
| `pnpm -r test` | ✅ Pass — 316 tests (apps/web 65, +1 new regression test for the scroll fix) |
| `pnpm --filter @sfood/web build` | ✅ Pass |

New test: `ArticleAskPanel.test.tsx > ArticleAskPanel auto-scroll > scrolls to the top of the latest turn, not the container's absolute bottom` — stubs `HTMLElement.prototype.offsetTop`/`scrollHeight` at the prototype level *before* rendering (not per-instance mid-test, which raced against React's effect and was flaky — confirmed by observing an intermittent failure before this fix, verified deterministic across 5 repeated runs after). Asserts `scrollTop` equals the stubbed `offsetTop` (7) and not the stubbed `scrollHeight` (999).

## Manual Playwright Verification (dev server, real browser — not jsdom)
1. Navigated to a real guide article, submitted a question, waited for the real AI answer.
2. Confirmed via `browser_evaluate`: `turnsContainer.scrollTop === lastTurn.offsetTop` (8 === 8) and **not** `scrollHeight` (316) — the panel shows the top of the new answer, not its tail.
3. Simulated the component's own pointer-based resize (dispatched synthetic `pointerdown`/`pointermove`/`pointerup` matching `startResize`'s implementation) to drag the panel down to its clamped minimum (64px).
4. Took a screenshot at 64px height — the send button (paper-plane icon) renders fully inside the panel's rounded border, no visible overflow. Confirmed `getComputedStyle(panel).overflow === "hidden"` took effect.

## Scope Note
Item 4 above is a manual, one-time visual verification for this task — it is not an automated CI check (jsdom does not compute real flex/overflow layout, so this class of bug cannot be regression-tested without a real browser). If this resize logic is touched again in the future, repeat the same Playwright steps.
