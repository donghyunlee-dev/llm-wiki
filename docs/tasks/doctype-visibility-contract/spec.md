# doctype-visibility-contract Spec

## Problem Statement

`page` docType 문서가 노출되어야 하는 면(surface)과 그렇지 않은 면이 혼재되어, 반복적으로 잘못된 방향으로 수정이 발생하고 있다.

이번 세션에서 `/guides` 목록에 `page` docType을 포함하는 수정이 이루어졌으나, 이는 사용자 의도와 다른 것으로 확인되었다.

## 사용자 정의 노출 규칙 (Surface별)

| Surface | guide | page | 비고 |
|---|---|---|---|
| 홈 추천 가이드 | ✅ | ❌ | `buildFeaturedGuides`, guide docType만 |
| `/guides` 목록 | ✅ | ❌ | guide docType만, intro 제외 |
| 검색 답변 내 추천 페이지 | ✅ | ✅ | AI가 선정한 추천 문서 |
| 검색 답변 내 관련 페이지 | ✅ | ✅ | 랭킹 기반 관련 문서 |
| 답변 본문 내 인라인 링크 | ✅ | ✅ | 답변 중 연결되는 페이지 |

## Scope

### 코드 변경
- `apps/web/src/ui/pages/CategoryPage.tsx`: guides 섹션 필터를 `guide` docType only로 복원
- `apps/web/src/ui/pages/CategoryPage.test.tsx`: `page` 포함 테스트를 `page` 제외로 복원

### 문서 변경
- `docs/prd/ui-spec.md`: Surface별 docType 노출 규칙을 FROZEN 섹션에 명시
- `CLAUDE.md`: Frozen Behaviors에 `/guides` 목록 규칙 추가
- `docs/ops/development-rules.md`: 동결 목록 업데이트

## Out of Scope

- 검색 답변 내 추천/관련 페이지 로직 변경 없음
- 인라인 링크 로직 변경 없음

## Acceptance Criteria

- AC1: `/guides` 목록에 `page` docType 문서가 노출되지 않음
- AC2: 홈 추천 가이드에 `page` docType 문서가 노출되지 않음 (기존 유지)
- AC3: 검색 추천/관련 페이지에 `page` 문서 노출 유지 (코드 변경 없음)
- AC4: `pnpm test` 전체 통과
- AC5: 문서에 surface별 규칙이 FROZEN으로 명시됨
