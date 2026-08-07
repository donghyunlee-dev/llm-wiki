# lesson-player-slice-3 Plan

## Summary

`LessonReaderPage`에 이동 방향(`forward`/`backward`) 상태를 추가하고, 장면 컨테이너에 `data-direction` 속성을 실어 CSS keyframes가 방향별로 다른 진입 애니메이션을 재생하게 한다. 전환 잠금은 애니메이션 지속시간과 동일한 타이머로 구현한다(별도 라이브러리 없음).

## Impacted Modules

- `apps/web/src/styles.css` — 모션 토큰 CSS 변수, `@keyframes`, `prefers-reduced-motion` 대응
- `apps/web/src/ui/pages/LessonReaderPage.tsx` — 방향 상태, 전환 잠금
- `apps/web/src/ui/pages/lessonScenes/SemanticBlockRenderer.tsx` — Knowledge Check 선택 피드백 클래스

## Architecture Approach

- 장면은 이미 `key={`${slug}:${scene.id}`}`로 매 이동마다 새로 마운트되므로(Slice 1에서 Knowledge Check 상태 격리를 위해 도입), 마운트 시 재생되는 CSS `animation`만으로 "장면 진입 애니메이션"이 자연스럽게 구현된다 — 별도의 AnimatePresence류 라이브러리나 exit 애니메이션 조율이 필요 없다(exit 애니메이션은 이번 범위에서 생략, entry만 구현 — 심플함 우선).
- 방향은 `goNext`/`goPrevious`/`handleSelectScene`가 호출될 때 `setDirection("forward"|"backward")`로 기록하고, `.lesson-reader-stage`에 `data-direction`으로 노출한다.
- 전환 잠금: `goNext`/`goPrevious`/휠 핸들러 진입부에 `transitioning` 상태 체크를 추가하고, 애니메이션 지속시간과 같은 `setTimeout`으로 해제한다(설계서 "TRANSITION_END가 누락되는 상황에 대비해 제한 시간 후 잠금을 해제한다" 원칙을 그대로 반영 — CSS `animationend` 대신 고정 타이머를 쓰는 이유는 별도 이벤트 배선 없이 이미 알고 있는 애니메이션 지속시간과 정확히 맞출 수 있어 더 단순하기 때문).

## Data And API Impact

- 없음(도메인 모델 변경 없음, 순수 UI 상태/CSS).

## Validation Plan

- `LessonReaderPage.test.tsx`에 전환 잠금(연속 클릭 시 1칸만 이동) 테스트 추가.
- Playwright로 다음/이전 이동 시 애니메이션 방향, `prefers-reduced-motion` 에뮬레이션 시 애니메이션 최소화, 빠른 연속 클릭 시 장면이 튀지 않는지 확인.
- `pnpm typecheck`/`pnpm test` 통과.

## Risks

- **잠금 시간과 실제 렌더 성능 불일치**: 저사양 환경에서 애니메이션이 지연되면 잠금이 먼저 풀려 다음 입력이 새 애니메이션과 겹칠 수 있다 — 애니메이션 지속시간에 약간의 여유(50ms)를 더해 완화한다.

## Rollback Considerations

- CSS 애니메이션과 잠금 로직은 옵셔널 UX 레이어라, 문제가 생기면 `.lesson-scene`의 `animation` 선언만 제거하고 잠금 상태 체크를 되돌리면 즉시 이전 동작(즉시 전환)으로 복귀한다.
