# Spec: GitHub 프로젝트 README 상세 페이지

## Problem

프로젝트 목록 및 홈 화면의 프로젝트 카드가 GitHub URL로 직접 연결되어 있어,
사용자가 앱을 벗어나게 된다. README 내용을 앱 내 상세 페이지로 보여줘야 한다.

## Scope

- `ProjectsPage` 카드 링크를 내부 `/projects/:slug`로 변경
- `HomePage` 추천 프로젝트 링크를 내부 링크로 변경
- `/projects/:slug` 라우트에서 README 마크다운을 렌더링하는 상세 페이지 제공
- 상세 페이지에 GitHub 레포지터리 링크 노출 (외부 접근 경로는 유지)

## Out of Scope

- GitHub 이외의 소스에서 프로젝트 데이터 로딩
- 프로젝트 검색/필터 기능 변경
- README 이미지 인라인 렌더링
- 프로젝트 상세 AI Ask 기능

## Scenarios

### S1: 프로젝트 목록 → 상세 페이지 진입
- 사용자가 `/projects` 목록에서 카드를 클릭하면 `/projects/:slug`로 이동
- 더 이상 새 탭으로 GitHub 페이지가 열리지 않음

### S2: README 있는 프로젝트 상세 페이지
- `/projects/:slug`에서 프로젝트 이름, README 마크다운, GitHub 링크를 표시

### S3: README 없는 프로젝트 상세 페이지
- README가 null이면 description + "README가 없습니다" 안내 표시

### S4: 존재하지 않는 slug
- 프로젝트 목록에 없는 slug 접근 시 "프로젝트를 찾을 수 없습니다" 상태 패널 표시

### S5: 홈 → 상세 페이지 진입
- 홈 화면 "프로젝트 사례" 섹션의 항목이 내부 링크로 연결됨 (↗ 아이콘 제거, → 유지)

## Acceptance Criteria

- [ ] `ProjectsPage` 카드 클릭 시 외부 GitHub URL이 아닌 내부 라우트로 이동
- [ ] `/projects/:slug` 페이지가 README 마크다운을 렌더링
- [ ] 상세 페이지에 GitHub 원본 링크 버튼이 표시됨
- [ ] README 없는 프로젝트도 상세 페이지가 깨지지 않음
- [ ] 존재하지 않는 slug 접근 시 에러 상태 패널 표시
- [ ] `HomePage` 추천 프로젝트 항목이 내부 링크로 연결됨
- [ ] `pnpm typecheck` 통과
- [ ] `pnpm test` 통과

## Edge Cases

- `project.name`에 슬래시나 특수문자가 포함된 경우 (GitHub 레포 이름 규칙상 불가, 무시)
- README markdown에 HTML 태그 포함 시 → 텍스트로 처리
- `readmeMarkdown`이 매우 긴 경우 → 서버에서 10,000자 cap 적용

## Assumptions

- 슬러그는 `project.name` 그대로 사용 (이미 URL-safe kebab-case)
- README 마크다운 렌더링은 기존 `parseStructuredAnswerBlocks` 파서 재사용 가능
- 전체 README 마크다운은 GitHub 프로젝트 로딩 시 함께 캐시에 저장
