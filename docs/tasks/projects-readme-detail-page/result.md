# Result: GitHub 프로젝트 README 상세 페이지

## Delivered Scope

- `GitHubProject` 타입에 `readmeMarkdown: string | null` 추가 (10,000자 cap)
- `fetchRepoReadmeSummary` → `fetchRepoReadme`로 통합, 전체 마크다운 반환
- `ProjectDetailPage` 신규 생성: README 마크다운 렌더링 + GitHub 링크
- `projects/:slug` 라우트를 `ProjectDetailPage`로 교체
- `ProjectsPage` 카드: `<a target="_blank">` → `<Link to="/projects/:slug">`
- `HomePage` 추천 프로젝트: `external: true` + GitHub URL → 내부 `/projects/:name`

## Decisions

- 슬러그는 `project.name` 그대로 사용 (GitHub 레포 이름 = URL-safe)
- README 렌더링에 `StructuredAnswerView variant="article"` 재사용
  (normalizeAnswerText는 GitHub README에 안전, filterVisibleAnswerBlocks는 한국어 AI 섹션명만 숨김)
- `readmeSummary`(목록 카드용 요약)와 `readmeMarkdown`(상세 페이지용 전체) 분리 유지

## Gaps

- 브라우저 시나리오 검증: GitHub 토큰 미설정 환경이므로 실제 데이터 확인 불가
- 상세 페이지 AI Ask 기능: out of scope (spec 명시)
