# Browser Sidebar Extension MVP Test Result

## Scope
- Validate the isolated browser side panel extension package, build output, and monorepo compatibility.

## Environment
- Profile: local development
- Database: none
- External dependencies: local wiki dev server expected at `http://localhost:5173` for manual runtime testing

## Commands
- `pnpm install`
- `pnpm --filter @sfood/edge-sidebar test`
- `pnpm --filter @sfood/edge-sidebar typecheck`
- `pnpm --filter @sfood/edge-sidebar build`
- `pnpm test`
- `pnpm typecheck`
- MCP Playwright: `browser_navigate("http://localhost:5173")`
- MCP Playwright: page DOM evaluation for `#sfood-ai-wiki-launcher`
- `sed -n '1,200p' apps/edge-sidebar/dist/manifest.json`
- `find apps/edge-sidebar/dist -maxdepth 2 -type f | sort`
- `file apps/edge-sidebar/dist/icons/icon-16.png apps/edge-sidebar/dist/icons/icon-32.png apps/edge-sidebar/dist/icons/icon-48.png apps/edge-sidebar/dist/icons/icon-128.png`

## Results
- PASS: workspace install completed after network-enabled retry.
- PASS: extension unit tests passed, 1 file / 3 tests.
- PASS: extension typecheck passed.
- PASS: extension build passed and generated `dist/manifest.json`, `dist/sidepanel.html`, `dist/assets/background.js`, `dist/assets/sidepanel.js`, and `dist/assets/sidepanel.css`.
- PASS: workspace `pnpm test` passed across runnable packages.
- PASS: workspace `pnpm typecheck` passed across runnable packages.
- PASS: generated manifest contains `manifest_version: 3`, `sidePanel` permission, `side_panel.default_path`, background service worker, extension/action icons, and `"<all_urls>"` host/content-script scope.
- PASS: generated icon files are valid PNG images at 16, 32, 48, and 128px.
- PASS: generated dist includes `assets/content-script.js`.
- PASS: launcher state now uses shared extension storage and the side panel action supports explicit open/close toggling.
- PASS: launcher hover mode now exposes separate home and settings buttons without a title label.
- PASS: side panel exposes a recovery control that clears the hidden launcher flag.
- PASS: guide navigation now stays in the side panel and slides the right pane into view, with a back action that returns to search.
- PASS: launcher hover expansion now places home above settings.
- PASS: settings popover CSS now respects the `hidden` attribute and no longer appears on page load.
- PASS: popover buttons no longer inherit absolute positioning from the launcher icon buttons.
- PASS: launcher book icon now keeps its visible 32px artwork size.
- PASS: hidden launcher state leaves a visible right-edge handle after page refresh.
- PASS: selected guide links are resolved through `/api/wiki-pages` and rendered as body-only guide content instead of an iframe.
- PASS: search answer and guide panes use extension-specific thin scrollbar styling.
- PASS: guide back action is positioned at the top-left edge.
- PASS: launcher now renders inside Shadow DOM to isolate button/icon/popup CSS from host pages.
- PASS: launcher main book button has pointer drag logic and stores the Y position in `chrome.storage.local`.
- PASS: top/bottom settings now update launcher position immediately without page reload.
- PASS: floating launcher no longer renders a white background panel behind the icons.
- PASS: home/settings hover actions remain faintly visible and the launcher opacity stays reduced while dragging.
- PASS: side panel close failures no longer persist a false closed state.
- PASS: search turns now append to the side panel conversation instead of replacing prior answers.
- PASS: question bubble and answer typography were tightened for side panel width.
- PASS: duplicate source-title normalization now keeps `/guides/...` links so source links can open the slide-in guide pane.
- PASS: `confluenceData.pageId` now becomes `/wiki/{pageId}` source links.
- PASS: guide document loading now accepts nested `/api/wiki-pages` records with `{ slug, page: { id, title, bodyHtml } }`.
- PASS: main floating launcher icon remains at full opacity.
- PASS: hover expansion now slides home/settings out from behind the main icon instead of expanding a visible container.
- PASS: home/settings hover actions render at about 50% opacity.
- PASS: content-script startup and launcher actions now catch `Extension context invalidated` failures and tear down the stale launcher instead of surfacing an uncaught rejected promise.
- PASS: hidden launcher mode now keeps the main icon visible and clickable instead of translating it almost fully off-screen.
- PASS: launcher open/close no longer depends on the persisted `sfoodWikiSidebar.panelOpen` extension-storage value.
- PASS: side panel open/close now uses a browser-compatible fallback path when `chrome.sidePanel.close()` is unavailable or global-panel closing needs `windowId`.
- PASS: MCP Playwright opened the local wiki page at `http://localhost:5173`.
- LIMITATION: MCP Playwright browser context did not have the unpacked extension loaded, so `#sfood-ai-wiki-launcher` was not present in that MCP browser. Installed-extension visual verification still needs the user's Chrome/Edge extension page refresh.
- LIMITATION: if the unpacked extension is refreshed while an old page tab stays open, Chrome/Edge can still keep the stale content script alive until that page is refreshed. The new guard suppresses the uncaught rejection, but the page still needs a manual reload to bind the new extension context.

