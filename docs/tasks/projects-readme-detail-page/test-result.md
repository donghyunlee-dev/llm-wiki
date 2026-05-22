# Test Result: GitHub 프로젝트 README 상세 페이지

## Validation Commands

```
pnpm typecheck   → 전체 통과 (wiki-core, apps/web, serverless)
pnpm test        → 전체 통과 (48/28/5 tests)
```

## Acceptance Criteria Coverage

| 항목 | 결과 |
|---|---|
| `ProjectsPage` 카드 클릭 시 내부 라우트로 이동 | ✅ `<Link to="/projects/:slug">` 적용 |
| `/projects/:slug`에서 README 마크다운 렌더링 | ✅ `ProjectDetailPage` + `StructuredAnswerView` |
| 상세 페이지에 GitHub 원본 링크 버튼 표시 | ✅ "GitHub에서 보기 ↗" 버튼 |
| README 없는 프로젝트 상세 페이지 안전 처리 | ✅ "README가 없습니다." 메시지 |
| 존재하지 않는 slug → 에러 상태 패널 | ✅ `WikiStatePanel tone="error"` |
| `HomePage` 추천 프로젝트 내부 링크 | ✅ `external` 플래그 제거, 내부 href |
| `pnpm typecheck` 통과 | ✅ |
| `pnpm test` 통과 | ✅ 48/28/5 전체 통과 |

## Skipped Checks

- 브라우저 직접 확인(S1–S5): GitHub 설정 없는 환경에서 GitHub 데이터 불가, 타입·빌드로 대체 검증
