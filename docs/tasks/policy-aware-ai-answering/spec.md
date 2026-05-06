# policy-aware-ai-answering Spec

## Problem Statement
- Current AI Ask flows do not treat Confluence policy pages as a mandatory internal input.
- As policy pages grow, passing all of them directly into the model risks slow prompts and unstable answers.

## Business Context
- Policy pages must shape both document Q&A and search answers.
- The product should keep policy handling internal and avoid exposing policy pages in user-facing results.

## Scope
- Add a dedicated hidden `policy` document type in the read path.
- Build compact policy summaries for AI input.
- Select only the most relevant policy context for each question.
- Apply policy context to both document Ask and search Ask flows.

## Out Of Scope
- User-visible policy browsing UI.
- Policy write-back or approval workflow.
- Persistence outside in-memory request/runtime caches.

## User Or Operator Scenarios
- A user asks a document question and the answer is shaped by policy context plus the current page.
- A user searches for an implementation question and the answer is shaped by policy context plus the best matching documents.

## Acceptance Criteria
- Policy pages are parsed and cached as hidden internal context.
- Both Ask flows include policy context before model generation.
- Policy context is compact enough to avoid bloating prompts when many policy pages exist.
- Policy pages do not appear in visible search results or document recommendations.

## Edge Cases
- Multiple policy pages match the same question.
- No policy page matches the question closely.
- Policy content conflicts with page content.

## Assumptions
- Policy pages are internal-only and should not be displayed directly to users.
- In-memory summary/index caching is sufficient for MVP.
- The existing hidden `ops` policy path remains available while policy pages are added.

## Clarifications
- Question: How should policy pages be used in answers?
- Answer: As hidden internal ground truth only; do not expose policy page names or content directly in the user-facing answer.
