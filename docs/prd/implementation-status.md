# Implementation Status

## Purpose
This document is the session-to-session progress ledger for the project. It must be updated every time implementation moves forward so a new session can resume in the correct order without depending on memory.

## Current Phase Map
| Phase | Name | Status | Notes |
| --- | --- | --- | --- |
| 0 | Project Setup | Completed | `pnpm` workspace, root config, web app, shared package created |
| 1 | Home Screen Prototype | Completed | Home page implemented from `Development Prompt` and realigned to the prototype-style compact layout |
| 2 | Read-only Wiki Core | In Progress | Remote source contract and validation are in place; actual endpoint value and CORS verification are still pending |
| 3 | Section and Article Pages | In Progress | Category/article pages now read through the shared async wiki source; upstream data wiring is still pending |
| 4 | Search Flow | In Progress | Search now uses the shared async wiki source and can swap snapshot/remote backends; upstream search data wiring is still pending |
| 5 | Metadata and Graph | In Progress | First article graph block now renders prerequisites, next, and related links from metadata |
| 6 | Read-only AI Ask | In Progress | Local dev endpoint, article Ask panel, and policy-aware prompt context return structured AI answer plus Confluence evidence and suggested documents |
| 7 | Operator Workflow | Not Started | No review workflow yet |

## Latest Completed Work
### 2026-04-28
- Created monorepo scaffold with `apps/web` and `packages/wiki-core`.
- Added React/Vite/Tailwind/TypeScript/React Router stack.
- Implemented Home MVP screen with:
  - theme selector
  - hero search block
  - four main entry cards
  - featured guides list
  - featured projects list
  - project design CTA
