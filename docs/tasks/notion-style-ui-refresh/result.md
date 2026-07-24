# notion-style-ui-refresh Result

> 상태: Task 1-8 전체 완료 (Codex 비판 리뷰만 사용량 한도로 이번 세션에서 수행 불가 — `test-result.md`에 사유와 대체 검증 기록).

## Delivered Scope
- `apps/web`의 시각 톤을 Notion/Linear 스타일로 개편(브랜드 컬러 토큰 체계는 유지, `@sfood/ui` semantic 토큰만 참조):
  - **패널/카드 플랫화**: `.page-panel`/`.page-panel-soft`, `.empty-card`, `.list-row-link`, `.document-list-item`, `.home-card`, `.article-aside`(TOC), `.chat-guide-spotlight`, `.home-guide-card`에서 `border`/`box-shadow`를 제거하고 배경 톤 차이만으로 구분. 버튼/입력/페이지네이션 등 기능 컨트롤은 기존 테두리를 그대로 유지.
  - **좌측 액센트 바/브랜드 틴트 제거**: 홈 "시작 가이드" 카드(`.home-guide-card-featured`)를 브랜드 색 배경/테두리 대신 중립 1px 테두리(`border-panel-border` + `bg-card-bg`)로 재작성 — 최초 시도(배경 톤만으로 구분)는 코드 리뷰에서 라이트모드 시인성 저하와 hover 피드백 상실이 발견되어 수정.
  - **타이포그래피/여백 확대**: `.page-shell` 패딩 확대, `.article-content`/`.article-paragraph`/`.article-list`/`.article-table-wrap table` 본문 폰트 13px→14px·`leading-6`→`leading-7`(코드 리뷰로 리스트/테이블 누락분도 추가 반영), `.article-toc`/`.article-toc-link` 간격 확대.
  - **`/guides` 카드→구분선 리스트 전환**: 신규 `.document-list` 클래스(`divide-y`)를 `CategoryPage.tsx`에 적용. `.document-list-item`은 `.document-list` 내부에서만 divider row 스타일이 적용되도록 중첩 셀렉터로 스코프 한정하고, 베이스 규칙은 카드 스타일로 유지 — 코드 리뷰에서 전역 클래스 변경이 `/projects`/정적 페이지의 시각적 구분을 완전히 없애는 회귀를 발견해 수정.
  - **TOC 활성 헤딩 표시(scroll-spy)**: `ArticlePage.tsx`와 `GuidesPage.tsx`의 `StartingGuidePage`(`/guides/agent-start`, `/guides/start`) **양쪽 모두**에 `IntersectionObserver` 기반 `activeHeadingId` 상태를 추가하고 `.article-toc-link-active`(텍스트 색상 + semibold만, 막대/배경 없음)로 표시. `StartingGuidePage`는 Task 8 Playwright 검증 중 발견된 실제 누락(별도 컴포넌트라 처음에는 기능이 전혀 반영되지 않았음)이라 추가로 수정했다. 2026-05-06에 기록된 "TOC 활성 하이라이트 제거" 결정을 이번 세션의 명시적 요청으로 대체.
  - **검색 사용자 질문 pill 말풍선**: `.chat-message-user`를 솔리드 브랜드 배경 블록에서 `rounded-full bg-accent-soft text-page-fg` 연한 pill로 교체.
- 다크모드는 기존 `[data-theme="dark"]` 토글 메커니즘 위에서 동일한 플랫/좌측-바-금지 원칙을 적용 — Playwright로 4개 화면 모두 라이트/다크 확인 완료.

