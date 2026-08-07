# lesson-scene-content-rendering Spec

## Problem

1. 씬 타이틀(`.lesson-reader-scene-title`)에 씬 전환마다 브라우저 기본 포커스 아웃라인이 보인다. 이전 수정에서 커스텀 `focus-visible` 클래스만 제거했고 `outline: none` 대체를 넣지 않아 생긴 회귀다.
2. `lesson.presentation`의 `scenes[].interaction.steps`(예: "이해→연결→완성→확장" 4단계)가 원본에 저작돼 있는데도 `lessonPresentation.ts`의 `compileScene`이 이 필드를 최종 `LessonScene`에 옮기지 않아 화면에 전혀 표시되지 않는다. `visual-split` 레이아웃 씬에서 이 누락이 큰 빈 공간으로 드러난다(실측: `sfood가-claude를-선택한-이유` 레슨, 전역 씬 8/23).

## Scope

- `LessonScene`에 `interaction` 필드 통과 (`lessonPresentation.ts`).
- 씬 본문에 `interaction.steps`를 시각적으로 표시하는 렌더링 추가 (`SceneShell.tsx` 및 그 하위 트리).
- 타이틀 포커스 아웃라인 제거.
- 새로 추가하는 코드는 `@sfood/ui`의 컴포넌트/토큰을 기준으로 삼는다 — 하드코딩된 색상/치수 값을 새로 만들지 않는다.

## Out of Scope

- 기존에 이미 있던 다른 `lesson-block-*`/`lesson-reader-*` 커스텀 CSS 클래스를 전부 `@sfood/ui`로 교체하는 것(이번 태스크가 손대는 범위 밖 — 별도 승인 필요).
- `@sfood/ui` 버전을 이번 커밋 이후 시점으로 추가 업데이트하는 것(이번에 이미 최신 main으로 갱신, 추가 업데이트는 별도 태스크).

## Acceptance Criteria

- AC1: 씬 진입 시 타이틀에 브라우저 기본 포커스 아웃라인이 보이지 않는다(스크린리더 포커스 이동 동작은 유지).
- AC2: `interaction.steps`가 있는 씬에서 각 단계 라벨이 화면에 표시된다.
- AC3: `interaction`이 없는 씬은 기존과 동일하게 동작한다(회귀 없음).
- AC4: 새로 추가된 마크업은 `@sfood/ui`가 노출하는 컴포넌트(`Stepper`) 또는 그 시맨틱 Tailwind 토큰(`text-foreground`, `bg-surface`, `border-brand` 등, `@sfood/ui/tailwind.config.js` 프리셋 경유)만 사용한다.

## Assumptions

- `@sfood/ui`의 React 컴포넌트를 이제 실제로 import할 수 있다(디자인시스템 저장소 이슈 #43 수정 완료, git 의존성 재설치로 dist 생성 확인됨).
- `interaction.kind`는 현재 `"step-reveal"` 한 종류만 관측됐다 — 이번 구현은 `steps: string[]`를 그대로 나열하는 데 집중하고, `kind`별 분기는 필요해지면 추가한다.
