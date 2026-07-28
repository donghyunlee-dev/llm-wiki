# guide-page-toc-sidebar-refresh Result

## Delivered Scope
- `ArticlePage`/`StartingGuidePage`가 공유하는 `.article-layout`에 우측 TOC와 컨텐츠 컬럼 사이 간격을 넓히고(`xl:` 기준 2rem), TOC(`.article-aside`)에 중립 톤 좌측 보더를 추가해 사이드 패널로서의 시각적 분리를 명확히 함.
- 컨텐츠 컬럼(`.article-body`)은 기존과 동일하게 TOC 왼쪽 영역 안에서 `mx-auto`로 중앙 정렬 유지.
- 플로팅 검색(Ask) 패널(`.article-ask-dock`)의 좌우 위치를 `--article-toc-width`/`--article-toc-gap` 공유 토큰 기반 계산식으로 보정해 xl 이상에서 컨텐츠 컬럼과 폭·중심이 정확히 일치하도록 함.
- Ask 패널의 이중 보더 제거(`article-ask-form`의 보더 삭제), 라운드를 `--radius-lg`→`--radius-xl`로 키우고, `COLLAPSED_HEIGHT`를 92px→68px로 축소(`PromptComposer`의 `minRows`도 2→1로 조정).

## Changed Files
- `apps/web/src/styles.css`
- `apps/web/src/ui/pages/ArticleAskPanel.tsx`
- `docs/tasks/guide-page-toc-sidebar-refresh/spec.md`
- `docs/tasks/guide-page-toc-sidebar-refresh/plan.md`
- `docs/tasks/guide-page-toc-sidebar-refresh/tasks.md`
- `docs/tasks/guide-page-toc-sidebar-refresh/test-result.md`

## Key Decisions
- Codex 크리티컬 리뷰가 `sm`~`xl` 구간에서 Ask 패널 폭이 `.article-body`보다 넓어지는 문제(중첩된 `.site-shell`/`.page-shell` 패딩 중 한 쪽만 반영)를 지적 — 두 레이어의 합산 인셋을 기준으로 폭 계산식을 수정하고 4개 뷰포트(639/800/1280/390px)에서 재검증.
- TOC 분리는 별도 컴포넌트 트리 분리가 아니라 기존 2-컬럼 그리드(컨텐츠 fr + TOC 240px)를 유지한 채, 간격 확대 + 중립 좌측 보더로 시각적 분리를 표현하는 방식을 선택 — "no colored accent bar" 원칙과 기존 divider 패턴(`divide-panel-border-soft`)에 부합.
- Ask 패널 위치 보정에 매직 넘버를 두 곳에 중복 기입하지 않도록, `--article-toc-width`/`--article-toc-gap`을 `:root`에 정의하고 그리드와 Ask 패널 CSS 양쪽에서 재사용.
- 하드코딩된 px 라운드 값 대신 기존 `@sfood/ui` 토큰 체계 안의 `--radius-xl`을 그대로 사용.

## Open Gaps
- 텍스트 드래그 선택 → 컨텍스트 메뉴 → "질문하기" 기능은 사용자 확인에 따라 이번 스코프에서 제외 — 별도 태스크로 진행 필요.
- TOC가 없는 문서(헤딩 0개)에서의 컨텐츠 폭 활용은 기존부터 있던 동작(컬럼이 좁게 유지됨)이며 이번 스코프에서 개선하지 않음.

## Next Steps
- 텍스트 드래그 선택 → 질문하기 기능에 대한 별도 브레인스토밍/스펙 작성. (완료 — `docs/tasks/guide-page-text-selection-ask/`)

## 추가 수정 (2026-07-27) — TOC 구조적 분리, 검색창 단일 레이어화

사용자가 직전 구현을 재검토한 결과, 원래 지시("page-shell에서 목차를 빼라", "하나의 검색 영역(div)로 심플하게")가 문자 그대로 반영되지 않았다고 지적함 — 위 "Key Decisions"의 "간격 확대 + 좌측 보더" 방식은 TOC를 여전히 같은 그리드/컨테이너 안에 두는 것이라 구조적 분리가 아니었고, Ask 패널의 `bg-page-bg`/`bg-panel-bg` 배경색 차이가 보더 제거 후에도 "박스 안의 박스"처럼 보이는 문제를 남겼음.

