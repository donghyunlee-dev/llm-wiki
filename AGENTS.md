# Repository Guidelines

## Project Structure & Required Reads
This repository is documentation-driven and already has a runnable monorepo scaffold. Start with [README.md](/home/donghyunlee/projects/SFOOD-LLM-WIKI/README.md), then read the operating guides under `docs/ops/`, then the current project state under `docs/prd/`.

- `docs/ops/development-index.md`: local map of the Confluence development guide set
- `docs/ops/development-rules.md`: coding, design, naming, and safety rules
- `docs/ops/testing-strategy.md`: required validation approach and result recording
- `docs/ops/done-criteria.md`: completion gates
- `docs/ops/spec-driven-workflow.md`: required workflow for non-trivial work
- `docs/prd/implementation-status.md`: session-to-session progress source of truth
- `docs/prd/development-plan.md`: phase order and next implementation target
- `docs/prd/architecture.md`: fixed stack and deployment constraints
- `docs/tasks/_template/`: starter files for task documentation

## Workflow Expectations
Use a spec-driven workflow for any non-trivial feature, bug fix, integration, or behavior change. Create a task workspace under `docs/tasks/{work-scope}/` using a descriptive folder name instead of an ID, and keep these files up to date:

- `spec.md`
- `plan.md`
- `tasks.md`
- `test-result.md`
- `result.md`

Do not start implementation before `spec.md` defines scope and acceptance criteria and `plan.md` defines the technical approach and validation plan.
Before starting a new session, read `docs/prd/implementation-status.md` first and continue from the recorded next step. After each meaningful change, update both the relevant task workspace and the PRD progress docs.

## Build, Test, and Development Commands
Current working commands:

- `pnpm install`: install workspace dependencies
- `pnpm dev`: run the Vite web app
- `pnpm build`: build the web app
- `pnpm test`: run workspace tests
- `pnpm typecheck`: run workspace type checks
- `git status`: inspect local changes
- `rg --files`: list tracked files quickly

Keep commands reproducible and validate them before requesting review.

## Coding Style & Naming Conventions
Keep scope tight. Prefer the smallest effective change and avoid unrelated cleanup. Favor clarity over abstraction, use explicit state changes, and preserve existing behavior unless the task explicitly changes it.

Use descriptive names, verbs for actions, nouns for concepts, and kebab-case for Markdown and config files, for example `docs/ops/testing-strategy.md`. Use 2-space indentation in Markdown, YAML, and JSON.

## Testing & Done Criteria
Tests should describe observable behavior, not implementation trivia. Prefer the smallest test layer that proves the change: unit, flow, integration, or interface/API. Record executed commands, pass/fail results, skipped checks, and retest outcomes in `docs/tasks/{work-scope}/test-result.md`.

Work is done only when behavior, validation, and documentation align. If scope expands, validation is missing, or docs contradict the repo state, the task is not complete.

## Commit & Pull Request Guidelines
Commit subjects should stay short and imperative, for example `Add task document templates` or `Document testing strategy`. PRs should include the task ID, scope summary, validation evidence, and any remaining gaps or risks.
