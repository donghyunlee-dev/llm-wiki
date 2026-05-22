# search-policy-targeting-and-indicator Spec

## Problem Statement
- Main search already injects hidden policy context, but the current implementation does not make that contract explicit enough and does not tell the user when an answer is policy-related.
- The current search response still carries legacy duplication such as `guideDocuments`, which obscures the actual contract.
- The team needs the first completion step for search to make policy participation explicit in both the data flow and the visible answer surface.

## Business Context
- A user question can be answered by policy content in Confluence rather than by a visible guide page alone.
- If policy affects the answer but the UI gives no indication, users cannot tell whether they are reading ordinary guidance or policy-shaped guidance.
- Search and page `AI Ask` should follow the same rule so policy-sensitive answers are consistently signaled.

## Scope
- Record that Confluence policy pages are part of the answer-generation target set for search and page `AI Ask`.
- Extend search and page `AI Ask` response contracts so policy-related answers are explicitly marked.
- Show a visible policy notice when an answer materially depends on policy context.
- Remove the duplicated `guideDocuments` field from the search response payload and UI usage.
- Update relevant task and PRD documents.

## Out Of Scope
- Full retrieval retuning for all weak benchmark cases.
- A visible policy page browser.
- Exposing hidden policy page titles or raw policy content directly to users.

## User Or Operator Scenarios
- A user asks a search question whose correct answer is constrained by policy and sees a visible note that policy shaped the answer.
- A user asks a page-level follow-up question and sees the same policy-related notice when applicable.
- A developer inspects the response contract and sees that policy participation is first-class rather than implicit.

## Acceptance Criteria
- AC1: Search and page `AI Ask` outputs include a policy-related indicator field.
- AC2: The search UI and article `AI Ask` UI show a visible policy notice only when the answer is policy-related.
- AC3: Search no longer returns the duplicated `guideDocuments` field.
- AC4: Documentation records that policy pages are part of the answer-generation target set.

## Edge Cases
- Policy context is present but not materially relevant to the answer.
- Policy and visible document content conflict.
- Hidden policy pages exist, but the model returns a non-policy answer.

## Assumptions
- Hidden policy pages should remain non-browsable and non-recommendable.
- A short visible notice is enough; the product does not need to expose policy page names.

## Clarifications
- Question: Should policy pages appear as visible search results?
- Answer: No. They should influence the answer as hidden Confluence context, and the UI should show that policy was applied.
- Question: Should the policy indicator be limited to search?
- Answer: No. It should apply to all AI answers, including page-scoped `AI Ask`.