- **TOC 구조적 분리**: `.guide-article-layout`(신규, `ArticlePage`/`StartingGuidePage` 전용)을 단일 컬럼 그리드로 변경하고, `.article-aside`를 `xl:fixed`로 전환해 `.page-shell`/`.page-width` 컨테이너 밖 좌표계에서 화면 우측에 독립적으로 고정. 컨텐츠는 이제 TOC 유무와 무관하게 뷰포트 중앙에 정렬됨. `left` 계산은 `--article-content-width`(760px, 신규 공유 토큰) 기반으로 컨텐츠 우측 끝 + `--article-toc-gap` 지점에 앵커링하고, `min()`으로 좁은 xl 경계(1280~1300px 부근)에서 스크롤바 거터로 인한 미세 오버플로(Playwright로 1280px에서 실측 7px 확인)를 클램프.
- **`.article-layout` vs `.guide-article-layout` 분리**: Codex 크리티컬 리뷰가 `.article-layout`이 `ProjectDetailPage`(TOC 없음)에서도 재사용됨을 지적 — 그리드 변경이 그 페이지 폭에 의도치 않은 영향을 줄 뻔함. `.article-layout`은 원래 정의(2-컬럼 그리드)로 복원해 `ProjectDetailPage` 전용으로 남기고, TOC 분리 동작은 `.guide-article-layout`(신규)로 분리해 `ArticlePage.tsx`/`GuidesPage.tsx`만 사용하도록 className 변경.
- **Ask 패널 검색창 단일 레이어화**: `.article-ask-form`의 `bg-page-bg` 배경을 제거(투명) — 이제 `.article-ask` 하나의 배경/보더만 보이는 완전한 단일 표면.
- **Ask 도크 xl 오프셋 제거**: TOC가 더 이상 그리드 트랙을 공유하지 않으므로, 컨텐츠는 모든 브레이크포인트에서 뷰포트 정중앙에 위치 — 기존 `.article-ask-dock`의 xl 전용 `left`/`transform` 보정 규칙이 불필요해져 제거(단순화).
- 검증: `pnpm typecheck`/`test`(17 files/68 tests)/`build` 통과. Playwright로 1280px(경계값, 클램프 확인)/1920px(클램프 미개입 확인)/800px(태블릿, 정상 스택)/390px(모바일) + 라이트·다크 + 스크롤 중 TOC 고정 유지 + `StartingGuidePage` 재확인. `ProjectDetailPage`는 실제 데이터 로드가 이 환경에서 되지 않아 합성 DOM 요소로 `.article-layout`의 그리드 계산이 원래 값(`1fr 240px`)으로 복원됐음을 직접 확인.

## 추가 수정 (2026-07-27, 2차) — 컨텐츠 중앙 정렬 오정정, 목록으로 돌아가기 위치 보정

바로 위 "추가 수정" 항목이 실제로는 과교정이었음을 사용자가 재차 지적함: TOC를 `xl:fixed`로 분리하면서 컨텐츠를 "TOC 유무와 무관하게 뷰포트 정중앙"에 두도록 만들었는데, 이는 최초 요청("목차 왼쪽 영역을 컨텐츠 영역으로 하고 그 영역 안에서 중앙 정렬")과 다르게 컨텐츠가 site-shell 전체 폭 기준으로 중앙 정렬되어 버리는 회귀였음. 또한 "목록으로 돌아가기" 버튼이 `page-shell`(이 페이지 전용 추가 패딩) 안에 있어 다른 페이지의 컨텐츠 시작 위치와 어긋나 어색하게 떠 보인다는 지적도 반영.

- **컨텐츠 재중앙정렬**: `.guide-article-layout`에 `xl:pr-[calc(var(--article-toc-width)+var(--article-toc-gap))]`를 추가해 TOC의 폭+간격만큼을 컨텐츠 컨테이너 우측에 예약— `.article-body`의 `mx-auto`가 "TOC를 제외한 영역"에서 자연스럽게 중앙 정렬되도록 복원(TOC와 그리드 트랙을 공유하지 않으면서도 시각적으로는 "컨텐츠+간격+TOC"를 하나의 블록으로 뷰포트에 중앙 정렬한 것과 동일한 결과). `.article-aside`/`.article-ask-dock`의 `left` 계산식도 이 오프셋에 맞춰 재도출(Codex가 수식 유도 검증, 세 규칙이 상호 일치함을 확인).
- **목록으로 돌아가기 위치 보정**: `.site-shell`에 `position: relative` 추가(다른 절대/고정 위치 요소는 모두 자신만의 더 가까운 positioned 조상을 이미 갖고 있어 영향 없음을 Codex가 확인). 뒤로가기 링크를 `.page-shell`/`.page-width` 안에서 꺼내 `.site-shell`의 직계 자식(Fragment)으로 이동하고, `absolute left-3 top-3 sm:left-5 sm:top-5`로 `.site-shell` 자신의 패딩과 동일한 값을 부여해 다른 페이지의 컨텐츠 시작 위치와 정확히 일치하도록 함(Playwright로 1280px에서 79px, 390px에서 12px로 `.site-shell`의 패딩 적용 후 콘텐츠 엣지와 픽셀 단위 일치 확인).
- **Codex 리뷰 발견 및 반영**: `GuidesPage.tsx`(`StartingGuidePage`)가 TOC 헤딩이 없는 경우(`gettingStarted` 없음 또는 헤딩 0개)에도 `.guide-article-layout`을 그대로 사용해, 존재하지 않는 TOC를 위한 공간이 예약되는 문제를 지적 — `hasToc` 조건에 따라 `.guide-article-layout`/`.article-layout`을 조건부로 적용하도록 수정(`ArticlePage`는 TOC가 항상 렌더링되므로 — 헤딩 0개여도 "목차가 없습니다" 자리표시자를 보여줌 — 해당 없음).
- TOC 스크롤 관련 버그("스크롤이 내려갔다가 다시 올라왔을 때 목차 텍스트가 안 보임")는 프로그램적 스크롤(`scrollTo`/`scrollBy` 다단계 시뮬레이션), TOC 항목 클릭 후 스크롤, 라이트/다크 모드 조합으로 반복 재현을 시도했으나 재현하지 못함 — 재현 조건(정확한 스크롤 방식, 브라우저, 재현 빈도)을 사용자에게 추가로 확인 필요.
- 검증: `pnpm typecheck`/`test`(17 files/68 tests)/`build` 통과. Playwright로 1280/800/390px + 라이트·다크에서 `.article-body`/`.article-ask-dock`/`.article-aside`/`.article-back-link`의 실측 좌표가 새 수식과 정확히 일치함을 확인. `StartingGuidePage`(TOC 있는 경우)도 동일한 오프셋 중앙 정렬 확인.
