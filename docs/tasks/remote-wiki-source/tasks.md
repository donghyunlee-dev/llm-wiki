# remote-wiki-source Tasks

## Implementation Tasks
- [x] Add remote payload shape validation.
- [x] Enforce fixed space, current status, and public visibility rules.
- [x] Update web provider endpoint resolution and user-facing error handling.

## Test Tasks
- [x] Add tests for remote success and validation failures.
- [x] Run test suite.
- [x] Run type checks.
- [x] Run production build.

## Documentation Tasks
- [x] Record validation in `test-result.md`.
- [x] Summarize delivered scope in `result.md`.
- [x] Update PRD implementation status.

## Progress Notes
- 2026-04-29: Started Phase 2 remote source hardening under the existing source boundary.
- 2026-04-29: Added remote payload parser, space guard, public/current filtering, and generic UI error handling.
- 2026-04-29: Added README runtime env instructions for remote source mode.

## Review Notes
- Real production endpoint value is still external configuration and is not present in the repository.
