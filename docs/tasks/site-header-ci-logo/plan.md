# site-header-ci-logo Plan

## Impacted Areas
- `apps/web/public/sfood-logo.png` (신규), `apps/web/public/sfood-logo-dark.png` (신규)
- `apps/web/src/ui/SiteHeader.tsx` (+`.test.tsx`)
- `apps/web/src/styles.css`

## Approach
- 원본(`docs/prd/SFOOD_CI_Normal_Small.png`, 1000×212)을 Pillow로 높이 56px(표시 28px의 2배, 레티나 대비)로 리사이즈해 `apps/web/public/sfood-logo.png`로 저장.
- 다크 배경 대비용으로, "FOOD" 텍스트의 회색(RGB 95,96,98, 순수 그레이스케일 픽셀로 식별)만 밝은 회색(230,232,235)으로 재도색한 버전을 같은 크기로 만들어 `sfood-logo-dark.png`로 저장(빨간 "S"는 원색 유지, 투명 배경/anti-aliasing 알파값은 그대로 보존).
- `SiteHeader.tsx`에서 `useTheme()`의 `resolvedTheme`으로 두 파일 중 하나를 선택해 `<img>`로 렌더링, 옆 텍스트를 "AI WIKI"로 축약.
- `.site-brand-mark` CSS 삭제, `.site-brand-logo`(`h-7 w-auto`) 추가.

## Validation Plan
- `pnpm test` / `pnpm typecheck`
- Playwright: 라이트/다크/모바일(390px)에서 로고 렌더링과 대비 확인.

## Risks
- PNG 재도색은 순수 그레이스케일 픽셀(R≈G≈B) 판별 방식이라, 원본에 안티앨리어싱 경계 외의 다른 회색 요소가 있었다면 함께 바뀔 수 있음 — 이 로고는 빨간 "S"와 회색 "FOOD" 두 색상만 쓰여 문제 없음을 미리보기로 확인.
