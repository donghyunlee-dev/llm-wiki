# search-query-normalization Result

## Delivered Scope
- Added mixed-language search token normalization so Korean particles no longer block Gmail/Mail setup lookups.
- Added a small synonym expansion layer for email and setup terminology.
- Added slug/docType scoring hints to help guide/setup pages surface earlier.
- Added a mail-intent boost so Gmail, Microsoft 365, and Outlook setup guides outrank generic MCP setup pages when the question is about mail setup.
- Added a conservative metadata fallback so visible `[Guide]`/`[FAQ]`/`[Blueprint]`/`[Project]`/`[Playbook]` pages without `wiki.metadata` still enter the searchable corpus.
- Added follow-up conversation history to search and Ask requests so underspecified follow-up questions can reuse prior context.
- Added shared answer-block parsing so Markdown-like headings, quotes, code blocks, and real numbered steps render with GPT-like structure instead of flattening into plain prose.
- Tuned the answer prompt toward practical, followable instructions instead of report-like summaries.
- Added staged search loading text so users can see what the AI search flow is doing while it runs.
- Strengthened setup/how-to answer prompts so one-line summaries are discouraged in favor of followable blocks such as `바로 할 일`, `예시`, `확인`, and `주의`.
- Exposed `confluenceData` as a visible `문서 근거` section so search answers show which pages actually supported the response.
- Added a visible `추천 페이지` section so the answer now points the user toward the pages they should read next.
- Removed the visible `문서 근거` section from search results so the UI shows only actionable recommendations and the answer body.
- Removed the `관련 페이지별 요약` instruction so search answers stay focused on the direct synthesis of Confluence pages.
- Replaced plain rendered code blocks with copyable code blocks and level-aware heading sizes through a shared structured-answer renderer.
- Changed recommendation ordering so pages used in the answer and AI-selected pages are shown before generic fallback matches.
- Added answer-text normalization so accidental JSON-shaped assistant output is reduced to the human-readable answer body before rendering.
- Increased answer-density prompting so setup and workflow questions are pushed toward substantive multi-paragraph explanations instead of one-line summaries.
- Converted `recommendedPages` into visible `recommendedDocuments` on the server response and removed the raw page-id array from the payload.

## Changed Files
- `packages/wiki-core/src/lib/wikiDocuments.ts`
- `packages/wiki-core/src/lib/wikiDocuments.test.ts`
- `packages/wiki-core/src/lib/aiAsk.ts`
- `packages/wiki-core/src/lib/aiAsk.test.ts`
- `apps/web/src/ui/structuredAnswer.ts`
- `apps/web/src/ui/structuredAnswer.test.ts`
- `apps/web/src/ui/pages/SearchPage.tsx`
- `apps/web/src/ui/pages/ArticleAskPanel.tsx`
- `apps/web/src/styles.css`
- `docs/prd/implementation-status.md`
- `docs/tasks/search-query-normalization/*`

## Key Decisions
- Keep the search implementation local and deterministic.
- Use a small, domain-specific synonym set instead of broad semantic search.
- Prefer guide/setup documents when the query clearly implies setup/help intent.
- Carry recent conversation history forward when the user is clearly following up on a previous question.
- Show a staged loading progression on the search page instead of a single spinner-only state.
- Treat one-paragraph setup answers as a prompt failure so the model is pushed toward executable instructions.
- Surface the grounding snippets in the UI so search answers behave more like a Confluence-backed version of web search.
- Show answer-used pages ahead of generic fallback pages in the recommendation list.
- Strip JSON-shaped assistant payloads down to their readable answer text before the UI renders them.
- Keep the visible answer focused and detailed without inventing fallback headings that change the answer shape.
- Keep the search response user-facing payload limited to rendered document links rather than raw recommendation page ids.

## Open Gaps
- No full morphological analyzer or semantic embedding index was added.

## Next Steps
- Expand the synonym set only if new false negatives show up in real content.
