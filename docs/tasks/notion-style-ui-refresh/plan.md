# notion-style-ui-refresh Plan

## Summary
`apps/web`의 시각 톤을 Notion/Linear 스타일의 플랫한 룩으로 개편한다. 카드/패널의 `border`/`box-shadow`를 제거해 배경 톤 차이만으로 구분하고, 좌측 액센트 바 강조 패턴을 전면 제거하고, 타이포그래피/여백을 확대하고, `/guides` 목록을 카드에서 구분선 리스트로 전환하고, TOC에 텍스트-굵기 기반 scroll-spy 활성 표시를 추가하고, 검색 페이지 사용자 질문을 pill 말풍선으로 바꾼다. 거의 모든 변경은 `apps/web/src/styles.css`의 CSS 값 수정이며, 유일한 동작 추가는 `ArticlePage.tsx`의 `IntersectionObserver` 기반 scroll-spy다.

## Impacted Modules
- `apps/web/src/styles.css` — `.page-panel`/`.page-panel-soft`(Task 1), `.empty-card`/`.list-row-link`/`.document-list-item`(Task 1, 4), `.home-card`(Task 1), `.article-aside`(Task 1), `.chat-guide-spotlight`(Task 1), `.home-guide-card`(Task 1), `.home-guide-card-featured`/`.home-guide-card-icon-featured`(Task 2), `.page-shell`/`.article-content`/`.article-paragraph`/`.article-toc`/`.article-toc-link`(Task 3), `.document-list`(신규, Task 4), `.article-toc-link-active`(신규, Task 5), `.chat-message-user`(Task 6)
- `apps/web/src/ui/pages/CategoryPage.tsx:172` — `section-stack` → `document-list` 클래스 교체(Task 4)
- `apps/web/src/ui/pages/ArticlePage.tsx` — TOC scroll-spy 상태(`activeHeadingId`) 및 `IntersectionObserver` 추가(Task 5)
- `apps/web/src/ui/pages/ArticlePage.test.tsx` — 신규, TOC 활성 클래스 클릭 동작 테스트(Task 5)

## Architecture Approach
1. **Task 1 — 핵심 패널/카드 플랫화**: `.page-panel`, `.page-panel-soft`, `.empty-card`, `.list-row-link`, `.document-list-item`(중간 단계), `.home-card`, `.article-aside`, `.chat-guide-spotlight`, `.home-guide-card`에서 `border`/`box-shadow` 유틸리티 제거. 기능 컨트롤(`.control-input`, `.document-field input/select`, `.guide-pagination-button`, `.category-home-link`, `.prompt-composer-button`)은 테두리 유지(스코프 가드레일).
2. **Task 2 — 좌측 액센트/틴트 카드 제거**: `.home-guide-card-featured`/`.home-guide-card-icon-featured`를 브랜드 색 틴트 대신 중립 톤(`bg-card-hover-bg`/`bg-panel-bg`)으로만 구분.
3. **Task 3 — 타이포그래피/여백 확대**: `.page-shell` 패딩 확대, `.article-content`/`.article-paragraph` 폰트 13px→14px·`leading-6`→`leading-7`, `.article-toc`/`.article-toc-link` 간격 확대.
4. **Task 4 — `/guides` 카드→구분선 리스트**: `.section-stack`은 다른 페이지(`StaticPageShell.tsx`, `ProjectsPage.tsx`, `ArticlePage.tsx` 메타데이터 칩 행)가 재사용하므로 직접 수정하지 않고, 신규 `.document-list`(`divide-y divide-panel-border-soft`) 클래스를 `CategoryPage.tsx`에 적용. `.document-list-item`은 `rounded`/`bg` 제거하고 `px-1 py-4` 구분선 스타일로 재작성.
5. **Task 5 — TOC scroll-spy**: `ArticlePage.tsx`에 `activeHeadingId` 상태와 `IntersectionObserver`(`rootMargin: "-96px 0px -70% 0px"`)를 추가해 현재 뷰포트에 있는 헤딩을 추적. TOC 링크 클릭 시에도 즉시 `activeHeadingId`를 갱신. `.article-toc-link-active`는 `font-semibold text-page-fg`만 적용(막대/배경 없음).
6. **Task 6 — 검색 사용자 말풍선**: `.chat-message-user`를 `bg-accent text-white` 솔리드 블록에서 `rounded-[999px] bg-accent-soft text-page-fg` pill로 교체.
7. 기존 CSS 유틸리티 클래스 네이밍 패턴(`chat-*`, `article-*`, `site-*`)을 따르고 새 클래스 체계를 도입하지 않는다.

## Data And API Impact
- 없음. 순수 프레젠테이션 계층(CSS 값 + 하나의 UI 상태) 변경이며 API 계약, 데이터 스키마, 검색/AI 로직에는 영향을 주지 않는다.

## Validation Plan
(Task 8, 이 태스크 문서 작성 시점 기준 아직 미실행 — 별도 세션에서 수행)
- `pnpm test && pnpm typecheck && pnpm --filter @sfood/web build` 전체 통과 확인.
- Playwright MCP — 라이트 모드 4개 화면(`/`, `/search?q=...`, `/guides`, `/guides/agent-start` 등):
  - 홈: "시작 가이드" 카드에 컬러 테두리/배경이 없는지 확인.
  - 검색: 사용자 질문이 연한 pill로 렌더링되는지 확인.
  - `/guides`: 구분선 리스트 레이아웃, guide docType only 개수 불변 확인.
  - 문서 상세: TOC 활성 항목이 굵은 텍스트로만 표시되는지(막대 없음), 긴 제목이 2줄까지 자연스럽게 줄바꿈되는지 확인.
- Playwright MCP — 다크 모드에서 동일 4개 화면 재확인, 플랫 패널이 배경과 구분되는 명도 차이를 유지하는지 확인.
- Codex 비판 리뷰: `IntersectionObserver` 옵저버 누수 여부, `border`/`shadow` 제거 후 배경과 구분이 전혀 없는 요소 존재 여부, `.document-list`가 `.section-stack` 재사용처(`StaticPageShell.tsx`, `ProjectsPage.tsx`, `ArticlePage.tsx`)에 영향을 주지 않는지 확인.
- 결과는 `test-result.md`에 명령/결과/Playwright·Codex 근거로 기록.

## Risks
- `/guides` 카드→구분선 리스트 전환이 `CategoryPage.test.tsx`의 구조 의존 assertion을 깰 가능성 — Task 4에서 기존 테스트가 텍스트/무관 클래스명만 검증함을 확인해 완화됨(구현 시 실제 실행으로 재확인 필요).
- "완전히 플랫" 원칙이 지나치면 접근성(경계 인지) 이슈가 생길 수 있음 — 포커스 링/hover 상태를 명확히 유지해 대비.
- `@sfood/ui` React 컴포넌트는 여전히 이 실행 환경에서 dist 빌드 산출물이 반영되지 않는 제약이 있어 CSS 토큰 레벨 작업으로 한정됨(직전 태스크에서 이미 기록된 Open Gap, 이번 세션도 동일).

## Rollback Considerations
- 모든 변경은 `feature/sfood-design-system-tone` 브랜치에서 Task 단위로 개별 커밋되어 있어 필요 시 `git revert`로 커밋 단위 되돌리기가 가능하다.
- 문제가 발견되면 해당 커밋들만 되돌리고 이 태스크 문서(`docs/tasks/notion-style-ui-refresh/`)에 Open Gap으로 기록한다.
