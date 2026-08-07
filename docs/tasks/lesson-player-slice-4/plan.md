# lesson-player-slice-4 Plan

## Summary

`LessonScenePresentation`의 scene 항목에 선택적 `visual` 필드를 추가하고, 이를 `LessonScene.visual`로 파이프라인에 흘려보낸 뒤, 프런트엔드에서 `ContextWindowVisual` 컴포넌트로 렌더링한다.

## Impacted Modules

- `packages/wiki-core/src/lib/lessonSemanticBlocks.ts` — `SceneVisual` 타입 추가
- `packages/wiki-core/src/lib/lessonScenes.ts` — `LessonScene.visual` 필드, `presentation.scenes[]`에서 매칭
- `packages/wiki-core/src/lib/wikiDocuments.ts` — `LessonPresentationMetadata.scenes[].visual` 추가
- `packages/wiki-core/src/lib/confluenceClient.ts` — `visual` 파싱·검증(`kind`가 `context-window`가 아니면 무시)
- `apps/web/src/ui/pages/lessonScenes/ContextWindowVisual.tsx`(신규)
- `apps/web/src/ui/pages/LessonReaderPage.tsx` — `scene.visual`이 있으면 `ContextWindowVisual` 렌더링
- `apps/web/src/styles.css` — Context Window 시각화 스타일

## Architecture Approach

- `visual`은 `type`/`layout`과 별개의 옵셔널 필드로, Scene Type 추론 로직에는 영향을 주지 않는다(설계서에서도 `visual`은 `type`/`layout`과 나란히 있는 별도 속성).
- `ContextWindowVisual`은 실제 레슨 데이터가 아니라 고정된 개념 설명 콘텐츠(지침/이전 대화/파일/새 요청)를 렌더링하는 순수 프레젠테이션 컴포넌트다 — props는 `emphasis?: "overflow"` 하나뿐이다.
- Overflow 강조는 CSS로 표현한다(4번째 항목에 낮은 불투명도 + 살짝 밀려난 위치 + "밀려남" 라벨). 마우스 오버 설명은 `title` 속성이 아니라 접근성을 고려해 별도 텍스트 요소를 hover/focus 시 보이는 방식으로 구현한다(키보드 포커스로도 확인 가능하도록 `tabIndex`/`:focus-visible` 대응).

## Validation Plan

- `lessonScenes.test.ts`: `visual` 필드가 presentation에서 scene으로 전달되는지, 없으면 undefined인지.
- `ContextWindowVisual.test.tsx`(신규): 4개 항목 렌더링, `emphasis="overflow"`일 때 밀려남 표시 클래스, hover/focus 시 설명 텍스트 노출.
- Playwright로 실제 hover 인터랙션과 overflow 강조 스타일을 확인.
- `pnpm typecheck`/`pnpm test` 통과.

## Risks

- **hover 설명이 모바일/터치에서 확인 불가**: 이번 범위에서는 데스크톱 우선으로 구현하고, 터치 대응은 후속 과제로 남긴다(설계서도 Screenshot Hotspot 등 터치 대응은 별도 항목으로 다룸).

## Rollback Considerations

- `visual` 필드는 완전히 옵셔널이라, 문제가 생기면 `LessonReaderPage.tsx`의 렌더링 분기만 제거하면 즉시 이전 상태로 복귀한다.
