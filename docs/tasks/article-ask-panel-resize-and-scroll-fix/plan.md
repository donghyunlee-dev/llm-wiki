# article-ask-panel-resize-and-scroll-fix Plan

## Impacted Areas
- `apps/web/src/ui/pages/ArticleAskPanel.tsx`
- `apps/web/src/styles.css`
- `apps/web/src/ui/pages/ArticleAskPanel.test.tsx`

## Technical Approach

### 1. Scroll-to-top-of-latest-turn instead of scroll-to-bottom
Replace the `[turns]` effect's `scrollTop = scrollHeight` with `scrollTop = container.lastElementChild.offsetTop` (falling back to `scrollHeight` if there's no last child, i.e. defensive/unreachable-in-practice branch). This naturally handles both the "turn added (loading)" and "turn completed (answer arrives)" cases, since both re-render the same last-child DOM node (same `key={turn.id}`) — aligning its top to the container's visible top shows the question and the start of the answer, not the tail end of a long answer.

### 2. Resize: keep the form pinned to its natural size, clip any residual overflow
- Add `shrink-0` to `.article-ask-form` (mirrors the existing `.guide-detail-toc-header` pattern in this codebase) so only `.article-ask-turns` (already `flex-1 min-h-0`) absorbs the resize — the form itself never gets squeezed.
- Add `overflow-hidden` to `.article-ask` (the outer rounded panel) as defense-in-depth: even with `shrink-0`, the form's natural minimum height (button + its own padding) is a few px taller than the resize drag's hardcoded floor (64px) once `.article-ask-turns` has already shrunk to 0 — clipping guarantees the button never visually escapes the panel regardless of the exact pixel math.

## Validation Plan
- `pnpm --filter @sfood/web test`/`typecheck`/`build`.
- New regression test for the scroll behavior (prototype-level DOM property stubs to avoid timing races with React's effect).
- Playwright verification (real browser, not jsdom, since flex/overflow clipping can't be verified through jsdom layout): submit a question, wait for the answer, verify `scrollTop` aligns to the latest turn's top; synthetically drag-resize the panel to its minimum (64px) via dispatched PointerEvents (matching the component's own pointer-based resize implementation) and screenshot to confirm the send button stays visually inside the panel.

## Risks
- The synthetic PointerEvent-based resize test only proves the fix works for this session's manual verification — it's not automated in CI (jsdom can't do real flex/overflow layout). Documented in test-result.md as a manually-verified check, not an automated regression test.
