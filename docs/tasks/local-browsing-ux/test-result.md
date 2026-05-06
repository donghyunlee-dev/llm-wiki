# local-browsing-ux Test Result

## Commands
- `pnpm test`
- `pnpm typecheck`
- `pnpm build`

## Results
- PASS: `pnpm test`
- PASS: `pnpm typecheck`
- PASS: `pnpm build`
- PASS: Design density retest after typography/radius/spacing changes.
- PASS: Retested after theme icon control and article block renderer changes.
- PASS: Retested after sticky article TOC and document graph block changes.
- PASS: Retested after guide/FAQ/Playbook source filtering, graph parent propagation, and AI Ask endpoint/UI changes.
- PASS: Actual Confluence `/api/wiki-pages` validation returned 78 records with categories `faq` and `guides`, included `Playbook`, and had 0 records outside the allowed scope.
- PASS: Actual Confluence `Playbook` page AI Ask call returned structured keys `answer`, `supportedByContext`, `confluenceData`, `unsupportedClaims`, and `suggestedNextPages`.
- PASS: Actual Confluence search validation for `윈도우에서 gpt에 파일 시스템 mcp 어떻게 설정해?` returned 5 top matches after body-token search.
- PASS: Actual Confluence AI search call for `윈도우에서 gpt에 파일 시스템 mcp 어떻게 설정해?` returned a natural-language answer, 6 guide documents, 3 evidence items, and structured unsupported claims.
- PASS: Retested after Confluence/AI search caching, chatbot loading UI changes, and recommendation list expansion.
- PASS: Actual Confluence `/api/wiki-pages` validation returned 82 records with categories `faq`, `guides`, and `projects`, included `Playbook`, had 0 records outside the allowed scope, and had 0 onboarding records.
- PASS: Actual Confluence category count validation returned `faq: 7`, `guides: 69`, and `projects: 6`.
- PASS: Repeated actual AI search call returned cached response faster, first call 42ms and second call 3ms in the active dev session.
- PASS: Retested after excluding onboarding Q&A pages such as `s3-003` from the remote cache.
- PASS: Actual Confluence `/api/wiki-pages` validation returned 67 records, `s3-003` count 0, onboarding Q&A count 0, and onboarding title/slug count 0.
- PASS: Actual AI search validation for `윈도우에서 gpt에 파일 시스템 mcp 어떻게 설정해?` returned no `s3-003` or onboarding references.
- PASS: Retested after changing search result links to internal wiki detail links and removing visible search evidence.
- PASS: Actual AI search validation returned no Confluence source URLs in recommended documents, no `s3-003` or onboarding references, and an answer that starts as prose rather than a list.
- PASS: Actual AI search validation confirmed exact-target gaps are stated before related MCP setup patterns when the wiki lacks a direct file-system MCP guide.
- PASS: Retested after index-first candidate selection and hidden `ops` policy cache changes.
- PASS: Unit coverage confirms visible search excludes `ops` records while the hidden policy parser can cache them separately.
- PASS: Unit coverage confirms index-first search expands from a matched index page into detailed result candidates instead of returning the index page.
- PASS: Actual local API validation returned 67 visible pages, 0 exposed `ops` pages, and AI search recommendations with no index pages, no `ops` pages, and no Confluence source URLs.
- PASS: Retested after search links were changed to new-tab navigation and search answers were changed to accumulated conversation state.
- PASS: Retested after search input/message typography and question-answer spacing cleanup.
- PASS: Retested after article AI Ask was changed to a fixed bottom conversation dock with icon-only submit and new-tab recommended document links.
- PASS: Retested after article heading rendering was aligned to normalized table-of-contents anchor ids.
- PASS: Retested after explanatory helper copy was removed from search and article AI Ask surfaces.
- PASS: Retested after article question dock spacing, width, and Korean label cleanup.
- PASS: Retested after removing the document-flow section and moving the article question block into the article panel as sticky content.
- PASS: Retested after question placeholder font sizing was explicitly normalized and the article question resize handle was added.
- PASS: Retested after remaining shared site typography classes were moved off broad `text-sm`/`text-base`/`text-xl` scales.
- PASS: Retested after the article question component was returned to bottom-fixed positioning with upward resize behavior.
- PASS: Playwright DOM measurement confirmed article question width `698px`, article width `698px`, width delta `0px`, fixed bottom `12px`, and input/placeholder font size `13px`.
- PASS: Retested after article question was changed to auto-expand from 64px to 280px on submit and scroll to the latest turn.
- PASS: Retested after the separate resize handle element was removed and resize interaction was moved to the article question panel top border.

## Notes
- Playwright was used only for DOM measurement.
- Playwright auto-generated snapshot/log artifacts were deleted; no screenshots, markdown exports, or browser-generated artifacts were retained.
