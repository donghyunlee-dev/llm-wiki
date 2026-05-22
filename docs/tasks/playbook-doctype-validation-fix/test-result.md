# playbook-doctype-validation-fix Test Result

## 6a. Unit Tests / Typecheck

```
pnpm test       → 전체 통과 (wiki-core 135 + web 42 + serverless 5 = 182개)
pnpm typecheck  → 전체 통과
```

신규 테스트: `wikiDataSource.test.ts` — "excludes playbook records without throwing and does not expose them to public corpus"

## 6b. Playwright Review (5173 live Confluence 모드)

| 화면 | 결과 |
|---|---|
| 홈 추천 가이드 | 시작 가이드(고정) + 추천 4개 정상 표시 ✅ |
| /guides 목록 | 전체 129개 표시 ✅ |
| 검색 ("mcp란") | AI 답변 + 추천 페이지 + 관련 페이지 정상 반환 ✅ |

수정 전: `records[0].page.metadata.docType must be a known document type.` 오류로 전체 로딩 실패

## 6c. Codex Critical Review

| 지적 사항 | 조치 |
|---|---|
| playbook 파싱/제외 회귀 테스트 누락 | `wikiDataSource.test.ts`에 테스트 추가 ✅ |
| docType 허용값 3곳 중복 | 이번 스코프 밖, 별도 태스크로 관리 |
| playbook child 페이지 유출 가능성 | 기존 코드 검토 결과 이번 수정이 리스크를 새로 만들지 않음. 운영 이슈로 관리 |

## Acceptance Criteria Coverage

| AC | 결과 |
|---|---|
| AC1: 홈 추천 가이드 표시 | ✅ |
| AC2: 검색 정상 동작 | ✅ |
| AC3: /guides 목록 표시 | ✅ |
| AC4: pnpm test 전체 통과 | ✅ |
