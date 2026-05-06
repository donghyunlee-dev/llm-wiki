# policy-aware-ai-answering Tasks

## Implementation Tasks
- [x] Add `policy` handling to the Confluence read model and hidden policy record parsing.
- [x] Add compact policy summary construction and relevance ranking helpers.
- [x] Thread policy context into document Ask and search Ask prompt builders.
- [x] Update the dev API cache loader to keep policy documents alongside hidden ops policy documents.

## Test Tasks
- [x] Add unit coverage for `policy` parsing and hidden filtering.
- [x] Add unit coverage for policy selection and prompt input shaping.
- [x] Run workspace validation after code changes.

## Documentation Tasks
- [x] Update PRD progress docs after implementation.

## Progress Notes
- Scoped as a policy-aware AI answering enhancement with hidden policy context only.
- Policy documents are summarized at cache-load time and selected with a top-k relevance pass per request.

## Review Notes
- None yet.
