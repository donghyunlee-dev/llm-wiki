# lesson-player-slice-3 Spec

참조 설계: `docs/prd/lesson-player-design.md`("모션 토큰 권장값", "Scene 모델 > 지원 Motion Preset"). Slice 1·2 완료 후, 사용자가 확정한 순서(Scene Type → **Motion** → Interactive → Backend API)의 세 번째 단계.

## Problem Statement

- 현재 장면 전환은 즉시 전환(트랜지션 없음)이며, 설계서가 요구하는 "학습 흐름이 끊기지 않는" 전환 경험이 없다.
- 설계서는 9개 Motion Preset과 모션 토큰(duration/distance/easing)을 정의하지만, 어떤 CSS/라이브러리로 구현할지는 사용자가 "순수 CSS transition/animation"으로 확정했다.

## Business Context

- 사용자가 전체 설계서 중 콘텐츠 무관 항목을 순서대로 요청했고, Motion이 세 번째다. 새 라이브러리(motion.dev 등)를 추가하지 않기로 확정했으므로 CSS keyframes/transition만으로 구현한다.

## Scope

1. 모션 토큰을 CSS 커스텀 프로퍼티로 도입(duration: instant/fast/normal/scene, easing: enter/exit).
2. 장면 진입 애니메이션(`fade`+`slide` 계열) — 다음/이전 이동 방향에 따라 좌우 어느 쪽에서 들어오는지 다르게 표현한다. React key 교체로 장면이 다시 마운트될 때 자동으로 재생된다(추가 JS 상태 없이 CSS `animation`만으로 구현).
3. `prefers-reduced-motion: reduce`에서는 이동/확대 애니메이션 대신 매우 짧은 fade만 사용한다(설계서 원칙).
4. Knowledge Check 옵션 선택 시 `highlight` 계열의 짧은 피드백 애니메이션.
5. 장면 전환 잠금(설계서 "전환 잠금" 원칙) — 애니메이션 재생 중 추가 다음/이전 입력을 무시해 빠른 연속 입력으로 장면이 튀는 것을 방지한다.

## Out Of Scope

- Reveal 단계별 점진적 공개(step-reveal/stagger) — 이는 Player 상태 모델 자체를 바꾸는 별도 기능(NEXT가 "다음 Reveal 공개"와 "다음 Scene 이동" 두 가지 의미를 가지게 됨)이라 이번 Slice의 "전환 애니메이션"보다 범위가 크다. 별도 스펙으로 다뤄야 한다.
- `morph`, `path-draw`, `zoom-focus` 등 복잡한 모션(다이어그램 특화) — Interactive 컴포넌트 및 실제 다이어그램 콘텐츠와 함께 다뤄야 의미가 있다.
- Course Map/Reference Panel 전환 애니메이션(이미 존재하는 Drawer는 이번 범위에서 스타일 변경하지 않는다).

## Acceptance Criteria

- AC1: 장면 이동(버튼/키보드/휠) 시 짧은 진입 애니메이션이 재생된다.
- AC2: "다음"으로 이동하면 오른쪽에서, "이전"으로 이동하면 왼쪽에서 들어오는 것처럼 보인다.
- AC3: `prefers-reduced-motion: reduce` 환경에서는 이동감 있는 애니메이션 대신 짧은 fade만 재생된다.
- AC4: 애니메이션 재생 시간(예: 350ms) 동안 추가 다음/이전 입력(버튼·키보드·휠)이 무시된다.
- AC5: Knowledge Check 옵션을 선택하면 짧은 강조 피드백이 보인다.
- AC6: 기존 `pnpm test`, `pnpm typecheck` 통과.

## Edge Cases

- 애니메이션 재생 중 다른 레슨으로 라우팅 이동(`navigate`)이 발생하는 경우: 언마운트되므로 잠금 해제 로직이 없어도 문제없다(컴포넌트 자체가 사라짐).
- 매우 빠르게 연속 클릭: 잠금 시간 동안 무시되므로 장면이 여러 칸 건너뛰지 않는다.

## Assumptions

- 애니메이션 재생 시간은 설계서 모션 토큰의 `duration.scene`(0.52s)이 아니라 좀 더 짧은 `duration.normal`(0.36s) 근사값을 기본으로 사용한다 — 실제 학습 흐름에서 0.52s는 느리게 느껴질 수 있어 UX상 조정(문서화된 의도적 편차).

## Clarifications

- Q: Reveal(단계별 공개)도 이번에 포함하나?
  A: 아니오. Player 상태 모델을 바꾸는 별도 범위라 Out of Scope로 분리했다.