- Added placeholder routes for guides, projects, library, FAQ, search, and project design.
- Added shared Home content policy validation in `packages/wiki-core`.
- Verified `pnpm install`, `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-28
- Added shared `WikiDocument` read model in `packages/wiki-core`.
- Added lightweight Confluence normalization helpers for sanitization and heading extraction.
- Replaced placeholder category pages with document-backed category pages.
- Added article detail routes for guides, projects, library, and FAQ.
- Updated search to query shared read-only documents instead of hard-coded strings.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-28
- Replaced direct document fixtures with Confluence-shaped raw snapshot fixtures.
- Routed shared wiki documents through the normalization layer instead of hand-authored final models.
- Exposed source snapshot links in article pages to make the current data lineage visible.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-28
- Realigned the Home screen styling to match the `Development Prompt` prototype more closely.
- Replaced the editorial header with a compact brand-and-theme top area.
- Removed the bottom policy-check block from the user-facing Home screen.
- Added a shared wiki data source layer that can load from either local snapshots or a remote endpoint.
- Switched category, article, and search pages to read through the shared async wiki source provider.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-28
- Reduced the main UI typography into a shared three-level scale for hero, section, and body text.
- Standardized page, panel, and section spacing through shared CSS component classes.
- Applied the same visual rhythm to Home, category, article, search, project-design, and loading/error states.
- Changed search results from static text rows to direct document links.
- Rechecked the `Development Prompt` source and removed the mistaken header navigation interpretation.
- Reworked the search page into grouped result sections for guides, projects, FAQ, and library.
- Corrected the Home lower-section typography, link-row interaction, and project-design CTA contrast.
- Added article-level relation panels for prerequisites, next documents, and related documents.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-29
- Promoted the Home top area into a shared site-wide GNB with active section links and theme control.
- Applied the same GNB to internal pages through `AppLayout`.
- Improved category list cards with guide order cues and lightweight metadata chips.
- Reworked the shared GNB into a normal in-flow site header with site name, user info, utility area, and theme control.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-29
- Refined the shared site header so the Home top area reads as a compact header rather than a large top section.
- Removed duplicate/non-actionable header elements: user/environment block, disabled settings control, and secondary brand helper text.
- Kept the Home search area in its existing position while reducing competing card and CTA typography.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-29
- Realigned the Home page to `docs/prd/sfood_wiki_home.jsx`.
- Replaced the separate stacked panel layout with a prototype-style shell and single rounded surface containing header and Home content.
- Rebuilt Home hero, entry cards, list panels, and project-design CTA with shared CSS component classes.
- Simplified the shared header to the prototype density with brand and theme control, while keeping Home route entry through the four cards.
- Verified `pnpm typecheck`, `pnpm test`, and `pnpm build`.

### 2026-04-29
- Hardened the remote wiki source boundary with payload shape validation, fixed space guard `63111172`, and public/current filtering.
- Kept the existing category, article, and search page contracts unchanged by normalizing remote records into the shared `WikiDocument[]` model.
- Updated the web provider to prefer `VITE_WIKI_REMOTE_ENDPOINT` and use generic user-facing load errors.
- Documented remote source runtime env usage in `README.md`.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-29
- Added a Confluence Cloud REST v2 read adapter backed by the env shape in `apps/web/.env.example`.
- Added Vite dev endpoint `GET /api/wiki-pages` so Atlassian credentials stay server-side during local development.
- Local dev now auto-selects `/api/wiki-pages` when `ATLASSIAN_SITE_NAME`, `ATLASSIAN_USER_EMAIL`, `ATLASSIAN_API_TOKEN`, and `CONFLUENCE_SPACE_ID` are configured.
- Verified live Confluence authentication and page listing for space `63111172`.
- Found that the sampled Confluence page properties are empty, so visible remote records remain blocked until `wiki.metadata` content properties are added.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-29
- Verified `.env.local` Confluence settings against space `63111172` (`AI Agent Wiki`) without exposing secret values.
- Inspected current Confluence pages and confirmed no existing `wiki.metadata` content properties were present before the update.
- Added or reconciled `wiki.metadata` content properties across all 130 current Confluence pages, using valid `docType`, `visibility`, `audience`, `status`, `prerequisites`, `next`, and `related` fields.
- Final Confluence metadata coverage: 130 with metadata, 0 missing, 96 public, 34 internal, 19 ops.
- Kept Ops, PRD, analysis, API spec, data model, architecture, migration, and development prompt pages non-public unless separately classified as public content.
- Deferred `/api/wiki-pages` and app read-path validation to a separate development/API session.

### 2026-04-29
- Verified `/api/wiki-pages` returning 130 live Confluence-backed records.
- Confirmed live remote data renders in category, article, and search routes.
- Allowed empty Confluence body HTML for valid index/navigation pages.
- Tightened remote visibility to `current`, `public`, `published`, and non-`ops` records.
- Removed user-facing implementation labels from search and article source UI and added a favicon data URL.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-29
- Added `packages/serverless` with a Lambda-compatible `wikiPagesHandler` for the production equivalent of the local Vite `/api/wiki-pages` endpoint.
- Reused the shared Confluence adapter and `{ pages }` remote source contract from `wiki-core`.
- Added CORS/preflight handling, method rejection, missing-env errors, and upstream failure mapping.
- Documented production endpoint env and `VITE_WIKI_REMOTE_ENDPOINT` wiring in `README.md`.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-29
- Stopped AWS/deployment work and continued with local-only browsing UX improvements.
- Added a shared document list item component for category and search result cards.
- Added category page list search, audience filter, document type filter, sort control, and result counts.
- Updated search results to show grouped counts and suppress empty groups before useful results.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-29
- Reworked the shared visual density toward a conventional wiki/documentation surface.
- Reduced page and Home typography scale, section padding, card padding, and oversized rounded corners.
- Replaced pill-like metadata treatment with compact rectangular chips.
- Kept the Home search position intact while making surrounding sections less landing-page-like.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-29
- Replaced the text-based theme segmented control with compact icon buttons.
- Further reduced shared title and Home card typography for a denser wiki reading surface.
- Added article HTML block rendering for headings, paragraphs, lists, code blocks, tables, quotes, and fallback fragments.
- Removed direct article body `dangerouslySetInnerHTML` usage from `ArticlePage` in favor of the block renderer boundary.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-29
- Converted the article table of contents into a sticky side navigation so it remains useful while reading long documents.
- Reworked article relation links into a single `문서 흐름` graph block for prerequisites, next documents, and related documents.
- Moved Phase 5 Metadata and Graph to In Progress with the first visible graph UX pass.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-30
- Unified form/control typography so search inputs and select controls inherit the same body font scale.
- Limited remote-readable Confluence pages to guides, FAQ, and the `Playbook` page.
- Propagated Confluence `parentId` into the read model and added graph reference validation helpers.
- Added a local read-only AI Ask endpoint using OpenAI Responses API structured output.
- Added an article Ask panel that renders AI answer, Confluence evidence, unsupported claims, and suggested documents.
- Verified actual Confluence `/api/wiki-pages`: 78 records, only `faq` and `guides`, `Playbook` included, 0 records outside allowed scope.
- Verified actual Confluence `Playbook` AI Ask call returned the required structured response shape.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-30
- Fixed natural-language search misses by scoring title, summary, headings, and body HTML tokens instead of requiring an exact full-query substring.
- Added a search follow-up Ask panel so users can continue the query against the most relevant matched document.
- Verified the query `윈도우에서 gpt에 파일 시스템 mcp 어떻게 설정해?` against actual Confluence data and confirmed top matches are returned.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-30
- Reworked the search page into a chatbot-style result screen with only the shared top navigation above the content.
- Added `/api/wiki/ai/search` to analyze the top Confluence search results with OpenAI structured output.
- Changed search UI to show the user question, a natural-language AI answer, a compact guide-document summary, Confluence evidence, and unsupported claims.
- Removed the previous grouped result sections and follow-up wording from the search page.
- Verified the same real Confluence query returned an AI answer, 6 guide links, 3 evidence items, and structured unsupported claims.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-30
- Added in-memory caching for visible Confluence records/documents in the local dev API.
- Added in-memory caching for repeated AI search answers by normalized question.
- Reduced AI search latency by limiting top search context, trimming document text, setting an output token cap, and lowering reasoning effort.
- Added chatbot loading feedback with spinner, progress bar, and status text.
- Improved AI answer readability by rendering paragraphs and bullet/numbered lists as structured UI blocks.
- Cleared the floating search input after submit and replaced the text submit button with an icon button.
- Verified repeated actual AI search calls returned cached responses faster in the active dev session.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-30
- Expanded the remote readable/searchable policy to guides, projects, FAQ, and the `Playbook` page.
- Excluded onboarding pages from the remote page cache before search and AI answer generation.
- Changed search recommendations so the answer can show project and FAQ matches as well as guide matches.
- Verified actual Confluence `/api/wiki-pages`: 82 records, categories `faq`, `guides`, and `projects`, `Playbook` included, 0 records outside allowed scope, and 0 onboarding records.
- Verified actual category counts: `faq: 7`, `guides: 69`, and `projects: 6`.
- Verified actual AI search repeated-call cache: first call 42ms and second call 3ms in the active dev session.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-30
- Found that onboarding Q&A pages such as `s3-003` were still entering search because they were categorized as `guides` and did not include `onboarding` in title or slug.
- Excluded onboarding Q&A pages matching the `s*-***` title/slug pattern from the remote page cache.
- Restarted the local dev server to clear in-memory Confluence and AI search caches.
- Verified actual Confluence `/api/wiki-pages`: 67 records, `s3-003` count 0, onboarding Q&A count 0, and onboarding title/slug count 0.
- Verified actual AI search for `윈도우에서 gpt에 파일 시스템 mcp 어떻게 설정해?` no longer returns `s3-003` or onboarding references.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-30
- Changed search result recommendation links to internal wiki detail routes instead of Confluence source URLs.
- Removed the visible search evidence section from the chatbot-style search result screen.
- Removed the article page source-document link from the wiki detail header.
- Added AI-selected `recommendedPages` to the search response so displayed recommendations are chosen from the AI-grounded result set rather than raw token rank alone.
- Tightened AI search answer instructions so prose is the default, lists are used only for list-shaped content, and missing exact-target coverage is stated before related setup guidance.
- Verified actual AI search for `윈도우에서 gpt에 파일 시스템 mcp 어떻게 설정해?`: no `s3-003`, no onboarding references, internal-only recommendation hrefs, no source URLs, prose-first answer, and exact-target gap stated first.
- Verified `pnpm typecheck` and `pnpm build`.

### 2026-04-30
- Changed search candidate selection to score matching Confluence index pages first, then expand into detailed documents for AI search context and recommendations.
- Kept index pages out of recommended search results by using them as routing candidates rather than answer documents.
- Added a hidden `ops` policy cache path for Confluence `docType: ops` pages; these pages remain excluded from `/api/wiki-pages`, search results, and recommendations.
- Added AI search prompt context for hidden ops policy documents with instructions not to cite, summarize, recommend, or expose them.
- Verified actual local API search: 67 visible pages, 0 exposed `ops` pages, and no index/ops/sourceUrl values in recommended AI search documents.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-30
- Changed search result document links to open internal wiki detail pages in a new tab so the active search page does not disappear.
- Removed the secondary explanatory copy below the search loading progress bar.
- Changed the search page to keep previous question/answer turns in the current session when the user submits another search.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-30
- Normalized search input placeholder, user question, assistant answer, loading text, and search summary typography to the compact shared `13px` UI scale.
- Added explicit spacing between each search question and answer turn so chatbot results stay readable.
- Restarted the local dev server on `http://127.0.0.1:5173/`.
- Verified `pnpm typecheck` and `pnpm build`.

