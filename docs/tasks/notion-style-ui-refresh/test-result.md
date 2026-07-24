# notion-style-ui-refresh Test Result

> 상태: Task 8(최종 검증)이 아직 실행되지 않았다. 아래는 Task 8에서 채워야 할 검증 스켈레톤이며, 실제 명령 실행 결과/스크린샷/Codex 피드백은 포함하지 않는다.

## Scope
- `apps/web`의 Notion/Linear 스타일 개편(Task 1-6) 전체에 대한 회귀 검증: 자동화 테스트/타입체크/빌드 + Playwright 실브라우저 시각 확인(라이트/다크) + Codex 비판 리뷰.

## Environment
- 브랜치: `feature/sfood-design-system-tone`
- 대상 화면: 홈(`/`), 검색(`/search?q=...`), `/guides` 목록, 가이드/문서 상세(예: `/guides/agent-start`)
- 테마: 라이트, 다크(`[data-theme="dark"]` 토글)

## Commands (예정)
- `pnpm test`
- `pnpm typecheck`
- `pnpm --filter @sfood/web build`
- `pnpm --filter @sfood/web dev` (Playwright 확인용 로컬 서버)

## Results
- (Task 8에서 각 명령의 PASS/FAIL 및 근거 로그로 채운다)

## Playwright Checklist (Task 8에서 수행)
- [ ] 홈(라이트): "시작 가이드" 카드에 컬러 테두리/배경(좌측 액센트 바 포함)이 없는지 확인, 검색 hero 구조 불변 확인
- [ ] 검색(라이트): 사용자 질문이 우측 정렬 연한 pill로 렌더링되는지, 답변 영역은 배경 없는 순수 텍스트인지 확인
- [ ] `/guides`(라이트): 구분선 리스트 레이아웃으로 렌더링되는지, `guide` docType only 노출 개수(Frozen Behavior)가 기존과 동일한지 확인
- [ ] 문서 상세(라이트): TOC 스크롤 시 활성 항목이 굵은 텍스트로만(막대 없이) 표시되는지, 긴 제목이 2줄까지 자연스럽게 줄바꿈되는지 확인
- [ ] 위 4개 화면을 다크 모드로 토글 후 동일하게 재확인, 플랫 패널이 배경과 명도 차이로 구분되는지 확인

## Codex Critical Review Checklist (Task 8에서 수행)
- [ ] `ArticlePage.tsx`의 `IntersectionObserver` scroll-spy가 재렌더/페이지 이동 시 옵저버를 누수하지 않는지
- [ ] `.page-panel` 및 관련 요소의 `border`/`shadow` 제거로 라이트/다크 어느 쪽에서도 배경과 완전히 구분 불가능한 요소가 남지 않는지
- [ ] `.document-list`가 `.section-stack` 재사용처(`StaticPageShell.tsx`, `ProjectsPage.tsx`, `ArticlePage.tsx` 메타데이터 칩 행)에 영향을 주지 않는지

## Failure Notes
- (해당 시 기록)

## Retest Results
- (해당 시 기록)

## Acceptance Criteria Coverage
- AC1-AC6: 코드 변경(Task 1-6)으로 구현 완료, Task 8에서 Playwright/자동화 테스트로 실증 예정.
- AC7 (`pnpm test`/`typecheck`/`build`): Task 8에서 실행 및 결과 기록 예정.
- AC8 (Playwright + Codex 리뷰 완료): Task 8에서 수행 예정 — 완료 전까지 이 태스크는 "구현 완료, 최종 검증 진행 중" 상태로 간주한다.
