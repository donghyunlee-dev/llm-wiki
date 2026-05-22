# search-policy-targeting-and-indicator Tasks

## Implementation Tasks
- [x] Update task docs and PRD docs for the new policy-targeting requirement.
- [x] Extend search and page `AI Ask` response schemas with a policy-related notice field.
- [x] Update the dev API parsing and normalization logic.
- [x] Render the policy notice in search and article answer UIs.
- [x] Remove `guideDocuments` from search payload generation and client usage.

## Test Tasks
- [x] Add or update unit tests for the AI schemas and prompt payloads.
- [x] Update client tests for the simplified recommendation contract.
- [x] Run targeted test commands and typecheck.

## Documentation Tasks
- [x] Update `docs/prd/api-spec.md`.
- [x] Update `docs/prd/implementation-status.md`.
- [x] Record validation and results.

## Progress Notes
- Phase 1 execution starts here.
- Policy is still hidden context, but answers now carry an explicit visible notice when policy materially shaped the output.

## Review Notes
- Policy remains hidden context, but the user must see when policy shaped the answer.
