# guide-page-toc-sidebar-refresh Plan

## Summary
- `.article-layout` 그리드를 컨텐츠 컬럼이 독립적으로 중앙 정렬되도록 조정하고, TOC(`.article-aside`)는 그 우측에 고정된 별도 패널로 유지한다. 가장 단순한 방법은 그리드 트랙 구성을 `[여백] [컨텐츠 max-width] [TOC 240px] [여백]`처럼 만들어, 컨텐츠 트랙 자체가 화면(또는 `.page-width` 컨테이너) 중앙에 오도록 하는 것이다.
- `.article-ask-dock`은 컨텐츠 컬럼과 동일한 `max-width`/좌우 오프셋 기준을 공유하도록 값을 맞춘다(현재도 `max-w-[760px]`로 같은 값이지만, TOC 트랙이 추가되며 그리드 중심이 이동하므로 재계산 필요).
- Ask 패널은 `.article-ask`(바깥) 하나만 보더를 갖도록 `.article-ask-form`의 `border` 클래스를 제거하고, 높이 상수(`COLLAPSED_HEIGHT`/`EXPANDED_HEIGHT`)와 관련 CSS `max-height`를 축소하며, `--radius-lg` → `--radius-xl`로 라운드를 키운다.

## Impacted Modules
- `apps/web/src/styles.css` — `.article-layout`, `.article-body`, `.article-aside`, `.article-ask`, `.article-ask-dock`, `.article-ask-form` 규칙.
- `apps/web/src/ui/pages/ArticleAskPanel.tsx` — `COLLAPSED_HEIGHT`/`EXPANDED_HEIGHT` 상수 조정(필요 시).
- `apps/web/src/ui/pages/ArticlePage.tsx`, `apps/web/src/ui/pages/GuidesPage.tsx`(`StartingGuidePage`) — 그리드 구조 변경에 따른 JSX 클래스 조정이 필요하면 반영(로직/훅 변경 없음).

## Architecture Approach
- 순수 CSS 레이아웃 조정으로 처리하고 React 로직(TOC 스크롤 동기화, 활성 헤딩 상태 등)은 건드리지 않는다.
- Tailwind `@apply` + `@sfood/ui` semantic 토큰(`--radius-*`, `--color-*` 등)만 사용하고 임의 hex/px 하드코딩을 추가하지 않는다.
- 그리드 중앙 정렬은 CSS Grid의 `grid-template-columns`를 `[여백 트랙] [컨텐츠] [TOC]` 형태로 구성하거나, 컨텐츠 트랙에 `mx-auto`를 유지한 채 전체 그리드의 트랙 비율을 조정하는 방식 중 실제 렌더링 확인 후 더 자연스러운 쪽을 채택한다.
- Ask 패널의 좌우 위치는 `.article-ask-dock`을 `.article-layout`과 동일한 컨테이너(`.page-width`) 기준으로 두고, 컨텐츠 트랙의 중심 오프셋만큼 `margin`/`left` 보정을 주는 방식으로 처리한다(TOC 폭 240px + gap을 고려한 보정값은 기존 `--space-*`/grid gap 토큰을 그대로 활용).

## Data And API Impact
- 없음. 순수 프레젠테이션 레이어 변경이며 데이터/스키마/API 계약에 영향 없음.

## Validation Plan
- `pnpm --filter @sfood/web typecheck`
- `pnpm --filter @sfood/web test`
- `pnpm --filter @sfood/web build`
- Playwright MCP로 다음 조합을 스크린샷 확인:
  - 데스크톱(1280x900) 라이트/다크 — 가이드 상세 페이지(TOC 있는 문서)
  - 데스크톱(1280x900) — TOC 없는 문서(헤딩 0개)
  - 모바일(390x844) — 가로 스크롤/레이아웃 깨짐 여부
  - Ask 패널 확장 상태(질문 1개 이상 등록 후) 정렬 유지 확인
- 코드 리뷰(Codex)로 diff 크리티컬 리뷰 수행.

## Risks
- 그리드 트랙 재구성 시 `xl` 미만 브레이크포인트(1컬럼으로 접히는 좁은 화면)에서 기존 `pt-10`/`article-back-link` absolute 포지셔닝과 충돌 가능 — 좁은 화면에서 반드시 재확인.
- Ask 패널 위치를 컨텐츠 트랙 중심으로 보정할 때 TOC가 없는 문서(트랙 자체가 다르게 렌더링될 수 있음)에서 위치가 어긋날 수 있음 — Edge Case로 별도 확인.
- 높이 축소가 과하면 `PromptComposer`의 최소 인풋 영역(`minRows=2`)과 충돌해 텍스트 잘림이 발생할 수 있음 — 실제 렌더링으로 확인.

## Rollback Considerations
- 모든 변경이 `styles.css`의 클래스 규칙과 소수의 JSX 클래스/상수 조정에 국한되므로, 문제 발생 시 해당 커밋만 `git revert`하면 이전 상태(직전 태스크 완료 시점)로 즉시 되돌릴 수 있다.
