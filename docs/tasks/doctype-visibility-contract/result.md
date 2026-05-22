# doctype-visibility-contract Result

## Delivered Scope

### 코드
- `CategoryPage.tsx`: guides 필터를 `guide` only로 복원 (`page` 포함 제거)
- `CategoryPage.test.tsx`: `page` 제외 검증으로 테스트 복원

### 문서 (전체 FROZEN 처리)
- `CLAUDE.md`: Frozen Behaviors — surface별 규칙 표로 명시, 수정 시 사용자 승인 절차
- `ui-spec.md`: Guide List Rules FROZEN + docType Visibility by Surface 표 추가
- `development-rules.md`: 동결 목록에 `/guides` guide only + 검색 page 포함 규칙 추가
- `development-prompt-reference.md`: `/guides` guide only로 수정
- `implementation-status.md`: 이전 잘못된 수정 superseded 명시

## Surface별 최종 규칙

| Surface | guide | page |
|---|---|---|
| 홈 추천 가이드 | ✅ | ❌ |
| `/guides` 목록 | ✅ | ❌ |
| 검색 추천/관련 페이지 | ✅ | ✅ |
| 답변 인라인 링크 | ✅ | ✅ |

## Decisions

이번 세션 초반에 추가된 "guide + page 모두" `/guides` 변경은 사용자 의도와 달라 복원함.

## Gaps

페이지네이션 2페이지 직접 클릭 테스트 미추가 (Codex Low 지적) — 별도 필요 시 추가.
