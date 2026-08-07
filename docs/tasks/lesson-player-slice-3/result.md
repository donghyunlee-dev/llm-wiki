# lesson-player-slice-3 Result

## Delivered Scope

- 장면 이동(버튼/키보드/휠/드로어) 시 방향에 맞는 짧은 진입 애니메이션이 재생된다(다음=오른쪽에서, 이전=왼쪽에서).
- `prefers-reduced-motion: reduce` 환경에서는 이동감 있는 애니메이션 대신 짧은 fade만 재생된다.
- 애니메이션 재생 시간 동안 추가 입력을 무시하는 전환 잠금을 추가해, 빠른 연속 입력으로 장면이 여러 칸 건너뛰지 않는다.
- Knowledge Check 옵션 선택 시 짧은 강조 피드백 애니메이션을 추가했다.
- 새 라이브러리 없이 순수 CSS(`@keyframes`, CSS 커스텀 프로퍼티)만으로 구현했다(사용자 확정 방향).

## Changed Files

- `apps/web/src/ui/pages/LessonReaderPage.tsx` — `direction`/`transitioning` 상태, 전환 잠금
- `apps/web/src/styles.css` — 모션 토큰 CSS 변수, 장면 진입 keyframes, Knowledge Check 강조 keyframes, `prefers-reduced-motion` 대응
- `apps/web/src/ui/pages/LessonReaderPage.test.tsx` — 전환 잠금 테스트 추가/갱신

## Key Decisions

- **장면 재마운트를 그대로 활용**: Slice 1에서 Knowledge Check 상태 격리를 위해 이미 장면을 `key`로 매번 새로 마운트하고 있었다. 이 특성을 그대로 이용해 CSS `animation`만으로 "마운트 시 자동 재생"되는 진입 애니메이션을 구현했다 — exit 애니메이션 조율이나 AnimatePresence류 로직이 전혀 필요 없어 매우 단순하다.
- **전환 잠금은 `setTimeout` 고정 시간으로**: `animationend` 이벤트 배선 대신, 이미 알고 있는 CSS 지속시간(0.36s)보다 약간 긴 410ms 타이머로 구현 — 이벤트 리스너 정리(cleanup)를 신경 쓸 필요가 없어 더 단순하다.

## Open Gaps

- Reveal(단계별 점진 공개), `morph`/`path-draw`/`zoom-focus` 등 콘텐츠 특화 모션은 이번 Slice 범위 밖.
- iframe(`CustomHtmlDiagramBlock`) 내부 콘텐츠에는 모션이 적용되지 않는다(sandbox 격리로 인해 부모 CSS가 침투하지 않음 — 의도된 동작).

## Next Steps

- 사용자가 확정한 순서대로 Interactive 컴포넌트(Context Window 등, Screenshot Hotspot 제외)를 다음으로 진행한다.
