# lesson-reader-side-rail-and-dock-height-fix Result

## Delivered Scope
1. "다음 페이지 안내"를 xl(1280px) 이상 화면에서 콘텐츠 우측 여백의 사이드 레일로 이동.
2. "교육 설명" 패널 높이를 clamp 기반으로 조정해 작은 노트북 모니터에서 덜 지배적이게 함.
3. **"교육 설명 숨기기가 안 된다"는 리포트를 조사하다가 발견한 실제 버그**: `ResizeObserver`가 로딩 완료 후 dock에 붙지 않아, 짧은 씬+작은 화면 조합에서 스크롤 자체가 없어져 dock에 가려진 콘텐츠를 영구히 볼 수 없는 문제를 근본 수정.

## Changed Files
- `apps/web/src/ui/pages/LessonReaderPage.tsx` / `.test.tsx`
- `apps/web/src/styles.css`

## Key Decisions
- **"교육 설명 숨기기" 자체는 버그가 아니었다** — Playwright 실제 클릭과 컴포넌트 테스트 모두 정상 동작을 확인했다. 사용자가 겪은 문제는 이전 세션의 `position: fixed` 배너가 숨기기 버튼과 시각적으로 겹칠 수 있었던 시점의 잔상일 가능성이 높고, 이는 jsdom 기반 컴포넌트 테스트로는 원천적으로 검증할 수 없는 클래스의 버그(실제 브라우저 히트테스트가 필요)라는 점을 확인해 설명했다.
- **조사 과정에서 훨씬 심각한 별도 버그를 발견해 함께 수정** — `useEffect(fn, [])`로 등록한 `ResizeObserver`가 로딩 스피너 렌더 시점(ref가 아직 null)에 한 번 실행되고 다시는 재시도되지 않아, 실제 콘텐츠가 마운트된 뒤에도 dock 높이를 영원히 측정하지 못하고 있었다. 이 때문에 짧은 씬+작은 화면 조합에서는 스크롤 자체가 사라져(`scrollHeight === innerHeight`) dock에 가려진 콘텐츠를 영구히 볼 방법이 없었다 — deps를 제거해 매 렌더 재등록하도록 수정(이 파일의 keydown 이펙트와 동일한 기존 패턴).
- **1차 가설(flex-1, min-height)은 틀렸다** — systematic-debugging 원칙대로 각 가설을 검증하며 진행: flex-1 제거, min-height 제거 모두 시도했지만 실측(`getComputedStyle`)으로 CSS 변수가 계속 비어있음을 확인하고서야 진짜 원인(ResizeObserver 미등록)에 도달했다. 다만 min-height 제거 자체는 부수적으로도 안전하고 더 올바른 설계라 되돌리지 않고 유지.

## Open Gaps
- `ResizeObserver` 타이밍 버그에 대한 자동화 회귀 테스트는 없음(jsdom 환경 제약) — 향후 폴리필을 추가하면 보강 가능.

## Next Steps
- 없음.