## Failure Notes
- Initial `pnpm --filter @sfood/edge-sidebar test`, `typecheck`, and `build` failed because the new workspace package had no linked `node_modules`.
- Initial `pnpm install` hit DNS failures against `registry.npmjs.org`; the command completed from cache for the first package link pass, then failed when new type packages were added.
- A network-enabled `pnpm install` retry completed successfully.
- Browser GUI load-unpacked verification was not executed in this terminal environment. The manual path is documented in `apps/edge-sidebar/README.md`.

## Retest Results
- After dependency declarations and install retry, all extension and workspace checks passed.
- After launcher popover and visibility fixes, `pnpm --filter @sfood/edge-sidebar test`, `pnpm --filter @sfood/edge-sidebar typecheck`, `pnpm --filter @sfood/edge-sidebar build`, `pnpm test`, and `pnpm typecheck` passed.
- After guide body rendering and scrollbar fixes, `pnpm --filter @sfood/edge-sidebar test`, `pnpm --filter @sfood/edge-sidebar typecheck`, `pnpm --filter @sfood/edge-sidebar build`, `pnpm test`, and `pnpm typecheck` passed.
- After Shadow DOM launcher and drag restoration, `pnpm --filter @sfood/edge-sidebar test`, `pnpm --filter @sfood/edge-sidebar typecheck`, `pnpm --filter @sfood/edge-sidebar build`, `pnpm test`, and `pnpm typecheck` passed.
- After transparent launcher visual changes and panel toggle state handling, `pnpm --filter @sfood/edge-sidebar test`, `pnpm --filter @sfood/edge-sidebar typecheck`, `pnpm --filter @sfood/edge-sidebar build`, `pnpm test`, and `pnpm typecheck` passed.
- After appended chat turns, compact typography, and source-link recovery, `pnpm --filter @sfood/edge-sidebar test`, `pnpm --filter @sfood/edge-sidebar typecheck`, `pnpm --filter @sfood/edge-sidebar build`, `pnpm test`, and `pnpm typecheck` passed.
- After launcher expansion model correction and toggle response cleanup, `pnpm --filter @sfood/edge-sidebar test`, `pnpm --filter @sfood/edge-sidebar typecheck`, `pnpm --filter @sfood/edge-sidebar build`, `pnpm test`, and `pnpm typecheck` passed.
- After `pageId` source-link support and nested wiki-page record parsing, `pnpm --filter @sfood/edge-sidebar test`, `pnpm --filter @sfood/edge-sidebar typecheck`, `pnpm --filter @sfood/edge-sidebar build`, `pnpm test`, and `pnpm typecheck` passed.
- After stale extension-context guards were added to the content script, `pnpm --filter @sfood/edge-sidebar test`, `pnpm --filter @sfood/edge-sidebar typecheck`, `pnpm --filter @sfood/edge-sidebar build`, `pnpm test`, and `pnpm typecheck` passed.
- After hidden-launcher positioning was corrected, `pnpm --filter @sfood/edge-sidebar test`, `pnpm --filter @sfood/edge-sidebar typecheck`, `pnpm --filter @sfood/edge-sidebar build`, `pnpm test`, and `pnpm typecheck` passed.
- After `panelOpen` storage dependency was removed from launcher toggling, `pnpm --filter @sfood/edge-sidebar test`, `pnpm --filter @sfood/edge-sidebar typecheck`, `pnpm --filter @sfood/edge-sidebar build`, `pnpm test`, and `pnpm typecheck` passed.
- After side panel close/open compatibility fallback was added, `pnpm --filter @sfood/edge-sidebar test`, `pnpm --filter @sfood/edge-sidebar typecheck`, `pnpm --filter @sfood/edge-sidebar build`, `pnpm test`, and `pnpm typecheck` passed.

## Acceptance Criteria Coverage
- AC1: Covered by `apps/edge-sidebar`.
- AC2: Covered by `pnpm --filter @sfood/edge-sidebar build` and dist manifest inspection.
- AC3: Covered by side panel composer implementation. Manual browser behavior should be confirmed after loading the unpacked extension.
- AC4: Covered by `requestWikiSearch()` contract implementation and API payload check against `apps/web/vite.config.ts`.
- AC5: Covered by `buildWikiSearchUrl()` unit test and error fallback UI.
- AC6: Covered by `apps/edge-sidebar/README.md`.
- AC7: Covered by generated PNG icons and manifest inspection.
- AC8: Covered by updated side panel layout CSS. Manual browser reload should confirm the visual result.
- AC9: Covered by markdown link rendering, source document anchors, and `resolveWikiHref()` unit tests.
- AC10: Covered by side panel state update on submit. Manual browser reload should confirm the visual result.
- AC11: Covered by content script and manifest output. Manual browser reload should confirm floating button behavior.
- AC12: Covered by side panel slide-view implementation. Manual browser reload should confirm guide body rendering and back action behavior.
- AC13: Covered by `styles.css` scrollbar rules. Manual browser reload should confirm visual scrollbar styling.
- AC14: Covered by `requestWikiDocumentByHref()` and side panel guide body rendering.
- AC15: Covered by `ConversationEntry[]` append flow in `main.tsx`.
- AC16: Covered by compact search typography and question bubble CSS.
- AC17: Covered by source href preference regression test in `wikiClient.test.ts`.
