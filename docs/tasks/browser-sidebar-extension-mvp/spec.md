# Browser Sidebar Extension MVP Spec

## Problem Statement
- The wiki is available as a website, but the user wants a browser-side companion panel that can be installed locally and opened from the browser toolbar.
- The extension must be developed separately from the existing wiki app so it does not affect the current web runtime.

## Business Context
- Employees may keep the wiki open as a website, but a side panel can make wiki search and AI-style questions available while they work in other browser tabs.
- The first target is local validation on one PC using an unpacked Chrome or Edge extension, before any store or enterprise deployment decision.

## Scope
- Add a separate workspace app for a Manifest V3 browser side panel extension.
- Provide a right-side panel UI with a chat-like question composer.
- Slide selected guide pages into the side panel instead of forcing a new browser tab.
- Render only guide content inside the side panel, not the full wiki app page chrome.
- Keep multiple search turns visible in the side panel until the side panel page is closed/reloaded.
- Match the sidebar visual tone to the wiki web app and use the wiki favicon-derived icon.
- Support local testing against `http://localhost:5173`.
- Call the existing wiki AI search endpoint when available.
- Fall back to opening the wiki search page when API calls fail.
- Render wiki document links so they open in a new browser tab.
- Inject a draggable floating open button into local wiki pages.
- Provide build and load-unpacked instructions.

## Out Of Scope
- No change to `apps/web` behavior or styling.
- No Chrome Web Store or Microsoft Edge Add-ons publishing.
- No enterprise force-install deployment.
- No new authentication flow.
- No production internal wiki domain permission until the final domain is known.

## User Or Operator Scenarios
- A developer runs the existing wiki locally, loads the unpacked extension, opens the side panel, asks a wiki question, and sees an answer or a fallback search link.
- A developer changes the wiki base URL in the side panel settings and uses the same panel against another reachable wiki environment after permissions are configured.

## Acceptance Criteria
- AC1: The repository contains a separate extension package under `apps/edge-sidebar`.
- AC2: The extension builds into a loadable MV3 directory without requiring changes to `apps/web`.
- AC3: The side panel contains a multiline question input where Enter submits and Shift+Enter inserts a line break.
- AC4: The side panel can call `http://localhost:5173/api/wiki/ai/search` and render a useful answer shape.
- AC5: The side panel provides a deterministic fallback link to `/search?q=` when API search is unavailable.
- AC6: Documentation explains local installation and final packaging steps.
- AC7: The toolbar/extension icon uses a favicon-derived red book icon.
- AC8: The answer area fills the panel above a bottom-fixed composer.
- AC9: Answer markdown links and source document links open in a new browser tab.
- AC10: After submitting a search, the input is cleared and the submitted question appears above the answer.
- AC11: Local wiki pages show a right-edge floating icon that can move vertically and open the side panel.
- AC12: Selecting a guide result slides that guide into the side panel, and the side-panel header provides a back action to return to search.
- AC13: The search answer and guide content scroll areas use extension-specific scrollbar styling.
- AC14: The guide pane renders document body content from wiki data instead of embedding the full page URL.
- AC15: Submitting a second question appends a new chat turn instead of replacing the previous answer.
- AC16: Sidebar search typography and the question bubble are compact enough for narrow side panel reading.
- AC17: Recommended guide source links remain clickable and open the in-panel guide slide view.

## Edge Cases
- The local wiki server is not running.
- The AI search endpoint returns an unsupported or unexpected response shape.
- The configured wiki URL has a trailing slash.
- The question is empty or only whitespace.

## Assumptions
- Local validation starts with Chrome or Edge Developer Mode and an unpacked extension.
- The local wiki dev server is available at `http://localhost:5173`.
- Production deployment permissions and internal wiki domain will be decided later.

## Clarifications
- Question: Should this be deployed through managed Chrome or Edge policy now?
- Answer: No. The current task is local PC testing only.
