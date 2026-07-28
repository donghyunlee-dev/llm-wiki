# guide-page-detail-layout-rearchitecture Test Result

## Scope
- 라우트 재배치, 신규 flex 레이아웃, TOC 라벨 버그 수정, Ask 도크/뒤로가기 위치, 홈 blueprint 숨김, `[Type]` 접두어 필터 보완 전체 검증.

## Environment
- 로컬 dev server(`pnpm --filter @sfood/web dev --port 5183`), 목데이터 기반 `useWikiData`.
- Playwright MCP(Chromium), 뷰포트 1280x900/1920x700/800x1400/390x844.
- Codex MCP(read-only sandbox)로 전체 diff 크리티컬 리뷰.

## Commands
- `pnpm --filter @sfood/web typecheck`
- `pnpm --filter @sfood/web test`
- `pnpm --filter @sfood/wiki-core test`
- `pnpm --filter @sfood/web build`

## Results
- `typecheck`: PASS
- `test`(web): PASS — 17 files / 68 tests (HomePage 테스트를 blueprint 숨김에 맞춰 갱신)
- `test`(wiki-core): PASS — 12 files / 171 tests
- `build`: PASS
- Playwright 1280px: PASS — `.article-body`/`.article-ask-dock`이 119-879로 정확히 일치, TOC가 1006-1246(뷰포트 우측 padding만큼), `.guide-detail-shell`이 site-main 전체 폭(0-1270) 사용 확인.
- Playwright 1920px: PASS — TOC가 실제 뷰포트 우측 끝(34px 여백, sm:px-6+스크롤바)에 위치, 본문/Ask도크 439-1199로 일치. 본문-TOC 간 447px 여백은 "TOC는 끝에, 본문은 독립적으로 중앙" 요구사항의 의도된 결과로 확인.
- Playwright 800px(태블릿): PASS — 목차가 본문 아래 일반 흐름으로 스택, 가로 스크롤 없음(scrollWidth===clientWidth).
- Playwright 390px(모바일): PASS — 본문/도크/뒤로가기 버튼 모두 16px(px-4)로 일치, 가로 스크롤 없음.
- Playwright 목차 라벨 버그 재현 및 수정 확인: 뷰포트 높이를 700px로 좁혀 목차 내부 스크롤(`scrollHeight 694 > clientHeight 560`)을 강제한 뒤 마지막 항목 클릭 → "목차" 라벨(`headerVisible: true`) 항상 표시됨 확인(스크린샷으로도 확인).
- Playwright 라우팅 확인: `/guides/map`이 `GuideIndexGraphPage`("문서 지도를 불러오는 중")로 정상 라우팅되어 `guides/:slug`에 가려지지 않음을 확인.
- Playwright 텍스트 선택→질문하기: 새 레이아웃에서도 선택→버튼→클릭→Ask 인풋 채움/포커스 정상 동작 확인.
- Playwright 홈 화면: `.home-blueprint` 요소 없음, "만들고 싶은 방향이 정리되었나요" 텍스트 없음 확인.
- Codex 크리티컬 리뷰: 라우팅 정확성/flex 박스 모델/sticky 동작/Ask 도크 cascade/TOC 라벨 구조적 안전성/접두어 stripping이 표시 전용인지 모두 확인 — 2건 발견(데드 `.home-blueprint*` CSS, `homeContent.ts`의 `collectVisibleText`가 숨겨진 텍스트를 여전히 포함) → 둘 다 즉시 수정 후 재검증(`pnpm test` 전체 재실행 통과).

## Failure Notes
- 없음. Codex가 발견한 2건은 모두 Low severity(런타임 버그 아님)였으며 즉시 반영함.

## Retest Results
- Codex 발견사항 반영 후 `pnpm --filter @sfood/web test`(68/68), `pnpm --filter @sfood/wiki-core test`(171/171), `typecheck`, `build` 전체 재실행 통과.

## Acceptance Criteria Coverage
- AC1~AC9: 위 Playwright/Codex 검증으로 모두 충족.
