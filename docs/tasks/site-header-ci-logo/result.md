# site-header-ci-logo Result

## Delivered Scope
좌상단 브랜드 마크를 임의의 빨간 "S" 박스에서 실제 SFOOD CI 로고(`docs/prd/SFOOD_CI_Normal_Small.png`)로 교체했다.

## Changed Files
- `apps/web/public/sfood-logo.png` (신규, 라이트 테마용, 264×56)
- `apps/web/public/sfood-logo-dark.png` (신규, 다크 테마용 — "FOOD" 텍스트만 밝은 회색으로 재도색)
- `apps/web/src/ui/SiteHeader.tsx` / `.test.tsx`
- `apps/web/src/styles.css`

## Key Decisions
- **로고 크기는 기존 마크 높이(28px)에 맞춤** — 사이트와 어울리게 하라는 요청에 따라 헤더의 기존 비례를 그대로 유지, 폭은 원본 비율(1000:212)대로 자동 계산.
- **다크 테마 전용 재도색 버전 제작** — 원본 로고를 그대로 다크 배경에 놓으면 "FOOD"의 중간톤 회색이 저대비로 흐리게 보임(사이트가 이미 라이트/다크를 모두 지원하므로 방치할 수 없는 문제로 판단). 빨간 "S"는 원색 유지, 회색 글자만 밝게 재도색해 두 버전을 `resolvedTheme`에 따라 교체.
- **옆 텍스트를 "SFOOD AI WIKI" → "AI WIKI"로 축약** — 로고 자체가 이미 "S FOOD"를 표현하므로 텍스트 중복을 피함.

## Open Gaps
- 없음.

## Next Steps
- 없음.

## 후속 업데이트 (2026-08-11)
공식 다크모드 CI 파일(`docs/prd/SFOOD_CI_Darkmode_Small.png`, 사용자가 직접 업로드)이 제공되어, 임시로 재도색했던 `apps/web/public/sfood-logo-dark.png`를 이 공식 자산으로 교체했다. 원본 크기가 라이트 버전과 동일(1000×212)해 같은 방식(높이 56px)으로 리사이즈만 하면 됐고, 코드 변경은 없었다. 라이트/다크 양쪽 Playwright로 재확인.
