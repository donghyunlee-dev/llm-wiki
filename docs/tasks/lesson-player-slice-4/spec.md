# lesson-player-slice-4 Spec

참조 설계: `docs/prd/lesson-player-design.md`("인터랙티브 컴포넌트 > Context Window", `lesson.presentation` 스키마의 `scenes[].visual` 예시). 사용자가 확정한 순서의 네 번째 단계 — Interactive 컴포넌트 중 Context Window만 우선 구현(Screenshot Hotspot·Backend API는 보류/제외 확정).

## Problem Statement

- 설계서는 "AI에게 전달되는 정보(지침/이전 대화/파일/새 요청)가 제한된 컨텍스트 창에 들어가고, 넘치면 오래된 정보부터 밀려난다"는 개념을 시각적으로 설명하는 Context Window 컴포넌트를 요구한다. 이는 실제 레슨 콘텐츠에서 파생되는 데이터가 아니라, AI 기초 개념을 설명하는 고정된 개념도(설계서 원문: "지침, 이전 대화, 파일, 새 요청이 하나의 제한된 영역에 들어간다")이므로 콘텐츠 의존 항목이 아니다.
- 현재 `wiki.metadata.presentation.scenes[]`에는 `anchor`/`type`/`layout`만 있고, 어떤 장면에 이 위젯을 넣을지 지정할 방법이 없다.

## Business Context

- 이 컴포넌트는 텍스트만으로는 이해하기 어려운 "컨텍스트 한계" 개념을 시각적으로 보여준다는 설계 의도가 뚜렷하고, 실제 콘텐츠(스크린샷 등)에 의존하지 않으므로 콘텐츠팀 작업과 무관하게 지금 만들 수 있다.

## Scope

1. `wiki.metadata.presentation.scenes[]` 항목에 선택적 `visual: { kind: "context-window"; emphasis?: "overflow" }` 필드 추가(설계서 JSON 예시와 동일한 모양).
2. `LessonScene`에 `visual` 필드를 추가해 파이프라인으로 전달한다.
3. 신규 공통 컴포넌트 `ContextWindowVisual` — 지침/이전 대화/파일/새 요청 4개 항목이 하나의 제한된 영역(컨텍스트 창)에 들어가는 모습을 보여준다. `emphasis: "overflow"`가 지정되면 가장 오래된 항목이 창 밖으로 밀려나는(명도가 낮아지고 위치가 이동하는) 상태를 함께 보여준다.
4. 각 항목에 마우스를 올리면(hover) 그 정보가 답변에 어떤 영향을 주는지 짧은 설명이 나타난다.
5. `mental-model` Scene에 `visual`이 선언된 경우 이 컴포넌트를 장면 블록 위에 렌더링한다.

## Out Of Scope

- Screenshot Hotspot(사용자 확정으로 보류).
- Backend API/캐시 계층(사용자 확정으로 진행하지 않음).
- Context Window 외 다른 Interactive 컴포넌트(Comparison의 hover 강조 등은 이미 존재하는 정적 표로 충분하다고 판단, 이번 범위 아님).
- `visual.kind`의 다른 값(현재는 `context-window` 하나만 인식) — 다른 값은 무시하고 폴백(일반 블록 렌더링만).

## Acceptance Criteria

- AC1: `presentation.scenes[].visual.kind === "context-window"`가 선언된 장면을 열면 4개 항목이 시각적으로 구분되어 표시된다.
- AC2: `emphasis: "overflow"`가 있으면 가장 오래된 항목이 시각적으로 밀려나는 상태(명도 저하 + 위치 이동)로 표시된다.
- AC3: 각 항목에 hover하면 짧은 설명이 나타난다.
- AC4: `visual` 필드가 없는 기존 장면은 이전과 동일하게 동작한다(회귀 없음).
- AC5: 기존 `pnpm test`, `pnpm typecheck` 통과.

## Edge Cases

- `visual.kind`에 인식하지 못하는 값이 오면 조용히 무시하고(검증에서 걸러짐) 컴포넌트를 렌더링하지 않는다 — 장면의 나머지 콘텐츠는 정상 렌더링된다.

## Assumptions

- 이 컴포넌트가 보여주는 4개 항목(지침/이전 대화/파일/새 요청)과 hover 설명 문구는 설계서 원문을 그대로 따르는 고정 콘텐츠다 — 레슨마다 달라지는 데이터가 아니다(콘텐츠팀 의존 없음).

## Clarifications

- Q: Screenshot Hotspot도 포함하나?
  A: 아니오. 사용자가 이번 범위에서 제외하기로 확정했다.
