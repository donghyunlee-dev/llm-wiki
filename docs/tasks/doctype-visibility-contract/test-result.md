# doctype-visibility-contract Test Result

## 6a. Unit Tests / Typecheck

```
pnpm test → 전체 통과 (wiki-core 135 + web 42 + serverless 5 = 182개)
```

CategoryPage 테스트: "shows only guide documents on /guides, excludes page docType and intro pages, and paginates long lists" — 통과

## 6b. Playwright Review

| 화면 | 결과 |
|---|---|
| 5174 `/guides` (스냅샷) | guide 2개만 표시 — page 3개 제외됨 ✅ |
| 5173 `/guides` (라이브) | 전체 guide 문서만 표시 (page 없음) ✅ |

## 6c. Codex Critical Review

| 지적 사항 | 조치 |
|---|---|
| `development-prompt-reference.md`에 `/guides` = guide + page로 남아 있음 | guide only로 수정 ✅ |
| `implementation-status.md` 이전 기록과 현재 규칙 충돌 | superseded NOTE 추가 ✅ |
| 페이지네이션 2페이지 직접 검증 없음 | Low 우선순위, 현재 스코프 밖 |
| 태스크 문서 미완 | 이 파일 작성으로 완료 ✅ |

## Acceptance Criteria Coverage

| AC | 결과 |
|---|---|
| AC1: `/guides`에 page docType 미노출 | ✅ |
| AC2: 홈 추천 가이드 page 미노출 (기존 유지) | ✅ |
| AC3: 검색 추천/관련 페이지 page 노출 (코드 변경 없음) | ✅ |
| AC4: pnpm test 전체 통과 | ✅ |
| AC5: 문서에 surface별 규칙 FROZEN 명시 | ✅ |
