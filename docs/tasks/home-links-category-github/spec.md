# Spec: Home links, Category filter, GitHub project integration

## Problem

1. **Home featured list links** — 추천 가이드·프로젝트 사례 목록이 개별 문서가 아닌 카테고리 목록 페이지로 연결됨
2. **Category page list** — 시작 가이드 진입 시 `index`, `router`, `registry` 같은 구조용 문서가 함께 노출되어 실제 콘텐츠 문서가 묻힘
3. **GitHub project integration** — 프로젝트 사례 페이지에 GitHub org 레포지터리 목록과 README 요약을 보여주는 구조 부재

## Scope

- `CategoryPage`: index/router/registry 타입 문서를 목록에서 기본 숨김
- `HomePage`: `useWikiData()` 기반으로 추천 가이드·프로젝트 목록을 실제 문서로 교체 (정적 문자열 제거)
- `githubClient.ts`: GitHub REST API로 org 레포 목록과 README 요약 조회
- `vite.config.ts`: `/api/github/projects` 로컬 개발 엔드포인트 추가
- `useGithubProjects.ts`: React 훅으로 GitHub 데이터 로드
- `ProjectsPage`: GitHub 프로젝트 섹션 추가

## Out of Scope

- GitHub 데이터를 Confluence 데이터와 통합(병합)하는 것
- 프로덕션 서버리스 핸들러에 GitHub 엔드포인트 추가
- GitHub 레포 상세 페이지 라우트

## Acceptance Criteria

- 시작 가이드 목록에 `index`, `router`, `registry` 타입 문서가 기본 노출되지 않는다
- 메인 화면 추천 가이드·프로젝트 사례 항목이 각 문서 상세 페이지(`/{category}/{slug}`)로 이동한다
- `GITHUB_TOKEN` + `GITHUB_ORG` 설정 시 `/api/github/projects`가 레포 목록과 README 요약을 반환한다
- 프로젝트 사례 페이지에 GitHub 섹션이 표시된다 (미설정 시 섹션 미표시)
- `pnpm test`, `pnpm typecheck`, `pnpm build` 모두 통과한다

## Edge Cases

- `WikiDataProvider` 로딩 중에는 빈 목록 또는 스켈레톤 표시
- GitHub API 실패 시 에러 메시지 표시 (Confluence 섹션 영향 없음)
- README가 없는 레포는 `readmeSummary: null`로 처리
- GitHub 레포가 없는 org는 빈 섹션 숨김