## Changed Files
- `apps/web/src/styles.css` — 위 모든 컴포넌트 클래스 재작성/신규 추가(`.document-list`, `.document-list .document-list-item`, `.article-toc-link-active`)
- `apps/web/src/ui/pages/CategoryPage.tsx` — `section-stack` → `document-list` 클래스 교체
- `apps/web/src/ui/pages/ArticlePage.tsx` — TOC scroll-spy(`IntersectionObserver`, `activeHeadingId`) 추가
- `apps/web/src/ui/pages/ArticlePage.test.tsx` — 신규, TOC 활성 클래스 클릭 동작 + IntersectionObserver sort 로직 테스트
- `apps/web/src/ui/pages/GuidesPage.tsx` — `StartingGuidePage`에 동일 scroll-spy 로직 추가
- `apps/web/src/ui/pages/GuidesPage.test.tsx` — 활성 클래스 클릭 동작 테스트 추가
- `apps/web/package.json`, `apps/web/vite.config.ts`, `pnpm-lock.yaml` — jsdom 테스트 환경 추가
- `docs/tasks/notion-style-ui-refresh/{spec,plan,tasks,test-result,result}.md` — 이 태스크 문서

## Key Decisions
- `@sfood/ui` React 컴포넌트는 직전 세션에서 확인된 이 실행 환경의 dist 빌드 산출물 미반영 제약이 해소되지 않아, 이번 개편도 CSS 토큰 레벨(`@apply` + 기존 semantic 변수)에서만 진행했다.
- `.section-stack`을 직접 수정하지 않고 `/guides` 전용 `.document-list` 클래스를 신설한 것은, `StaticPageShell.tsx`/`ProjectsPage.tsx`/`ArticlePage.tsx` 메타데이터 칩 행 등 다른 화면이 `.section-stack`을 공유하기 때문 — 회귀 범위를 `/guides`로 격리하기 위한 의도적 선택이다.
- TOC 활성 표시를 텍스트 굵기(semibold)만으로 제한한 것은, 사용자가 명시적으로 거부한 "좌측 액센트 바" 패턴(`feedback_no_ai_cliche_accent_bar` 메모리)을 다시 도입하지 않기 위한 설계 원칙 준수다.
- jsdom을 신규 devDependency로 추가한 것은, 이 저장소가 지금까지 `renderToStaticMarkup`만으로 테스트해 왔고 클릭 인터랙션을 검증하는 테스트가 없었기 때문 — Task 5의 "클릭 시 활성 표시" 요구사항을 실제로 테스트하려면 DOM 이벤트가 필요해 최소 범위로 추가했다(다른 워크스페이스 패키지에는 영향 없음, `apps/edge-sidebar`의 기존 `test: {environment: "node"}` 패턴과 같은 위치에 추가).

## Open Gaps
- **Codex 비판 리뷰 미수행**: `mcp__codex__codex` 호출이 사용량 한도(2026-07-29 이후 재시도 가능)로 실패했다. 대신 `subagent-driven-development` 워크플로우의 2단계(spec-compliance + code-quality) 서브에이전트 리뷰를 Task 1-6 각각에 대해 수행했고, 실제로 3건의 회귀(Task 2 배경 대비, Task 4 전역 클래스 스코프, Task 5 커밋 스코프/테스트 커버리지)를 발견·수정했다. 재시도 가능 시점 이후 전체 diff에 대한 독립 Codex 리뷰를 한 번 더 받는 것을 권장한다.
- `@sfood/ui` React 컴포넌트(Button/Card 등)는 여전히 이 실행 환경의 dist 빌드 미반영 제약으로 사용하지 못했다 — 정상 환경 재검증 후 컴포넌트 단위 교체를 후속 과제로 남긴다.
- 검증 중 발견한 무관 이슈(수정하지 않음, 별도 트리아지 필요): `/search` 일부 질의에서 AI 답변 본문이 빈 문자열로 반환되는 현상(이번 CSS/레이아웃 변경과 무관), `ArticleContentRenderer`의 사전 존재하던 React key 경고.

## Next Steps
- 2026-07-29 이후 Codex 재시도 가능 시 전체 diff 최종 리뷰.
- 사용자 승인 시 `develop` 브랜치로 병합.
- `/search` AI 답변 빈 본문 현상은 별도 이슈로 트리아지.
