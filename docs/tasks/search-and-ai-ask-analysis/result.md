# search-and-ai-ask-analysis Result

## Delivered Scope
- Analyzed the current main search path, article `AI Ask` path, hidden policy-context path, and Home-page section-linking state.
- Consolidated the main implementation gaps into a staged roadmap so the next work can proceed in the right order.

## Changed Files
- `docs/tasks/search-and-ai-ask-analysis/spec.md`
- `docs/tasks/search-and-ai-ask-analysis/plan.md`
- `docs/tasks/search-and-ai-ask-analysis/tasks.md`
- `docs/tasks/search-and-ai-ask-analysis/test-result.md`
- `docs/tasks/search-and-ai-ask-analysis/result.md`
- `docs/prd/implementation-status.md`
- `docs/prd/development-plan.md`

## Key Decisions
- Treat the current retrieval path as lexical search with heuristic expansion, not as verified semantic search.
- Separate search completion work into retrieval/policy/API/UI/Home-linking phases instead of mixing them into one large UI pass.
- Keep Home-page page-level linking after search recommendation quality becomes stable enough to reuse.

## Current State Summary
- Search retrieval:
  - `packages/wiki-core/src/lib/wikiDocuments.ts` ranks documents with normalized token scoring over title, summary, headings, body, slug, and docType.
  - The ranking includes Korean-particle stripping, small synonym groups, and index-first scope expansion.
  - No embedding index, vector store, reranker, or semantic similarity model exists in the current repository.
- Search answer generation:
  - `apps/web/vite.config.ts` exposes `POST /api/wiki/ai/search` only in the local dev server.
  - The API selects top visible documents, injects hidden policy context, then asks OpenAI for structured JSON output.
  - The server converts `recommendedPages` into `recommendedDocuments`, but still duplicates the same list into `guideDocuments`.
  - Retrieval quality was later improved by expanding AI search context through graph-connected documents instead of relying only on the first lexical top-N pages.
- Policy handling:
  - `packages/wiki-core/src/lib/wikiDataSource.ts` parses hidden `policy` and `ops` documents separately from visible wiki pages.
  - `packages/wiki-core/src/lib/aiAsk.ts` ranks policy summaries and injects them into both `AI Ask` flows.
  - The repository does not yet contain dedicated evaluation proving that policy context changes answers correctly for policy-sensitive queries.
- Search UI:
  - `apps/web/src/ui/pages/SearchPage.tsx` is a chat-style surface, not a wiki/notion/confluence reading page.
  - `StructuredAnswerView` can render headings, lists, callouts, tables, code, and links, but the visible layout is still conversational rather than page-like.
  - Visible evidence and unsupported-claim sections were intentionally hidden, which improves cleanliness but reduces auditability.
- Home page:
  - `apps/web/src/ui/pages/HomePage.tsx` and `packages/wiki-core/src/lib/homeContent.ts` still use static hero copy, featured lists, and entry-card targets.
  - Featured guide/project rows do not resolve to concrete article pages.
  - The Home screen does not use a normalized `GET /api/wiki/home` response yet.
- Target mismatch:
  - `docs/prd/api-spec.md` defines `GET /api/wiki/home` and `GET /api/wiki/search?q=`, but the implemented runtime is centered on `/api/wiki-pages`, `POST /api/wiki/ai/ask`, and `POST /api/wiki/ai/search`.
  - The latest benchmark in `docs/tasks/search-quality-and-answer-rendering/benchmark-results.md` is `79.5 / 100`, below the documented `90 / 100` target.

## Retrieval Gap Update
- The earlier visible corpus excluded `library` pages from remote search, which made dependency/setup references easier to miss even when relevant Confluence pages existed.
- The search path also relied too heavily on the first lexical top matches. This made it weak at following document-to-document connections such as parent, prerequisite, next, and related pages.

## Staged Roadmap
- Phase 1. Baseline and contract cleanup
  - Freeze representative search questions, expected target pages, and pass/fail criteria.
  - Remove or rename misleading terms such as `semantic` where the implementation is still lexical.
  - Decide whether `guideDocuments` is still needed; if not, remove the duplicate response field.
  - Align PRD/API docs with the actual local runtime or implement the missing normalized search/home APIs.
- Phase 2. Retrieval hardening
  - Add deterministic evaluation cases for false positives, false negatives, and follow-up questions.
  - Rework ranking so category intent, exact title hits, heading matches, and graph context are scored more explicitly.
  - Verify whether index-first expansion suppresses useful detail pages or over-expands into weak matches.
  - Add repeatable tests for `policy-sensitive`, `broad-planning`, and `troubleshooting` query classes, which are currently the weakest benchmark areas.
- Phase 3. Policy-grounding verification
  - Create policy-sensitive benchmark questions where the non-policy answer would be wrong or unsafe.
  - Log which policy summaries were selected for a request in a debug-only path.
  - Validate that hidden policy pages stay out of visible recommendations while still affecting the answer content.
- Phase 4. Search response and auditability
  - Decide what minimal visible grounding must remain on screen so the user can trust the answer without seeing raw JSON.
  - Separate user-facing prose from developer/debug evidence cleanly instead of stripping sections heuristically after generation.
  - Normalize the search response contract so UI rendering does not depend on legacy fields or cleanup rules.
- Phase 5. Wiki-like result UI
  - Replace or reframe the current chat result shell with a page-like reading surface closer to wiki/notion/confluence.
  - Keep structured blocks, but add page metadata, clearer section rhythm, and a stronger separation between answer, related pages, and follow-up input.
  - Make search results feel like a durable answer page, not just a transient chat turn.
- Phase 6. Home-page data wiring
  - Implement a real Home read model from visible wiki documents.
  - Resolve featured guides/projects to concrete page links instead of category-only links.
  - Connect each Home area to actual page destinations after search recommendation quality is stable enough to reuse for curation.
- Phase 7. Final validation
  - Rerun benchmark and live Confluence/OpenAI verification.
  - Confirm policy-sensitive cases, broad-planning cases, and troubleshooting cases meet the desired quality bar.
  - Only after search closes the trust gap should the Home page be finalized around those same document selections.

## Open Gaps
- Search quality is still below the documented benchmark target.
- Policy context is implemented but not yet strongly proven.
- The user-facing search surface still behaves more like chat than a wiki page.
- Home sections are still static and not connected to concrete page selections.

## Next Steps
- Start with Phase 1 and Phase 2 together: benchmark cleanup, contract cleanup, and retrieval hardening.
- Hold Home-page page-link wiring until at least one new retrieval/policy validation pass improves the benchmark and trust signals.
