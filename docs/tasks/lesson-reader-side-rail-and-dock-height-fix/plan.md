# lesson-reader-side-rail-and-dock-height-fix Plan

## Impacted Areas
- `apps/web/src/ui/pages/LessonReaderPage.tsx` (+`.test.tsx`)
- `apps/web/src/styles.css`

## Approach
1. **사이드 레일**: `.lesson-reader-content`와 `.lesson-reader-side-rail`을 `.lesson-reader-body-grid`로 묶고, `transitionToNext`가 있을 때만 `--with-rail` 수정자를 붙여 `xl:` 이상에서 2열 그리드(`minmax(0,1fr) 240px`)로 전환. 기존 하단 dock 안의 배너는 `xl:hidden`으로, 사이드 레일은 `hidden xl:block`으로 반대 전환.
2. **패널 높이**: `.lesson-reader-script-body`의 `max-h-[26vh]` → `max-h-[clamp(96px,22vh,260px)]`.
3. **디버깅(사용자 리포트 계기)**: "교육 설명 숨기기가 안 된다"는 리포트를 받고 systematic-debugging으로 재현 시도 → 재현 실패(토글 자체는 정상). 사이드 레일 작업 검증 중 실측하다가 별도의 실제 버그 발견: `ResizeObserver` 이펙트가 `useEffect(..., [])`라 로딩 스피너 렌더(dock ref는 아직 null) 시점에 한 번 실행되고 끝나버려, 실제 콘텐츠가 마운트된 뒤에도 다시 시도되지 않음 → dock 높이가 영원히 CSS 폴백(8rem)에 머물러 있었음.
   - 1차 수정 시도: `.lesson-reader-content`/`.lesson-reader-body-grid`의 `flex-1` 제거 — 효과 없음(원인 아니었음).
   - 2차 시도: `.lesson-reader-shell`의 `min-height` 제거 — 여전히 CSS 변수가 빈 값이라 근본 원인 아님이 드러남.
   - 실측(`getComputedStyle`로 CSS 변수 직접 확인)으로 `ResizeObserver`가 애초에 관측을 시작하지 않았음을 확인 → 진짜 원인.
   - 근본 수정: `useEffect` deps를 `[]`에서 제거해 매 렌더마다 재등록(이 파일의 keydown 이펙트와 같은 기존 패턴).

## Validation Plan
- `pnpm test` / `pnpm typecheck`
- Playwright: 1366×768(작은 노트북)에서 카드 그리드가 있는 씬을 열어 (a) 초기 화면에서 일부가 dock에 가려도 (b) 스크롤하면 완전히 보이는지, (c) `getComputedStyle`로 CSS 변수/padding-bottom이 실제 dock 높이와 일치하는지 실측. xl 이상에서 사이드 레일 노출, xl 미만에서 하단 dock 배너만 노출 확인.

## Risks
- `ResizeObserver`를 매 렌더 재등록하는 것은 keydown 이펙트와 같은 패턴이라 비용이 무시할 만하다고 판단(이미 이 파일에 선례 있음).
