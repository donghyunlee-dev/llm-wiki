# page-doctype-search-visibility Test Results

## Commands Executed

```bash
pnpm --filter @sfood/web test      # 11 files, 42 tests — PASS
pnpm --filter @sfood/web typecheck # PASS (no errors)
pnpm test                          # 181 total (134 wiki-core + 42 web + 5 serverless) — PASS
```

## Playwright Review

- URL: `http://localhost:5174/guides` (snapshot mode)
- 결과: "전체 5개 중 5개 표시" — guide 2개 + page 3개 정상 노출
- `[Intro]` 문서 숨김 유지 확인

## Codex Critical Review

Codex가 초안에서 두 가지 문제를 지적:

1. `isIntroGuideDocument` 필터가 `page` 타입에도 적용되는 부작용 → Codex 제안 구현으로 수정:
   ```ts
   if (document.metadata.docType === "guide") return !isIntroGuideDocument(document);
   return true;
   ```
2. 테스트가 정렬 순서에 과도하게 의존한다는 지적 — `updatedAt` 명시적 설정으로 완화

## Acceptance Criteria Coverage

| AC | 결과 |
|---|---|
| AC1: guides 목록에 `page` docType 포함 | PASS |
| AC2: guides 내부 검색으로 `page` 문서 발견 가능 | PASS (목록에 포함되므로 검색 가능) |
| AC3: `guide` docType 표시 회귀 없음 | PASS |
| AC4: intro guide 숨김 유지 | PASS |
