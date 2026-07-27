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
- 텍스트 드래그 선택 → 질문하기 기능에 대한 별도 브레인스토밍/스펙 작성.
