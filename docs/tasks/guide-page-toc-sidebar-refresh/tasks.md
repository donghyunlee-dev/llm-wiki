# guide-page-toc-sidebar-refresh Tasks

## Implementation
- [x] `.article-layout` 그리드를 컨텐츠 중앙 정렬 + 우측 TOC 고정 구조로 조정 (`styles.css`)
- [x] `.article-ask-dock` 좌우 위치/폭을 컨텐츠 트랙 중심에 맞춰 보정 (`styles.css`)
- [x] `.article-ask-form`의 중복 보더 제거, `.article-ask`/`.article-ask-dock` 높이 축소, 라운드를 `--radius-xl`로 조정 (`styles.css`, `ArticleAskPanel.tsx`의 `COLLAPSED_HEIGHT`)

## Test
- [x] `pnpm --filter @sfood/web typecheck`
- [x] `pnpm --filter @sfood/web test`
- [x] `pnpm --filter @sfood/web build`
- [x] Playwright: 데스크톱 라이트/다크, 모바일, Ask 패널 확장 상태 확인

## Documentation
- [x] `test-result.md` 작성
- [x] `result.md` 작성
- [x] `docs/prd/implementation-status.md` 갱신