### 2026-04-30
- Reworked article AI Ask into a fixed bottom conversation dock so document content and generated answers remain visible together.
- Changed article AI Ask submit to an icon-only control and kept previous question/answer turns in the current document session.
- Rendered article AI Ask answers as structured paragraphs/lists and opened recommended internal wiki documents in a new tab.
- Fixed article table-of-contents anchors by applying normalized heading ids to rendered Confluence heading blocks.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-30
- Removed explanatory helper copy from the search empty state, search loading state, article AI Ask header, article AI Ask loading state, and document graph header.
- Verified the removed helper phrases no longer appear in app source.

### 2026-05-04
- Preserved search candidate relevance order instead of flattening by category.
- Removed prior AI answer prose from follow-up search query rewriting.
- Narrowed index-first expansion to linked or directly relevant detail pages instead of broad same-category fallbacks.
- Added richer wiki-style answer rendering for inline links, markdown tables, info/warning callouts, and collapsible code blocks.
- Added a visible document-based answer header to the search result screen.
- Verified `pnpm --filter @sfood/wiki-core test -- src/lib/wikiDocuments.test.ts src/lib/aiAsk.test.ts`, `pnpm --filter @sfood/web test -- src/ui/structuredAnswer.test.ts`, `pnpm typecheck`, `pnpm build`, and `pnpm test`.
- Started the local dev server successfully at `http://localhost:5173/`.
- Added staged loading text to the search flow so users can see the current search step instead of only a spinner.
- Strengthened setup/how-to answer prompts so search answers are pushed toward executable blocks rather than one-line summaries.
- Kept the shared markdown-style answer renderer in place so headings, lists, quotes, and code blocks remain readable when the model emits structured output.
- Surfaced the Confluence grounding snippets in search results so users can see which pages supported the answer.
- Renamed the follow-up document section to `추천 페이지` to better match the Confluence-search workflow.
- Removed the `관련 페이지별 요약` instruction from the search prompt so the answer stays focused on synthesis from the retrieved Confluence pages.
- Added a shared structured-answer renderer with copyable code blocks and heading-level styling.
- Changed recommendation ordering so answer-used pages appear ahead of generic fallback matches.
- Normalized JSON-shaped assistant answer payloads so the visible answer body no longer leaks raw schema text.
- Removed the synthetic `핵심` fallback heading and instead pushed the model toward fuller explanatory answers.
- Converted `recommendedPages` to visible `recommendedDocuments` on the search response and removed the raw page-id array from the user-facing payload.
- Normalized the search API cache and server-side answer extraction so stale JSON-shaped answer artifacts no longer leak into the rendered UI for repeated searches.
- Verified in-browser on `http://localhost:5173/search` that `Windows에서 Codex CLI를 설치하는 최소 절차는?` and `윈도우에 codex를 설치하는 방법은?` render without raw JSON leakage and show the structured answer header, warning callout, and recommendation links.
- Hid the visible `핵심 인용` and `지원되지 않는 항목` sections from the search answer surface so those details remain internal to answer generation.
- Adjusted the search answer guidance so relevant wiki page links can appear inline in the answer body when a document directly supports a step or detail, while the detailed page still opens in a new tab.
- Promoted standalone terminal commands in search answers into copyable code blocks so install steps like `npm install -g @openai/codex` are easier to reuse.
- Removed the extra answer explanation header section from the search result screen and tightened the code block component toward a compact GitHub/Notion-style card with improved line-number alignment.
- Removed the visible `문서 근거` section from search results so only the answer body and clickable recommendations remain on screen.
- Verified `pnpm typecheck` and `pnpm build`.

