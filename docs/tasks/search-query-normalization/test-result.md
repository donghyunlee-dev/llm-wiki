# search-query-normalization Test Result

## Scope
- Validate search normalization and synonym expansion for setup guide discovery.

## Environment
- Profile: local workspace
- Database: none
- External dependencies: none for unit validation

## Commands
- `pnpm --filter @sfood/wiki-core test`
- `pnpm --filter @sfood/wiki-core typecheck`
- `pnpm test`
- `pnpm typecheck`
- `pnpm build`

## Results
- PASS: `wiki-core` tests passed after query normalization updates.
- PASS: `wiki-core` typecheck passed.
- PASS: workspace `pnpm test` passed.
- PASS: workspace `pnpm typecheck` passed.
- PASS: workspace `pnpm build` passed.
- PASS: mail-oriented searches now rank Gmail and Microsoft 365 setup guides above generic MCP setup documents.
- PASS: follow-up search requests now carry recent conversation history into the search query and AI prompt.
- PASS: Markdown-like headings, quotes, code blocks, and real numbered steps now render with GPT-like structure in both search and article Ask views.
- PASS: setup/how-to prompts now favor practical, followable instruction blocks over report-style summaries.
- PASS: search loading now shows staged text so users can see progress beyond the spinner.
- PASS: setup/how-to search prompts now explicitly discourage one-paragraph answers.
- PASS: search answers now surface a visible `문서 근거` section with page titles and quotes from the retrieved Confluence pages.
- PASS: search answers now show a dedicated `추천 페이지` section so users can continue reading the source pages.
- PASS: the visible `문서 근거` section has been removed so the search result surface only shows actionable content.
- PASS: search prompt no longer asks the model to create a separate `관련 페이지별 요약` section.
- PASS: answer rendering now uses a shared structured-answer component with copyable code blocks and heading-level styling.
- PASS: recommendation ordering now prefers pages used in the answer or selected by the model before fallback matches.
- PASS: JSON-shaped answer payloads are normalized to the readable answer body before rendering.
- PASS: plain one-paragraph answers are no longer padded with a synthetic fallback heading; the model is pushed to answer more fully instead.
- PASS: `recommendedPages` is converted into `recommendedDocuments` in the search response payload instead of being exposed raw.

## Failure Notes
- Initial implementation missed the direct match because Korean particles stayed attached to Latin/Korean mixed tokens.

## Retest Results
- Retested after adding particle stripping, synonym expansion, and extra search scoring signals.
- Retested after adding a mail-intent boost for email service setup guides.
- Retested after adding a metadata fallback for visible guide-style pages without `wiki.metadata`.
- Retested after adding conversation history forwarding and a markdown-style answer block parser.
- Retested after tightening the answer prompt toward practical, action-first guidance.
- Retested after adding staged search loading text and stronger how-to answer structure constraints.
- Retested after exposing search grounding snippets in the UI and renaming the follow-up page section.
- Retested after hiding the visible evidence section and keeping only clickable recommendation links.
- Retested after removing the related-page-summary instruction and switching code blocks to a copyable renderer.
- Retested after changing recommendation ordering so answer-used pages are shown first.
- Retested after adding JSON-shaped answer normalization.
- Retested after removing fallback heading rendering for plain answers and increasing answer detail constraints.
- Retested after stripping raw `recommendedPages` from the search response payload and converting them to document links.

## Acceptance Criteria Coverage
- `gmail을` now matches Gmail setup pages.
- `mail을` and Outlook/M365-style queries now surface relevant setup guides.
- Mail-focused queries now rank Gmail/Microsoft 365 setup guides above generic MCP setup documents.
- `Gmail MCP Setup` now enters the searchable corpus even when `wiki.metadata` is missing, as long as the title marks it as a visible page type.
- Follow-up questions can now reuse recent conversation context instead of being treated as isolated queries.
- Inline numbered prose stays as prose, while true step-by-step content renders as a list or sectioned block.
- Follow-up setup answers are now steered toward `바로 할 일`, `예시`, and `확인` style blocks instead of long summary paragraphs.
- Search loading now communicates progress with visible stage text rather than a spinner alone.
- Search answers now behave more like a Confluence-backed search experience because the document snippets are visible in the response.
- Search answers now keep the user-facing surface focused on the answer body and clickable page recommendations.
- Search answers now remain closer to the retrieved Confluence pages instead of collapsing into a template summary.
- Search answers now avoid exposing raw JSON payloads in the visible answer body when the model outputs schema-shaped text.
- Search answers now rely on the model to produce a fuller explanation instead of adding a synthetic fallback heading.
- Search answers now expose only converted recommendation documents rather than raw `recommendedPages` arrays.
- Search remains local and deterministic.
