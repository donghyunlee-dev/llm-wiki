# search-and-ai-ask-analysis Tasks

## Implementation Tasks
- [x] Read required repository operating and PRD guides.
- [x] Trace the current search retrieval and AI answer path.
- [x] Trace the current article `AI Ask` and hidden policy-context path.
- [x] Trace the current Home-page section rendering and linking path.
- [x] Group the remaining work into staged execution order.

## Test Tasks
- [x] Review existing benchmark and validation records for search quality.
- [x] Check whether current code and docs support the claimed semantic/policy behavior.
- [ ] Run live Confluence/OpenAI verification for the next implementation step.

## Documentation Tasks
- [x] Create a dedicated analysis task workspace.
- [x] Update PRD progress docs with the analysis outcome and next-step order.

## Progress Notes
- Search ranking is currently lexical and deterministic, not embedding-based semantic retrieval.
- Policy pages are parsed and injected as hidden prompt context, but the repo does not yet prove policy impact with dedicated evaluation cases.
- Home hero, featured lists, and section links are still driven by static content constants rather than live page selections.

## Review Notes
- Future search work should start with retrieval/policy verification before UI polish.
- Home-page page-level linking should happen only after search recommendation quality and page recommendation stability improve.
