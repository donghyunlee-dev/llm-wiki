# search-quality-and-answer-rendering Spec

## Problem Statement
- Current search answers are functionally close to the intended wiki-search flow, but the retrieved results and rendered answers are not consistent enough to feel reliable.
- The project needs a repeatable way to compare generic AI answers against wiki-grounded answers for representative wiki questions, then use the gap to improve retrieval and presentation.

## Business Context
- Search is a core product entry point, so weak retrieval or awkward answer rendering reduces trust quickly.
- The intended search experience is not a raw result list; it is a wiki-based answer flow that should stay aligned with Confluence content and present results in a readable wiki-like format.
- Improving search quality requires both backend retrieval tuning and frontend answer rendering that makes the result feel like a real knowledge page rather than a plain chat bubble.

## Scope
- Define a representative set of 5 wiki-grounded search questions.
- Compare generic AI answers and wiki-based search answers for those questions.
- Measure structural and factual alignment between the two answer sets.
- Improve search retrieval quality where the wiki answer falls short of the intended content.
- Improve answer rendering so search responses can show headings, code, links, tables, and info-style sections in a wiki-like form.
- Run validation and repeat comparison until results are materially better.
- Start the app and verify the final search experience in the browser.

## Out Of Scope
- Adding write-back or editing flows.
- Building a separate search index or database.
- Changing the canonical content source away from Confluence.
- Reworking unrelated navigation or home-screen layout.

## User Or Operator Scenarios
- A user asks a setup question and gets a wiki-grounded answer that matches the relevant Confluence pages more closely than a generic model answer.
- A user sees the answer rendered with wiki-like structure instead of a plain text chat block.
- An implementer reruns the comparison set after search changes and can tell whether retrieval quality improved.

## Acceptance Criteria
- 5 representative questions are defined and grounded in existing Confluence content.
- Generic AI answers and wiki-based search answers are generated for the same question set.
- A comparison rubric captures differences in structure, factual alignment, completeness, and actionability.
- At least one code iteration improves observed wiki-answer quality or rendering fidelity.
- Search answers render with richer wiki-like components for headings, code, links, tables, and informational blocks where supported by the content.
- Validation is recorded and the app is runnable for visual inspection.

## Edge Cases
- A question has a generic AI answer that is fluent but unsupported by the wiki corpus.
- A wiki answer is factually aligned but poorly structured or too terse.
- A question pulls in irrelevant internal pages unless filtering is strict enough.
- A page contains content types that the renderer does not yet support cleanly.

## Assumptions
- The current Confluence corpus contains enough content to ground the chosen representative questions.
- A small fixed question set is enough to expose the main retrieval and rendering regressions.
- The wiki search flow should remain read-only.

## Clarifications
- Question: What is the purpose of the comparison against a generic AI answer?
- Answer: To isolate what the wiki search path adds or loses relative to a baseline model answer, so the implementation can be tuned toward the intended wiki behavior.
- Question: What should the rendered search result feel like?
- Answer: It should feel like a wiki document excerpt or concise knowledge page, not a plain chat transcript.
