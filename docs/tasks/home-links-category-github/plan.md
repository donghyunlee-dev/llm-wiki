# Plan: Home links, Category filter, GitHub project integration

## Impacted Areas

| 영역 | 파일 | 변경 유형 |
|---|---|---|
| wiki-core | `githubClient.ts` | 신규 |
| wiki-core | `homeContent.ts` | 수정 (featuredGuides/Projects 제거) |
| wiki-core | `index.ts` | 수정 (githubClient export 추가) |
| web | `vite.config.ts` | 수정 (GitHub 엔드포인트 추가) |
| web | `useGithubProjects.ts` | 신규 |
| web | `CategoryPage.tsx` | 수정 (nav 타입 숨김) |
| web | `HomePage.tsx` | 수정 (동적 목록) |
| web | `ProjectsPage.tsx` | 수정 (GitHub 섹션) |

## Technical Approach

### 1. Category page nav 문서 숨김
`HIDDEN_CATEGORY_NAV_TYPES` 상수를 정의하고 `categoryDocuments` 필터에 적용.
`docType` 필터 드롭다운에는 이 타입들을 노출하지 않음 (구조용이므로 사용자가 선택할 필요 없음).

### 2. Home 동적 추천 목록
`HomePage`에서 `useWikiData()` 호출. 로딩 중에는 빈 리스트 패널 표시.
가이드: nav 타입 제외 후 updatedAt 내림차순 상위 3개.
프로젝트: updatedAt 내림차순 상위 3개.
`homeContent.ts`에서 `featuredGuides`, `featuredProjects` 필드 제거.

### 3. GitHub 클라이언트 (`packages/wiki-core/src/lib/githubClient.ts`)
- `fetchGitHubOrgProjects(config)`: org repos 페이지네이션 처리 후 README 요약 병렬 조회
- `extractReadmeSummary(markdown)`: 첫 번째 실제 문단 텍스트 추출 (헤딩·뱃지·HTML 건너뜀)
- `GitHubProject` 타입 export

### 4. Vite 개발 엔드포인트 (`/api/github/projects`)
`vite.config.ts`에 `githubDevApiPlugin` 추가.
`GITHUB_TOKEN`, `GITHUB_ORG` env 확인 → 없으면 503.
GitHub 응답은 5분 인메모리 캐시 적용.

### 5. useGithubProjects 훅
`/api/github/projects` GET 호출. 결과 `{ projects, isLoading, errorMessage }` 반환.

### 6. ProjectsPage GitHub 섹션
`ProjectsPage`에서 `useGithubProjects()` 호출.
- 로딩: 스피너 또는 상태 패널
- 에러: 에러 메시지만, Confluence 섹션은 유지
- 성공: 레포 카드 그리드 (이름, 설명, README 요약, GitHub 링크)
- 미설정(projects 배열 비어있고 에러 없음): 섹션 숨김

## Validation Plan

1. `pnpm test` — homeContent 테스트 업데이트 포함
2. `pnpm typecheck`
3. `pnpm build`
4. 브라우저: 시작 가이드 목록에서 index 타입 미노출 확인
5. 브라우저: 홈 추천 목록 클릭 시 문서 상세 페이지 이동 확인
6. 브라우저: `.env.local`에 `GITHUB_TOKEN`, `GITHUB_ORG` 설정 후 프로젝트 페이지 GitHub 섹션 확인

## Risks

- GitHub API rate limit: 토큰 사용 시 5000 req/hr — 캐시로 충분히 커버
- README가 없거나 바이너리 파일인 경우: null 처리로 방어
