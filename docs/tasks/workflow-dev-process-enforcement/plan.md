# workflow-dev-process-enforcement Plan

## Impacted Areas

| 파일 | 변경 유형 | 내용 |
|---|---|---|
| `docs/ops/spec-driven-workflow.md` | 수정 | Playwright 검토 + Codex 비판 리뷰 단계 추가 |
| `CLAUDE.md` | 수정 | 수정 지시 시 강제 프로세스 섹션 추가 |

## Approach

### spec-driven-workflow.md

기존 6단계(Validate) 이후에 다음을 추가한다:
- `6a. Playwright Review`: Playwright MCP로 브라우저 실제 동작 검증
- `6b. Codex Critical Review`: Codex에게 변경 사항 전달 → 비판 의견 수집
- 두 단계 모두 통과해야 7단계(Report)로 진행 가능

### CLAUDE.md

"Confirm Before Editing" 섹션 아래에 새 섹션 추가:

> ## Modification Workflow — Mandatory Steps
>
> 1. Task documents first
> 2. Implement
> 3. Unit tests + typecheck
> 4. Playwright review
> 5. Codex critical review
> 6. Report only after all pass

## Validation Plan

1. 문서 내용 검토
2. 향후 세션에서 수정 지시 시 프로세스 준수 여부 확인

## Risks

- Codex가 특정 환경에서 불가할 경우 — 가능하면 시도하되, 불가 시 명시적으로 기록하고 진행
