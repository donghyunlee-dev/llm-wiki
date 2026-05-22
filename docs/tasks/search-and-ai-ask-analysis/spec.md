# search-and-ai-ask-analysis Spec

## Problem Statement
- The project treats main search and page-scoped `AI Ask` as the primary product path, but the current search stack is not trustworthy enough to call complete.
- Search retrieval, policy grounding, answer presentation, and Home-page linking are implemented in parts, but the remaining gaps are spread across code, docs, and prior task notes.
- The team needs a single analysis document that states what exists now, what is still missing, and what order the next work should follow.

## Business Context
- Search quality and `AI Ask` reliability directly determine whether the wiki feels usable.
- If policy pages are not actually shaping answers, the product can return plausible but misaligned guidance.
- If the result surface does not feel like a wiki/notion/confluence page, the product loses the intended reading experience even when retrieval is acceptable.

## Scope
- Analyze the current main search flow from query entry to Confluence retrieval to AI answer rendering.
- Analyze the current article `AI Ask` flow and policy-context injection path.
- Verify how much of the current stack is deterministic lexical search versus semantic filtering.
- Analyze the current Home-page section rendering and document-linking state.
- Break the remaining work into concrete implementation phases with validation focus.

## Out Of Scope
- Implementing retrieval or UI changes in this task.
- Changing the canonical Confluence source model.
- Adding a separate database or vector store.

## User Or Operator Scenarios
- A developer needs to continue search work next session without re-reading the full codebase.
- A product owner needs to know why the current search result experience still feels incomplete.
- An implementer needs a safe order for retrieval, policy, UI, and Home-linking work.

## Acceptance Criteria
- AC1: The current search and `AI Ask` implementation path is summarized with concrete file references.
- AC2: The current gaps are separated into retrieval, policy, API contract, UI, and Home-linking concerns.
- AC3: The roadmap defines a practical execution order instead of a flat backlog.
- AC4: The task workspace and PRD progress docs reflect this analysis.

## Edge Cases
- The codebase uses the term `semantic`, but the actual retrieval path is still lexical scoring plus heuristic expansion.
- Policy pages are loaded as hidden context, but there is no strong proof yet that policy materially changes answers.
- The UI may suppress internal evidence sections, which makes policy/search grounding harder to verify visually.

## Assumptions
- The current Confluence corpus remains the source of truth.
- Search should stay read-only.
- The team wants to finish search before wiring the Home-page section cards and lists to concrete pages.

## Clarifications
- Question: Is the current search implementation already semantic search?
- Answer: Not in the strict sense. The current ranking is deterministic token scoring with synonym expansion and index-first heuristics, then an LLM synthesizes the answer from the selected pages.
- Question: What should happen after search is stable?
- Answer: Home sections should resolve to real pages and routes instead of staying as static placeholder-like content lists.
