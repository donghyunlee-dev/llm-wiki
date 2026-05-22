# Tasks: GitHub 프로젝트 README 상세 페이지

## Implementation

- [ ] `packages/wiki-core/src/lib/githubClient.ts` — `readmeMarkdown: string | null` 필드 추가, README 전체 마크다운 저장 (10,000자 cap)
- [ ] `apps/web/src/ui/pages/ProjectDetailPage.tsx` — 신규 생성
- [ ] `apps/web/src/router.tsx` — `projects/:slug` 라우트를 `ProjectDetailPage`로 교체
- [ ] `apps/web/src/ui/pages/ProjectsPage.tsx` — 카드 링크를 내부 라우트로 변경
- [ ] `apps/web/src/ui/pages/HomePage.tsx` — 추천 프로젝트 내부 링크 변경

## Validation

- [ ] `pnpm typecheck` 통과
- [ ] `pnpm test` 통과
- [ ] 브라우저에서 시나리오 S1–S5 동작 확인

## Documentation

- [ ] `test-result.md` 작성
- [ ] `result.md` 작성
- [ ] `docs/prd/implementation-status.md` 업데이트
