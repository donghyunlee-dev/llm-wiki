# Development Rules

## Purpose
Keep repository changes clear, maintainable, testable, and tightly scoped.

## Core Rules
- Change only what the task requires.
- Prefer the smallest effective implementation.
- Keep behavior changes explicit in code, tests, and reporting.
- Avoid unnecessary abstraction or speculative generalization.

## Design Rules
- Separate input/output handling from decision logic.
- Keep orchestration separate from persistence and transport details.
- Keep domain rules separate from infrastructure-specific code.
- Validate external input at the boundary.

## Implementation Rules
- Reuse existing patterns before introducing new ones.
- Prefer guard clauses over deep nesting.
- Keep functions and classes focused on one responsibility.
- Do not hide failures with broad exception handling or silent fallback logic.
- Limit edits to the minimum set of files needed.

## Naming, Safety, and Docs
- Use purpose-driven names.
- Use verbs for actions and nouns for concepts.
- Avoid abbreviations unless already standard in the repository.
- Treat external input as untrusted and keep secrets out of source control.
- Update documentation whenever rules, workflows, or required outputs change.
