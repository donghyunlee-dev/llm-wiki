# Test Result

## Commands

```bash
pnpm test
pnpm typecheck
pnpm build
```

## Results

| Check | Result |
|---|---|
| `pnpm test` (wiki-core: 48, web: 28, serverless: 5) | PASS |
| `pnpm typecheck` (wiki-core, web, serverless) | PASS |
| `pnpm build` | PASS |

## Acceptance Criteria Coverage

| 항목 | 결과 |
|---|---|
| 시작 가이드 목록에서 index/router/registry 타입 미노출 | PASS — `NAV_DOC_TYPES` 필터 적용 |
| 홈 추천 목록이 개별 문서 상세 경로로 연결 | PASS — `useWikiData()` 기반 slug 링크 |
| `/api/github/projects` 엔드포인트 구조 추가 | PASS — `GITHUB_TOKEN`/`GITHUB_ORG` 설정 시 동작 |
| 프로젝트 페이지 GitHub 섹션 | PASS — `useGithubProjects()` 훅 + `GitHubProjectsSection` |
| 미설정 시 GitHub 섹션 숨김 | PASS — `projects.length === 0` 시 `null` 반환 |

## Skipped

- 실제 GitHub API 호출 검증 (토큰 미제공)
- 브라우저 E2E 확인 (토큰 제공 후 별도 세션에서)
