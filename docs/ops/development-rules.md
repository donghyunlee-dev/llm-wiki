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

## Frozen Behaviors

일부 동작은 반복적인 오해와 수정 시도가 발생한 이력이 있어 명시적으로 동결되어 있다.  
동결된 동작은 사용자 승인 없이 변경하지 않는다. 전체 목록은 `CLAUDE.md`의 "Frozen Behaviors" 섹션을 참고한다.

현재 동결 목록:
- **홈 추천 가이드** (`buildFeaturedGuides`): `guide` docType only. `page` 포함 금지.
- **`/guides` 목록** (`CategoryPage` guides 필터): `guide` docType only, intro 제외. `page` 포함 금지.
- **시작 가이드 핀**: 홈 추천 가이드의 첫 번째 카드는 항상 시작 가이드(agent-start)로 고정.
- **검색 답변 추천/관련 페이지**: `guide` + `page` 모두 포함. 위 두 항목과 혼동 금지.

## Naming, Safety, and Docs
- Use purpose-driven names.
- Use verbs for actions and nouns for concepts.
- Avoid abbreviations unless already standard in the repository.
- Treat external input as untrusted and keep secrets out of source control.
- Update documentation whenever rules, workflows, or required outputs change.
