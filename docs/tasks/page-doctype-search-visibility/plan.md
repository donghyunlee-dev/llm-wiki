# page-doctype-search-visibility Plan

## Impacted Areas

| 파일 | 변경 유형 | 내용 |
|---|---|---|
| `apps/web/src/ui/pages/CategoryPage.tsx` | 수정 | guides 섹션 docType 필터에 `page` 추가 |
| `apps/web/src/ui/pages/CategoryPage.test.tsx` (또는 관련 test) | 수정/추가 | `page` docType 표시 회귀 커버리지 |

## Approach

`CategoryPage.tsx` line 41의 필터 조건을 아래와 같이 변경한다.

**Before:**
```typescript
if (document.metadata.docType !== "guide") {
  return false;
}
```

**After:**
```typescript
if (document.metadata.docType !== "guide" && document.metadata.docType !== "page") {
  return false;
}
```

`isIntroGuideDocument` 필터는 그대로 유지한다.

## Validation Plan

1. `pnpm --filter @sfood/web test` 통과
2. `pnpm --filter @sfood/web typecheck` 통과
3. `pnpm test` 전체 통과
4. Playwright: `/guides` 경로에서 `page` docType 문서 표시 확인
5. Playwright: `/guides` 내부 검색으로 `page` 문서 찾기 확인
6. Playwright: `guide` docType 문서 표시 회귀 없음 확인

## Risks

- `page` 문서와 `guide` 문서가 섞여 사용자 혼란이 생길 수 있으나, 시각적 구분은 별도 작업으로 처리
- intro guide 필터(`isIntroGuideDocument`)는 `guide` docType 전용이므로, `page` 문서에는 적용되지 않음 — 의도된 동작
