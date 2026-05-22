# Plan: GitHub 프로젝트 README 상세 페이지

## Impacted Areas

| 파일 | 변경 유형 |
|---|---|
| `packages/wiki-core/src/lib/githubClient.ts` | `GitHubProject` 타입 확장, README 전체 마크다운 저장 |
| `apps/web/src/ui/pages/ProjectDetailPage.tsx` | 신규 생성 |
| `apps/web/src/router.tsx` | `projects/:slug` 라우트 교체 |
| `apps/web/src/ui/pages/ProjectsPage.tsx` | 카드 링크를 내부 라우트로 변경 |
| `apps/web/src/ui/pages/HomePage.tsx` | 추천 프로젝트 `external` 플래그 제거 |

## Approach

### 1. `GitHubProject` 타입 확장

`readmeSummary` (기존 ~300자 요약) 유지, `readmeMarkdown: string | null` 추가.
`fetchRepoReadmeSummary` 함수 내에서 full markdown도 함께 반환하도록 수정.
서버 응답 크기 제어를 위해 10,000자 cap 적용.

### 2. `ProjectDetailPage` 신규 생성

- `useParams()`로 `slug` 취득
- `useGithubProjects()`로 프로젝트 목록 조회
- `projects.find(p => p.name === slug)`로 매칭
- 로딩/에러/not-found → `WikiStatePanel` 재사용
- README 렌더링 → `parseStructuredAnswerBlocks` + `StructuredAnswerView` 재사용
- "GitHub에서 보기" 버튼 노출 (`project.htmlUrl`)

### 3. 라우터 변경

`projects/:slug` → `<ProjectDetailPage />` (기존 `ArticlePage category="projects"` 교체)

### 4. `ProjectsPage` 카드 링크 변경

`<a href={project.htmlUrl} target="_blank">` →
`<Link to={/projects/${project.name}}>` (내부 링크)

카드 우측 GitHub 링크는 별도 `<a>` 버튼으로 분리 유지.

### 5. `HomePage` 추천 프로젝트

`external: true` 제거, `href: /projects/${project.name}` 으로 변경.

## Validation Plan

1. `pnpm typecheck` — 타입 오류 없음 확인
2. `pnpm test` — 기존 테스트 통과 확인
3. 브라우저 `/projects` → 카드 클릭 → 내부 라우트 이동 확인
4. `/projects/:slug` 페이지에서 README 렌더링 확인
5. README 없는 프로젝트 상세 페이지 확인
6. 존재하지 않는 slug 접근 시 에러 상태 확인
7. 홈 추천 프로젝트 내부 링크 확인

## Risks

- `readmeMarkdown`을 전체 로딩 시 포함하면 `/api/github/projects` 응답 크기 증가
  → 10,000자 cap으로 제어, 로컬 dev 환경이므로 허용 범위
- `parseStructuredAnswerBlocks`는 AI 답변 마크다운 전용 파서
  → GitHub README 일반 마크다운도 대부분 커버; 완전한 렌더링보다 실용적 수준 목표
