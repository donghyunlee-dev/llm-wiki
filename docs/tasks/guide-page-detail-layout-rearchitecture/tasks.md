# guide-page-detail-layout-rearchitecture Tasks

## Implementation
- [x] 라우트 재배치(`router.tsx`) — ArticlePage/StartingGuidePage를 CardLayout 밖으로
- [x] 신규 flex 기반 레이아웃 CSS(`.guide-detail-*`) 작성, 기존 `position:fixed`/calc 방식 제거
- [x] `ArticlePage.tsx`/`GuidesPage.tsx` JSX 재구성(목차 라벨/스크롤 분리 포함)
- [x] Ask 도크/뒤로가기 버튼 위치 재계산
- [x] `.article-layout`(ProjectDetailPage 전용) 원복 확인, `.site-shell` position:relative 원복
- [x] 홈 blueprint 섹션 렌더 제거 + 데드 CSS/공용 텍스트 헬퍼 정리
- [x] `[Type]` 접두어 stripping 누락 지점 4곳 보완

## Test
- [x] `pnpm --filter @sfood/web typecheck`
- [x] `pnpm --filter @sfood/web test`
- [x] `pnpm --filter @sfood/wiki-core test`
- [x] `pnpm --filter @sfood/web build`
- [x] Playwright: 1280/1920/800/390px, 라이트·다크, 목차 라벨 가시성, 라우팅(`/guides/map`), 텍스트 선택→질문하기
- [x] Codex 크리티컬 리뷰 및 발견 사항(dead CSS, homeContent.ts) 반영

## Documentation
- [x] `test-result.md` 작성
- [x] `result.md` 작성
- [x] `docs/prd/implementation-status.md` 갱신
