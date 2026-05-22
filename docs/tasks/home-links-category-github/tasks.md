# Tasks: Home links, Category filter, GitHub project integration

## Implementation

- [ ] `homeContent.ts` — `featuredGuides`, `featuredProjects` 필드 및 관련 검증 제거
- [ ] `homeContent.test.ts` — 제거된 필드 테스트 삭제
- [ ] `CategoryPage.tsx` — `HIDDEN_CATEGORY_NAV_TYPES` 필터 추가
- [ ] `HomePage.tsx` — `useWikiData()` 기반 동적 추천 목록
- [ ] `githubClient.ts` — 신규 GitHub API 클라이언트
- [ ] `index.ts` (wiki-core) — `githubClient` export 추가
- [ ] `vite.config.ts` — `/api/github/projects` 엔드포인트 추가
- [ ] `useGithubProjects.ts` — 신규 React 훅
- [ ] `ProjectsPage.tsx` — GitHub 섹션 추가

## Test & Validate

- [ ] `pnpm test` 통과
- [ ] `pnpm typecheck` 통과
- [ ] `pnpm build` 통과

## Documentation

- [ ] `test-result.md` 작성
- [ ] `result.md` 작성
- [ ] `implementation-status.md` 업데이트