### 2026-04-30
- Renamed the article `AI Ask` panel to Korean `문서 질문`.
- Reduced article question dock width, max height, padding, and reserved bottom spacing so it aligns more closely with the article layout and no longer leaves excessive space below document flow.
- Verified `pnpm typecheck` and `pnpm build`.

### 2026-04-30
- Removed the article document-flow section because the feature identity was not yet defined.
- Moved the article question panel from viewport-fixed placement into the article panel as full-width sticky bottom content, eliminating the remaining gap below the article body and aligning it with the document width.
- Verified no article graph references remain in the web source.
- Verified `pnpm typecheck` and `pnpm build`.

### 2026-04-30
- Explicitly normalized search and article question placeholder font sizing to the shared `13px` input scale.
- Added a draggable top resize handle to the article question component so the answer area can be expanded upward.
- Verified `pnpm typecheck` and `pnpm build`.

### 2026-04-30
- Normalized remaining shared site typography away from broad Tailwind `text-sm`/`text-base`/`text-xl` defaults toward fixed compact pixel sizes.
- Added global form-control and placeholder font-size enforcement so search and article question inputs use the same `13px` UI scale.
- Verified no broad `text-sm`/`text-base`/`text-lg`/`text-xl` utilities remain in `apps/web/src/styles.css`.
- Verified `pnpm typecheck` and `pnpm build`.

