# ai-ask-no-ops-context Tasks

## Implementation Tasks
- [x] Remove `ops` from AI prompt context in `aiAsk.ts`.
- [x] Remove `ops` prompt input construction from the Vite dev API.
- [x] Update the prompt guide to exclude `ops` from AI input.

## Test Tasks
- [x] Run `pnpm --filter @sfood/wiki-core test`.
- [x] Run `pnpm --filter @sfood/wiki-core typecheck`.

## Documentation Tasks
- [x] Update the PRD prompt guide.
- [x] Record the change in implementation status.

## Progress Notes
- 2026-05-07: Started removing `ops` from AI prompt inputs to reduce prompt size and keep the policy context simpler.

## Review Notes
- `ops` document parsing can remain in the data layer if needed, but it should stay out of AI prompt assembly.
