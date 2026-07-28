# article-ask-panel-resize-and-scroll-fix Tasks

- [x] Fix auto-scroll effect to align to the latest turn's top instead of the container's absolute bottom
- [x] Add `shrink-0` to `.article-ask-form` so resize only shrinks the turns list
- [x] Add `overflow-hidden` to `.article-ask` to clip any residual overflow at the minimum resize size
- [x] Add regression test for the scroll behavior (prototype-level stubs, no timing race)
- [x] Verify both fixes visually via Playwright (real browser, dev server)
- [x] `pnpm test`/`typecheck`/`build` pass
- [x] Write test-result.md, result.md