### 2026-04-30
- Reworked the article question component back to bottom-fixed positioning.
- Kept the bottom edge anchored during resize so dragging the handle expands the question/answer area upward instead of pushing page content downward.
- Verified `pnpm typecheck` and `pnpm build`.

### 2026-04-30
- Adjusted article question panel width to match the article panel instead of the viewport.
- Verified with Playwright DOM measurement: article question width `698px`, article width `698px`, width delta `0px`, bottom fixed at `12px`, and input/placeholder font size `13px`.
- Deleted Playwright auto-generated snapshot/log artifacts after measurement.

### 2026-04-30
- Changed article question behavior so it starts as a compact 64px input bar and automatically expands to 280px when the user submits a question.
- Added auto-scroll-to-latest behavior for the article question conversation area.
- Verified `pnpm typecheck` and `pnpm build`.

### 2026-04-30
- Removed the separate article question resize handle element.
- Made the top border area of the article question panel itself act as the height resize handle so resizing does not consume layout height or push the input row down.
- Verified `pnpm typecheck` and `pnpm build`.

### 2026-05-04
- Added a hidden `policy` document path to the Confluence read model and kept it out of visible wiki results.
- Built compact policy summary documents with in-memory relevance scoring so Ask flows can reference policy without loading full page bodies into the prompt.
- Threaded selected policy context into both document Ask and search Ask prompt construction while preserving the separate hidden `ops` context path.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-05-04
- Normalized mixed-language search tokens by stripping common Korean particles from query terms.
- Added a small email/setup synonym expansion layer so `gmail`, `mail`, `outlook`, and `m365` style queries can surface the intended setup guides.
- Boosted slug and docType signals in search scoring and added regression tests for mixed-language queries.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-05-04
- Added a mail-intent ranking boost so Gmail and Microsoft 365 setup guides outrank generic MCP setup documents for mail-focused queries.
- Confirmed in-browser search now surfaces the mail setup guides instead of generic MCP docs for `mail을 보내는 mcp는 어떻게 설정해?`.
- Added a conservative metadata fallback so visible guide-style pages without `wiki.metadata` still enter the searchable corpus.
- Confirmed in-browser search now surfaces the Gmail setup page `84705630` and Microsoft 365 setup page `83919146` as recommendations.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-05-04
- Removed the overly strict search-answer length cap and told the model to use Markdown-style structure for readable answers.
- Added a shared markdown-style answer-block parser so headings, quotes, code blocks, and real step-by-step lists render cleanly in both search and article Ask views.
- Forwarded recent conversation history through search and Ask requests so follow-up questions reuse the previous context.
- Tuned the answer prompt toward practical, action-first guidance so setup questions read like instructions instead of summaries.
- Verified `pnpm --filter @sfood/web test`, `pnpm --filter @sfood/wiki-core test`, `pnpm typecheck`, and `pnpm build`.

