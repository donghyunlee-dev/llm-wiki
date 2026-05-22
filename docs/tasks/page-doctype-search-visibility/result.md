# page-doctype-search-visibility Result

## Delivered Scope

- `CategoryPage.tsx` guides 섹션 필터 수정: `guide` docType → intro 필터 적용, `page` docType → 모두 표시
- `CategoryPage.test.tsx` 테스트 업데이트: `page` docType 노출 검증 추가

## Key Decisions

- Codex 제안대로 조건을 역전: "허용 타입 나열" 대신 "guide에게만 intro 필터 적용, 나머지 통과"
  → `getWikiDocumentSection`이 이미 섹션을 제어하므로 UI에서 docType 재허용 목록을 관리하지 않음

## Gaps / Follow-up

- 테스트 정렬 의존성: `updatedAt` 명시로 완화했으나, docType별 분리 테스트가 더 명확할 수 있음 (미구현)
- `page` 문서와 `guide` 문서의 시각적 구분: 현재 둘 다 "가이드 문서" 레이블로 표시됨 — 별도 작업 필요
