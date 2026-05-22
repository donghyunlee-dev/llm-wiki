# Result

## Delivered

### 1. CategoryPage — nav 타입 문서 숨김
- `NAV_DOC_TYPES = new Set(["index", "router", "registry"])` 상수 추가
- `categoryDocuments` 생성 시 필터 적용
- docType 드롭다운에서도 nav 타입 제외

### 2. HomePage — 동적 추천 목록
- `useWikiData()` 기반으로 실제 Confluence 문서에서 추천 목록 생성
- 가이드: nav 타입 제외 후 updatedAt 내림차순 상위 3개
- 프로젝트: updatedAt 내림차순 상위 3개
- 각 항목이 `/{category}/{slug}` 개별 문서 링크로 연결
- 로딩 중 "불러오는 중..." 표시
- `HOME_CONTENT`의 정적 `featuredGuides`/`featuredProjects` 필드 제거

### 3. GitHub 통합 구조
- `packages/wiki-core/src/lib/githubClient.ts` — GitHub REST API 클라이언트
  - `fetchGitHubOrgProjects(config)`: org repos 페이지네이션 + README 요약 병렬 조회
  - `extractReadmeSummary(markdown)`: 첫 번째 실제 문단 추출
  - `GitHubProject` 타입 export
- `apps/web/vite.config.ts` — `/api/github/projects` 개발 엔드포인트 (5분 캐시)
- `apps/web/src/data/useGithubProjects.ts` — React 훅
- `apps/web/src/ui/pages/ProjectsPage.tsx` — GitHub 섹션 + Confluence 섹션 구성

## Decisions

- `Buffer` 대신 `globalThis.Buffer`(Node.js) + `atob`/`TextDecoder`(브라우저) 폴백 사용 — wiki-core가 브라우저 타입 설정을 유지하기 위해
- GitHub 미설정 시 ProjectsPage에서 섹션 자체를 숨김 (에러 표시 없음)

## Gaps

- 프로덕션 서버리스 핸들러에 GitHub 엔드포인트 미추가 (배포 재개 시점에 진행)
- GitHub 실제 응답 E2E 확인은 토큰 제공 후 진행 필요
