# search-rovo-like-answer-quality Spec

## Problem Statement
- The current wiki search flow can miss an existing page and answer as if the topic is absent, even when Confluence Rovo can produce a grounded answer from the same page family.
- The current structure underperforms for employee-facing natural-language questions because retrieval, context construction, and answer assembly do not consistently surface the most directly relevant guide page.

## Business Context
- This wiki is intended for employees who do not have direct Confluence access.
- Search quality must be good enough that users can rely on the wiki answer itself, not just page cards, for orientation and next steps.
- Rovo's answer on `Claude Code Worktrees` is a benchmark for the expected quality bar: grounded explanation, clear distinction from adjacent concepts, practical usage flow, and a strong handoff to the guide page.

## Scope
- Improve search retrieval so the most directly relevant page can enter the AI context for concept/setup questions like `claude worktree를 설명하세요.`.
- Improve query-understanding fallback behavior when Stage 1 does not return usable keywords.
- Improve search answer assembly so unsupported/no-page answers remain consistent with evidence and page-card behavior.
- Add regression coverage for the `Claude Code Worktrees` family retrieval path and related response-shape behavior.
- Update task and PRD documentation to reflect the new search behavior.

## Out Of Scope
- Replacing the main retrieval system with Atlassian Rovo MCP or another external search service.
- Broad redesign of the search page UI beyond behavior needed to support better answer quality.
- Changing Confluence page content or metadata outside code-driven retrieval rules.

## User Or Operator Scenarios
- An employee asks `claude worktree를 설명하세요.` and receives a grounded explanation plus the correct guide page rather than a false "page not found" answer.
- An operator compares current wiki search against Confluence Rovo and can explain why the internal wiki now produces a comparable answer path for page-backed topics.

## Acceptance Criteria
- AC1: For the `Claude Code Worktrees` family query, retrieval logic includes page `95780877` in the AI search context.
- AC2: The server does not emit a no-page answer for the above query when public corpus content exists for the topic.
- AC3: If the AI still returns a no-page style answer, response assembly does not mark the answer as sufficient or attach unrelated page cards.
- AC4: Automated tests cover the retrieval improvement and the inconsistent no-page response path.

## Edge Cases
- Stage 1 query understanding may return no usable JSON or no usable keywords.
- The most relevant page may be `docType=page` while broader but less relevant neighbors are `docType=guide`.
- Singular/plural or English-only title variants such as `worktree` / `worktrees` may affect lexical matching.

## Assumptions
- The live Confluence content for page `95780877` remains public and searchable through the existing source pipeline.
- Existing in-progress user changes in unrelated search UI files should be preserved.

## Clarifications
- Question: Should this task target exact parity with Rovo output?
- Answer: No. It should target comparable usefulness and correctness within the current wiki architecture.
