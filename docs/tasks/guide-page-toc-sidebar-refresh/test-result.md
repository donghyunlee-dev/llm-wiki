# guide-page-toc-sidebar-refresh Test Result

## Scope
- `apps/web/src/styles.css`, `apps/web/src/ui/pages/ArticleAskPanel.tsx` 스타일/상수 변경 검증.
- `ArticlePage`, `StartingGuidePage` 데스크톱/모바일, 라이트/다크 렌더링, Ask 패널 정렬·이중 보더 제거·높이 축소 확인.

## Environment
- 로컬 dev server (`pnpm --filter @sfood/web dev --port 5183`), 목데이터 기반 `useWikiData`.
- Playwright MCP (Chromium), 뷰포트 1280x900(데스크톱), 390x844(모바일).

## Commands
- `pnpm --filter @sfood/web typecheck`
- `pnpm --filter @sfood/web test`
- `pnpm --filter @sfood/web build`

## Results
- `typecheck`: PASS (에러 없음)
- `test`: PASS (16 files, 56 tests)
- `build`: PASS (vite build 성공, dist 산출물 생성 확인)
- Playwright 데스크톱(1280x900) 라이트: PASS — TOC가 좌측 border로 컨텐츠와 분리, 컨텐츠는 TOC 왼쪽 영역 안에서 중앙 정렬.
- Playwright 데스크톱 다크: PASS — 동일 레이아웃, 색상 토큰 정상 반영.
- Playwright Ask 패널 정렬: PASS — `getBoundingClientRect()`로 `.article-body`와 `.article-ask-dock`이 동일하게 `left:119 / right:879`로 픽셀 단위 일치 확인.
- Playwright Ask 패널 확장 상태(질문 1건 등록): PASS — 이중 보더 없이 단일 프레임, 확장 후에도 컨텐츠 컬럼과 정렬 유지.
- Playwright 모바일(390x844): PASS — 가로 스크롤 없음(`scrollWidth === clientWidth === 380`), Ask 패널 폭이 본문 폭과 일치, 뒤로가기 버튼/eyebrow/제목 레이아웃 정상.

## Failure Notes
- Codex 크리티컬 리뷰(6c)에서 지적: `.article-ask-dock`의 폭이 `sm`(640px 이상, xl 미만) 구간에서 `.article-body`보다 넓어 정렬이 어긋남 — `.article-body`는 `.site-shell`(px-3/sm:px-5)과 `.page-shell`(px-4/sm:px-6) 두 겹의 패딩을 거치는데, 기존 dock 폭 계산은 `.page-shell` 쪽 패딩만 반영하고 `.site-shell` 쪽을 누락했음.

## Retest Results
- 위 지적사항 반영: dock 폭을 두 패딩 레이어의 합산 인셋 기준(`base: 3.5rem`, `sm: 5.5rem`)으로 재계산.
- Playwright로 639px(경계 직전), 800px(`sm`~`xl` 사이), 1280px(`xl`), 390px(모바일) 4개 뷰포트에서 `.article-body`/`.article-ask-dock`의 `getBoundingClientRect()`가 모두 정확히 일치함을 재확인. `pnpm typecheck`/`test`(56 통과)/`build` 재실행 통과.

## Acceptance Criteria Coverage
- AC1 (TOC 우측 사이드 패널 분리): 충족 — `xl:border-l xl:border-panel-border-soft` 추가로 시각적 분리 확인.
- AC2 (컨텐츠 중앙 정렬): 충족 — 기존 `mx-auto max-w-[760px]` 유지, TOC 왼쪽 영역 내에서 중앙 정렬 확인.
- AC3 (Ask 패널 정렬): 충족 — `--article-toc-width`/`--article-toc-gap` 공유 토큰 기반 `left: calc(50% - ...)`, `transform: translateX(-50%)`로 픽셀 단위 정렬 확인.
- AC4 (이중 보더 제거/높이 축소/라운드 개선): 충족 — `.article-ask-form` 보더 제거, `COLLAPSED_HEIGHT` 92→68px, `.article-ask` 라운드 `--radius-lg`→`--radius-xl`.
- AC5 (라이트/다크): 충족.
- AC6 (모바일 가로 스크롤 없음): 충족.
- AC7 (typecheck/test/build): 충족.
- AC8 (Playwright 검증): 충족.
