# wiki-mvp-bootstrap Plan

## Summary
- Build a frontend-first monorepo skeleton and land the first Home MVP implementation inside `apps/web`.

## Impacted Modules
- root workspace config
- `apps/web`
- `packages/wiki-core`
- `docs/tasks/wiki-mvp-bootstrap`

## Architecture Approach
- Keep canonical product content in Confluence later, but start with a shared fixture module.
- Keep reusable wiki logic in `packages/wiki-core`.
- Avoid server-specific coupling so the same logic can move into Lambda later if needed.

## Data And API Impact
- No live API integration in this step.
- Adds shared content shape for the Home view.

## Validation Plan
- Review file structure and route coverage.
- Add content validation tests for blocked terms and list counts.

## Risks
- Exact dependency install compatibility is not runtime-verified until packages are installed.
- Tailwind/React/Vite integration remains unexecuted in this step.

## Rollback Considerations
- Remove the scaffolded app and workspace files if the stack decision changes.
