# search-answer-tone-explanatory Spec

## Problem Statement
- Current search answers are correct but too terse and summary-like for users who are reading multiple guide pages to understand the flow.
- The answer tone should feel friendlier and more explanatory, like a practical blog post, so 초·중급 AI 바이브코딩 사용자가 recommended pages를 따라가며 이해할 수 있어야 한다.

## Business Context
- Search is the primary entry into the wiki and should help users understand not just what to do, but why the document family matters.
- Recommended pages often point to an overview/index page plus strong follow-up pages, so the visible answer should guide users into that reading flow instead of ending too early.

## Scope
- Update the AI answer tone for search and shared AI prompt guidance.
- Reflect the desired tone in the PRD prompt guide and search contract where needed.
- Add or update tests that pin the new prompt guidance and prevent regression back to terse, summary-only phrasing.

## Out Of Scope
- Visual redesign of the search page.
- Changing the search ranking model or document selection logic.
- Persistent storage or cache changes.

## User Scenarios
- A user asks a conceptual question and receives a friendly explanation that explains the topic before listing documents.
- A user asks a setup question and receives a blog-like walkthrough that explains what the documents are for, then shows the recommended pages.
- A beginner user can read the answer without already knowing the wiki structure or the exact MCP term family.

## Acceptance Criteria
- AC1: Search prompt instructions explicitly ask for a friendly, explanatory, blog-like tone aimed at 초·중급 AI 바이브코딩 users.
- AC2: Search answers still remain grounded in the retrieved documents, but they explain the flow with more context before compressing into bullets.
- AC3: The prompt guide and search contract document the tone requirement.
- AC4: Unit tests cover the updated prompt guidance so future edits do not silently revert to terse wording.

## Notes
- The tone change should make the answer easier to follow while keeping the recommendation section intact.
