# workflow-dev-process-enforcement Spec

## Problem Statement

수정 지시 이후 개발 프로세스(태스크 문서 작성 → Playwright 검토 → Codex 비판 의견 → 완료 보고)가
명시적인 지침문서로 강제화되어 있지 않아, 세션마다 준수 여부가 일관되지 않는다.

## Business Context

Claude(AI 어시스턴트)가 수정 작업 시 아래 단계를 항상 거치도록 지침을 문서화한다.
이를 통해 검증 누락·미보고 완료 같은 문제를 방지하고 품질 게이트를 일관되게 유지한다.

## Scope

- `docs/ops/spec-driven-workflow.md`: 수정 후 검증 단계에 Playwright 검토 및 Codex 비판 의견을 추가
- `CLAUDE.md`: 수정 지시 시 강제 적용 규칙 섹션 추가

## Out Of Scope

- 기존 게이트(spec.md, plan.md 없이 구현 금지) 변경 없음
- 실제 테스트 코드 변경 없음

## User Or Operator Scenarios

- Scenario 1: 수정 지시를 받으면 항상 태스크 작업공간(`docs/tasks/{id}/`)을 먼저 만든다.
- Scenario 2: 구현 후 `pnpm test` + `pnpm typecheck`를 통과시킨다.
- Scenario 3: Playwright MCP로 실제 UI 동작을 브라우저에서 검증한다.
- Scenario 4: Codex에게 변경 사항을 전달하고 비판 의견(critical review)을 받는다.
- Scenario 5: 모든 검증 통과 후에만 완료 보고를 한다.

## Acceptance Criteria

- AC1: `spec-driven-workflow.md`에 Playwright 검토와 Codex 리뷰 단계가 명시된다.
- AC2: `CLAUDE.md`에 수정 지시 시 강제 프로세스 섹션이 추가된다.
- AC3: 각 단계가 순서와 조건(게이트)과 함께 기록된다.

## Assumptions

- Codex는 MCP를 통해 접근 가능하며 비판적 코드 리뷰 기능을 수행한다.
- Playwright는 MCP 도구(`mcp__playwright__*`)를 통해 사용한다.
