# guide-page-detail-layout-rearchitecture Plan

## Summary
`ArticlePage`/`StartingGuidePage` 라우트를 `router.tsx`에서 `CardLayout`(공용 `site-shell`, `max-w-6xl`) 밖으로 옮겨 `AppLayout`의 직계 자식으로 만든다(`SearchPage`와 동일 패턴). 이렇게 확보한 전체 `site-main` 폭 위에서, TOC와 본문을 순수 flex row(`.guide-detail-row`)로 배치 — TOC는 고정 폭 flex 자식(`xl:sticky`), 본문은 `flex-1` 안에서 `mx-auto`로 중앙 정렬. `position:fixed`+뷰포트 계산식을 전면 제거해 스크롤바 오차의 근본 원인을 없앤다.

## Impacted Modules
- `apps/web/src/router.tsx` — 라우트 재배치
- `apps/web/src/styles.css` — `.guide-detail-shell/-row/-content/-toc/-toc-header/-toc-scroll`(신규), `.article-back-link`/`.article-ask-dock`(재작성), `.site-shell`(원복), `.home-blueprint*`(삭제)
- `apps/web/src/ui/pages/ArticlePage.tsx`, `GuidesPage.tsx` — JSX 재구성
- `apps/web/src/ui/pages/HomePage.tsx`, `HomePage.test.tsx` — blueprint 렌더 제거
- `apps/web/src/ui/pages/ArticleContentRenderer.tsx`, `GuideIndexGraphPage.tsx`, `SearchPage.tsx`, `ArticleAskPanel.tsx` — `stripTitleTypePrefix` 누락 지점 보완
- `packages/wiki-core/src/lib/homeContent.ts` — `collectVisibleText`에서 숨겨진 blueprint 텍스트 제외

## Architecture Approach
- 계산식(calc, 뷰포트 %) 대신 순수 CSS flexbox만 사용 — 스크롤바 폭에 영향받지 않는 유일한 방법임을 이전 2차례의 Codex 리뷰에서 확인.
- TOC "목차" 라벨을 별도 non-scrolling 헤더로 분리해 내부 스크롤 박스와 완전히 독립시킴(sticky-within-scroll 트릭보다 구조적으로 더 안전).
- Ask 도크는 `left`/`right` 양쪽 모두 명시(단일 anchor point 계산식 금지) + `mx-auto`+`max-width`로 중앙 정렬 — 이미 안전성이 검증된 패턴.
- 대괄호 접두어 표시 텍스트 stripping은 매칭/href 로직과 완전히 분리된 지점에만 적용.

## Data And API Impact
- 없음. 순수 라우팅/프레젠테이션 레이어 변경.

## Validation Plan
- `pnpm --filter @sfood/web typecheck`/`test`/`build`, `pnpm --filter @sfood/wiki-core test`
- Playwright: 1280/1920/800/390px, 라이트·다크, 목차 내부 스크롤 후 라벨 가시성, 텍스트 선택→질문하기 플로우, 라우팅 충돌(`/guides/map` 등) 확인
- Codex 크리티컬 리뷰(라우팅 정확성, flex 박스 모델, sticky 동작, Ask 도크 cascade, 접두어 stripping이 표시 전용인지)

## Risks
- 넓은 화면에서 본문-TOC 간 큰 여백 — 요구사항의 의도된 결과로 문서화, 별도 완화 조치 없음.
- 라우트 재배치로 인한 예상치 못한 CSS 상속 누락 — Codex 리뷰로 `.site-shell` 의존 잔존 여부 확인.

## Rollback Considerations
- 단일 커밋으로 처리되어 `git revert` 한 번으로 이전 상태(2차 수정 완료 시점)로 되돌릴 수 있다.
