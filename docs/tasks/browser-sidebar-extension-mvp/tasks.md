# Browser Sidebar Extension MVP Tasks

## Implementation Tasks
- [x] Create task documentation before implementation.
- [x] Add isolated `apps/edge-sidebar` workspace package.
- [x] Add MV3 manifest, side panel HTML, React entry, and background worker.
- [x] Implement wiki API search and fallback URL utilities.
- [x] Add local installation and packaging guide.
- [x] Add root convenience build script.
- [x] Replace the MVP header/settings layout with a full-height answer area and bottom-fixed composer.
- [x] Add favicon-derived extension icons.
- [x] Render answer and source document links as new-tab links.
- [x] Change answer flow to show submitted question above the answer and clear the composer after submit.
- [x] Add local-page draggable floating open button through a content script.
- [x] Slide guide pages into the side panel and add a back action to return to search.
- [x] Reorder launcher hover actions so home appears above settings.
- [x] Replace guide iframe with body-only document rendering from `/api/wiki-pages`.
- [x] Add extension-specific scrollbar styling for search and guide panes.
- [x] Move the guide back action to the top-left edge.
- [x] Remove floating launcher background panel and keep only transparent icon buttons.
- [x] Keep hover actions faint and reduce launcher opacity while dragging.
- [x] Avoid persisting a closed panel state when browser close support fails.
- [x] Keep the main floating launcher icon at full opacity while only home/settings slide out on hover.
- [x] Remove visible container-height expansion from the launcher hover model.
- [x] Change search answers from replace-one-result state to appended chat turns.
- [x] Tighten side panel search typography, spacing, and question bubble height.
- [x] Preserve recommended guide source links so they open the slide-in guide view.

## Test Tasks
- [x] Add focused unit tests for URL and response helpers.
- [x] Run extension tests.
- [x] Run extension typecheck.
- [x] Run extension build.
- [x] Run workspace typecheck.
- [x] Inspect generated manifest and icon files.
- [x] Verify build output includes `assets/content-script.js`.

## Documentation Tasks
- [x] Record validation in `test-result.md`.
- [x] Record delivered scope and gaps in `result.md`.
- [x] Update `docs/prd/implementation-status.md`.

## Progress Notes
- Task started as a local PC unpacked-extension MVP.
- Added `apps/edge-sidebar` without modifying `apps/web`.
- The generated extension artifact is `apps/edge-sidebar/dist`.
- Updated the side panel after user load testing: removed top URL/text, moved search composer to the bottom, added top-right home icon, and made links open new tabs.
- Updated the side panel after second user load testing: removed card borders, fixed source link contrast, moved the send button inside the composer, and added a draggable local-page launcher.

## Review Notes
- Browser GUI load-unpacked verification remains manual because this environment cannot open Chrome/Edge extension settings UI.
