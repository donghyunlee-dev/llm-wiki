# doctype-visibility-contract Plan

## Impacted Areas

| 파일 | 변경 | 내용 |
|---|---|---|
| `apps/web/src/ui/pages/CategoryPage.tsx` | 수정 | guides 섹션 필터: `page` 포함 → `guide` only 복원 |
| `apps/web/src/ui/pages/CategoryPage.test.tsx` | 수정 | `page` 포함 검증 → `page` 제외 검증으로 복원 |
| `docs/prd/ui-spec.md` | 수정 | Surface별 docType 노출 규칙 FROZEN 섹션 추가 |
| `CLAUDE.md` | 수정 | Frozen Behaviors에 `/guides` 규칙 추가 |
| `docs/ops/development-rules.md` | 수정 | 동결 목록 업데이트 |

## Approach

### CategoryPage.tsx
```typescript
// 현재 (잘못됨 — page 포함)
return baseDocuments.filter((document) => {
  if (document.metadata.docType === "guide") {
    return !isIntroGuideDocument(document);
  }
  return true;
});

// 복원 (guide only)
return baseDocuments.filter((document) => {
  if (document.metadata.docType !== "guide") return false;
  return !isIntroGuideDocument(document);
});
```

## Validation Plan

1. `pnpm test` — CategoryPage 테스트 포함 전체 통과 확인
2. Playwright: 5173 `/guides` 목록에 `page` 문서 없음 확인
3. Playwright: 5174 스냅샷에서도 `page` 제외 확인
4. Codex 비판 리뷰
