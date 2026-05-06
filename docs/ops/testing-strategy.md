# Testing Strategy

## Principles
- Write tests early enough to lock expected behavior.
- Prefer behavior-focused tests over implementation-coupled tests.
- Keep tests deterministic, isolated, and repeatable.
- Use the smallest test scope that still proves the change.

## Test Layers
- Unit: isolated business rules and transformations
- Flow/Application: orchestration, sequencing, and state transitions
- Integration: persistence or external contract verification
- Interface/API: boundary validation, output shape, and user-visible behavior

## Test Writing Rules
- Structure checks as `Given / When / Then`.
- Name tests after observable behavior.
- One test should verify one main behavior.
- Control time, external state, and side effects where needed.

## Avoid
- Hidden shared state
- Flaky timing-based checks
- Excessive mocking
- Production changes made only to satisfy weak tests

## Result Recording
For each non-trivial task, record validation in `docs/tasks/{task-id}/test-result.md` with commands, pass/fail results, skipped checks, retest outcomes, and acceptance criteria coverage.
