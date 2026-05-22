# search-response-parser-hardening Spec

## Problem Statement
- Search answers can leak schema-like sections such as `policyNotice:`, `confluenceData:`, and `recommendedPages:` into the visible `answer` text.
- The previous parser path failed to recover those fields reliably when the model returned malformed mixed-format output.

## Business Context
- Even when search retrieval is acceptable, broken response parsing causes policy flags, evidence, and recommendations to disappear.
- The parser must be resilient enough to preserve useful fields when the model output is close to the intended schema but not perfectly valid JSON.

## Scope
- Harden search response parsing for mixed answer-plus-labeled-schema output.
- Add targeted parser tests.
- Validate the same failing Claude CLI query against the running local service.

## Out Of Scope
- Search retrieval tuning.
- Search UI redesign.

## User Or Operator Scenarios
- A user receives a search answer where the model leaked labeled schema fragments, but the service still recovers policy flags, evidence, and recommendations.
- A developer reruns the same failing query and sees that the payload no longer degrades to empty fields.

## Acceptance Criteria
- AC1: Search response parsing recovers labeled schema fragments from malformed mixed-format output.
- AC2: Parser behavior is covered by a targeted web unit test.
- AC3: The local service returns recovered `policyNotice`, `confluenceData`, and `recommendedDocuments` for the reproduced failing pattern.

## Edge Cases
- The first balanced JSON fragment in the text is only a nested object such as `policyNotice`.
- The answer contains code blocks before the leaked labeled schema.

## Assumptions
- The service can keep using an LLM-generated JSON schema path, but it needs a robust fallback path.

## Clarifications
- Question: Does this fix the one-line answer problem itself?
- Answer: No. It only fixes response recovery when the model leaks schema-like fields into the answer body.
