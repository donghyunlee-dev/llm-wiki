# Done Criteria

## Completion Principles
- Implementation alone is not completion.
- Behavior, validation, and documentation must align.
- Once approved scope is complete, stop instead of adding optional improvements.

## Required Checks
- Requested behavior works as specified.
- Important success and failure paths are handled.
- Validation is repeatable and clearly recorded.
- Boundaries remain understandable and maintainable.
- Errors are not hidden and safety risks were considered.

## Required Task Documents
- `docs/tasks/{task-id}/spec.md`
- `docs/tasks/{task-id}/plan.md`
- `docs/tasks/{task-id}/tasks.md`
- `docs/tasks/{task-id}/test-result.md`
- `docs/tasks/{task-id}/result.md`

## Not Done If
- A non-trivial change started without task documents.
- Validation is missing or only happy paths were checked.
- Documentation no longer matches repository behavior.
- The change introduced avoidable unrelated scope.
