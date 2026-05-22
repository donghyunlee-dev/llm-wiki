# search-setup-answer-structure Tasks

## Implementation Tasks
- [x] Reproduce the failing one-line answer.
- [x] Tighten setup-question prompt structure requirements.
- [x] Revalidate the same query against the local service.

## Test Tasks
- [x] Run targeted wiki-core tests.
- [x] Record the before/after local API results.

## Documentation Tasks
- [x] Record cause, fix, and validation.

## Progress Notes
- The failing query is classified as `setup`, so the problem is not intent classification.
- After the prompt fix, the same query produced a structured multi-section answer, which confirms the first issue was generation underconstraint.
- The revalidation also exposed a second issue: the model sometimes appends schema-like fields into the visible `answer`, and `parseAiSearchResult` falls back to a degraded payload when strict JSON parsing fails.

## Review Notes
- Focus on generation constraints, not retrieval or rendering.
