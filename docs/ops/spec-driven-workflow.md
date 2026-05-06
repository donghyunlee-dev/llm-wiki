# Spec-Driven Workflow

## When To Apply
Use this workflow for non-trivial feature work, bug fixes, integrations, interface changes, persistence changes, or any behavior-affecting request.

## Task Workspace
Each work item uses `docs/tasks/{task-id}/` with:
- `spec.md`
- `plan.md`
- `tasks.md`
- `test-result.md`
- `result.md`

Starter files live in `docs/tasks/_template/`.

## Phases
1. Specify: define problem, scope, out of scope, scenarios, acceptance criteria, edge cases, and assumptions in `spec.md`.
2. Clarify: resolve ambiguity before planning or implementation.
3. Plan: document impacted areas, approach, validation plan, and risks in `plan.md`.
4. Task Breakdown: track implementation, test, and documentation work in `tasks.md`.
5. Implement: change code only after spec and plan remove behavioral ambiguity.
6. Validate: record executed checks in `test-result.md`.
7. Report: summarize delivered scope, decisions, and gaps in `result.md`.

## Gates
- Do not implement before `spec.md` and `plan.md` are sufficient.
- Do not mark work complete before `test-result.md` and `result.md` are updated.
- Do not expand scope beyond what is documented and confirmed.