### 2026-05-04
- Added a repeatable generic-vs-wiki benchmark script for eight representative questions and recorded a `similarity` score against a 90-point completion target.
- Expanded search retrieval for broad planning questions so the answer context can combine top matches across the corpus instead of staying tied to a single narrow index path.
- Added a typo-aware Gmail/email intent boost so `gamil`-style queries can land on email-related setup guides instead of generic MCP pages.
- Latest benchmark result reached `79.5 / 100` average wiki similarity, which is improved but still below the requested `90 / 100` threshold.
- Verified `pnpm benchmark:search` after the prompt and retrieval tuning.

## Current Working State
- The project is inside Phase 2.
- `wiki.metadata` content properties have been added to every current Confluence page in space `63111172`.
- Public visibility is currently further narrowed by application policy to guide, project, FAQ, and `Playbook` pages, with onboarding pages excluded.
- `/api/wiki-pages` now returns live Confluence-backed guide/project/FAQ/Playbook records and category/article/search routes render from remote data.
- A production serverless handler equivalent to the Vite dev middleware exists in `packages/serverless`, but AWS/deployment work is paused by request.
- The latest local browsing UX pass is complete for category/search result scanning.
- The latest design pass reduces oversized fonts, spacing, and rounded section styling across Home, category, search, and article surfaces.
- Article body rendering now has a first block/component boundary for Confluence HTML.
- Article pages now have sticky table-of-contents navigation.
- Article pages now include a fixed bottom read-only AI Ask conversation panel backed by structured OpenAI responses.
- Search now checks matching index pages before expanding into detailed body-token matches.
- Search results now render as a chatbot-style answer page with recommended document links opening internal wiki detail routes.
- Search result links now open in a new tab and the current search session keeps previous turns while submitting follow-up searches.
- Confluence `ops` pages are cached as hidden policy context for AI search but are not exposed as visible wiki records.
- Confluence `policy` pages are cached as hidden policy context and are selected through compact prompt summaries before AI answer generation.
- Local search now caches Confluence and repeated AI search responses and shows progress while waiting.
- The next implementation target is policy-aware AI Ask quality tuning against actual Confluence pages and parent/ancestor breadcrumb refinement.
- The Home screen should follow `docs/prd/sfood_wiki_home.jsx` as the approved visual baseline unless explicitly redesigned.
- The shared header should match the prototype density: compact brand plus theme control inside the app surface.
- The app is buildable and viewable locally with `pnpm dev` or `pnpm preview`.
- Local Confluence env values are now supported through the Vite dev endpoint; production should use the serverless handler with server-side Atlassian env values.

## Resume Checklist For Next Session
1. Read `architecture.md`, `ui-spec.md`, and this file.
2. Keep the no-separate-DB rule intact.
3. Continue from the shared read-only wiki model rather than rebuilding page fixtures locally.
4. Use the existing snapshot/remote source boundary rather than bypassing it.
5. Keep using `/api/wiki-pages` for local remote-mode verification; use `packages/serverless` for the production endpoint path.
6. Do not break the current Home baseline while replacing fixture-backed category/article data.
7. Keep AWS/deployment work paused unless explicitly resumed.
8. Continue with local AI Ask quality tuning against actual Confluence pages before broader feature expansion.

## Rules For Updating This File
- Update the phase table whenever a phase starts or completes.
- Append a dated entry under `Latest Completed Work` after every meaningful implementation step.
- Keep `Current Working State` aligned with the real next step.
