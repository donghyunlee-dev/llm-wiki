# search-query-normalization Tasks

## Implementation Tasks
- [x] Normalize mixed-language search tokens by stripping common Korean particles.
- [x] Add a small synonym expansion layer for email/M365/setup terms.
- [x] Boost slug and docType hints in search scoring.

## Test Tasks
- [x] Add search unit coverage for Korean particle and synonym normalization.
- [x] Run workspace validation after the change.

## Documentation Tasks
- [x] Record the change in PRD progress docs.

## Progress Notes
- Search relevance now handles `gmail을`/`mail을` style input better.

## Review Notes
- None yet.
