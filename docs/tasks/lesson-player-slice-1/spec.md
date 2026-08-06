# lesson-player-slice-1 Spec

참조 설계: `docs/prd/lesson-player-design.md`(AI 기초교육 Lesson Player 개발 설계 계획서) — 이 태스크는 문서의 "권장 첫 번째 구현 Slice" 절을 실제 코드로 옮기는 첫 단계다.

## Problem Statement

- 현재 레슨 리더(`LessonReaderPage.tsx`, `lessonScenes.ts`)는 Confluence 원본 storage HTML을 `dangerouslySetInnerHTML`로 그대로 렌더링한다. Confluence 매크로(코드블록, 콜아웃, Mermaid Forge 확장 등)가 변환되지 않아 화면에 매크로 메타데이터 원문이 그대로 노출되고, 타이포/여백이 브라우저 기본값에 의존해 사이트 전체 디자인 시스템과 어긋난다(2026-07-31 UI/UX 검토에서 확인).
- 장면(Scene) 구분이 H2 제목 유무에만 의존하고, 장면의 학습 역할(Hook/개념/비교/확인 등)·레이아웃·모션을 구분하는 메타데이터가 없어 모든 장면이 동일한 모양으로 렌더링된다.
- 레슨 순서가 `wiki.metadata.next` 체인에만 의존해, 콘텐츠 관리 에이전트가 `next`를 채우지 않은 실제 운영 콘텐츠(18개 레슨 전부 `next: []`)에서 1개 레슨만 노출되는 문제가 있다(별도 기 발견 이슈, 이 태스크의 Course Manifest 스텁으로 함께 해소).

## Business Context

- `docs/prd/lesson-player-design.md`는 Lesson Player 전체를 Course Manifest → Lesson Compiler → Lesson AST → Scene 컴포넌트 파이프라인으로 재설계하는 목표 아키텍처를 정의한다. 전체를 한 번에 구현하면 리스크가 크므로, 설계서의 "권장 첫 번째 구현 Slice"만 세로로 완성해 계약(도메인 모델, Compiler 규격, Player 상태 전이)이 실제 Confluence 데이터로 동작하는지 검증한다.
- 이 Slice가 통과하면 이후 Scene Type·Motion·에이전트 연동은 같은 계약 위에서 확장한다(설계서 "구현 단계" 절).

## Scope

1. **Course Manifest 스텁**: `lesson.course` Content Property(`courseId`, `title`, `lessonIds`, `version`)를 읽어 레슨 순서를 결정한다. Property가 없는 과정은 기존 `next` 체인 폴백을 유지한다(하위 호환, 회귀 방지).
2. **레슨 도메인 모델**: 설계서의 `SceneType`(5종: `hook`, `mental-model`, `process`, `comparison`, `knowledge-check`), `SceneLayout`(4종: `focus`, `visual-split`, `horizontal-flow`, `side-by-side`), `SemanticBlock`(`paragraph`, `bullets`, `steps`, `comparison`, `callout`, `image`, `knowledgeCheck`, `unsupported`) 타입을 `@sfood/wiki-core`에 추가한다.
3. **Lesson Compiler**: Confluence storage HTML(H2로 분리된 각 장면)을 위 `SemanticBlock[]`으로 변환한다.
   - 기존 `confluenceCleanHtml.ts`의 매크로 변환(코드 블록, 콜아웃, 위키링크)을 재사용·확장한다.
   - `lesson.presentation` Content Property의 `scenes[].type`/`layout`이 있으면 그대로 쓰고, 없으면 설계서의 "기본 추론 규칙" 표로 대체한다.
   - 지원하지 않는 요소(임의 HTML, iframe 등)는 삭제하지 않고 `{ kind: "unsupported" }` 블록으로 보존한다.
   - 이번 Slice에서 반드시 고친다: Confluence Mermaid Forge 확장(`ac:adf-extension`, panel 타입 아님)을 인식해 매크로 메타데이터 원문이 노출되지 않게 하고, fallback의 `ac:name="code" language="mermaid"` 내용을 스타일 갖춘 코드 블록으로 렌더링한다.
4. **Scene 컴포넌트 5종**: `HookScene`, `MentalModelScene`, `ProcessScene`, `ComparisonScene`, `KnowledgeCheckScene` — 각각 `SemanticBlock[]`을 받아 SFOOD 디자인 시스템(`docs/tasks/sfood-design-system-tone` 및 기존 `.article-html-fragment`/`wiki-callout` 스타일 계열)에 맞는 레이아웃으로 렌더링한다.
5. **Player 이동**: 기존 이전/다음 버튼 + 방향키(`ArrowLeft/Right`, `Home/End`)를 유지하고, 세로 휠 입력을 좌우 장면 이동으로 해석하는 로직을 추가한다(누적 임계치 방식, 설계서 권장값 참고).
6. **진도 복구**: 기존 `localStorage` 기반 진도 저장(`lessonProgress.ts`)을 재사용하되, 저장 키를 `sceneIndex`가 아닌 안정적인 `sceneId`(H2 anchor) 기준으로 전환한다.

## Out Of Scope

- Motion Preset 시스템(`fade`/`morph`/`path-draw` 등 전체 9종), 모션 토큰, `prefers-reduced-motion` 세부 처리 — 이번 Slice는 장면 전환 시 기본 트랜지션(간단한 fade/slide 정도)만 사용한다.
- 나머지 6개 Scene Type(`concept`, `example`, `screenshot`, `misconception`, `summary`, `closing`).
- Interactive 컴포넌트(Context Window, Screenshot Hotspot).
- Lesson Compiler의 서버측 캐시/ETag 계층, Wiki Backend 신규 API 엔드포인트(`/api/lesson-courses` 등) — 현재처럼 클라이언트에서 `useWikiData()` 문서 목록을 그대로 사용한다.
- 콘텐츠 관리 에이전트 자동 작성/검증 연동, Preview 편집자 도구.
- 접근성 심화 작업(Focus 관리·ARIA 등)은 기존 수준을 유지하고 크게 확장하지 않는다(별도 태스크).
- 모바일 Swipe, Safe Area 대응.
- `docs/tasks/lesson-content-rendering-fix`로 별도 다뤄질 수 있었던 매크로 정리 버그는 이 Slice의 Compiler 작업에 포함되므로 별도 태스크를 만들지 않는다.

## User Or Operator Scenarios

- 사용자가 컨텍스트 레슨(H2 Scene 5개: Hook → Mental Model → Process → Comparison → Knowledge Check)에 진입해 방향키·휠·버튼으로 끝까지 이동하고, 각 장면이 학습 역할에 맞는 레이아웃으로 표시된다.
- 사용자가 Mermaid 다이어그램이 포함된 장면을 봤을 때, 매크로 메타데이터 원문이 아니라 정리된 코드 블록을 본다.
- 사용자가 3번째 장면까지 본 뒤 새로고침하면 같은 장면으로 돌아온다.
- 운영자가 `lesson.course` Content Property 없이 기존처럼 `next` 체인만 채운 레슨 세트를 열어도 기존과 동일하게 동작한다(회귀 없음).

## Acceptance Criteria

- AC1: `lesson.course` Content Property가 있는 과정은 `lessonIds` 순서대로, 없는 과정은 기존 `next` 체인 순서대로 레슨 목록이 만들어진다.
- AC2: H2로 분리된 장면 본문이 `SemanticBlock[]`으로 컴파일되고, 코드/콜아웃/링크 매크로가 사람이 읽을 수 있는 형태로 변환된다(원본 `ac:`/`ri:` 태그나 매크로 파라미터 값이 화면에 노출되지 않는다).
- AC3: Mermaid Forge 확장이 포함된 실제 레슨 페이지를 열었을 때 확장 메타데이터 텍스트가 보이지 않고, mermaid 코드가 스타일 갖춘 코드 블록으로 표시된다.
- AC4: `lesson.presentation`에 명시된 `type`/`layout`이 있으면 그 값대로, 없으면 설계서의 추론 규칙대로 5종 Scene 컴포넌트 중 하나가 선택되어 렌더링된다.
- AC5: 방향키(← →, Home, End), 하단 버튼, 세로 휠 스크롤 세 가지 입력 모두 동일한 장면 이동 결과를 만든다.
- AC6: 세로 휠 입력 시 누적 임계치 이전에는 이동하지 않고, 임계치 도달 후 1회만 이동하며, 이동 직후 일정 시간 같은 방향 재입력을 잠근다.
- AC7: 장면을 이동하고 새로고침해도 `sceneId` 기준으로 마지막 위치가 복구된다.
- AC8: 기존 `pnpm test`, `pnpm typecheck`가 통과한다.

## Edge Cases

- `lesson.presentation`이 아예 없는 레슨: 추론 규칙으로 기본 Scene Type/Layout이 배정되고 렌더링이 실패하지 않는다.
- H2 없이 본문만 있는 레슨: 기존처럼 단일 장면(`concept` 기본값)으로 처리한다.
- `lesson.course.lessonIds`가 실제 존재하지 않는 레슨 ID를 참조: 해당 ID는 건너뛰고 나머지로 순서를 구성하며 콘솔 경고만 남긴다(게시 차단은 이번 Slice 범위 밖).
- 저장된 `sceneId`가 콘텐츠 수정으로 삭제된 경우: 첫 장면으로 폴백한다.
- Mermaid 확장 없이 `ac:name="code" language="mermaid"`만 단독으로 쓰인 경우: 기존과 동일하게 코드 블록으로 표시된다(회귀 없음).
- Knowledge Check 장면에서 선택지를 고르지 않고 다음으로 이동: 허용한다(설계서 원칙 — 정답을 맞혀야만 이동 가능하게 만들지 않음).

## Assumptions

- 이번 Slice는 프런트엔드(`apps/web`, `packages/wiki-core`) 범위로 한정하며, 별도 Wiki Backend API(`/api/lesson-courses` 등)는 만들지 않고 기존 `useWikiData()` 클라이언트 조회 방식을 유지한다.
- `lesson.course`/`lesson.presentation` Content Property는 콘텐츠팀이 아직 채우지 않았을 수 있으므로, 두 속성 모두 "있으면 사용, 없으면 규칙 기반 폴백"으로 구현해 기존 콘텐츠에 대한 회귀가 없어야 한다.
- 대상 검증 레슨은 실제 Confluence의 "컨텍스트와 기억의 한계"류 레슨 중 H2 Scene이 5개 안팎인 것으로 선정한다(정확한 대상은 plan.md에서 확정).

## Clarifications

- Q: Course Manifest(`lesson.course`)가 없는 기존 18개 레슨(전부 `next: []`)은 이번 Slice로 순서 문제가 해결되나?
  A: 콘텐츠팀이 `lesson.course.lessonIds`를 채우면 해결된다. 이번 Slice는 스키마와 읽기 로직만 만들고, 실제 Content Property 입력은 콘텐츠 운영 범위이므로 이 태스크에 포함하지 않는다.
- Q: 매크로 정리 버그 수정을 별도 태스크로 분리하지 않고 이 Slice에 포함하는 이유는?
  A: 설계서의 Compiler "Normalize" 단계가 정확히 이 변환을 요구하므로, 별도로 만들면 동일한 파이프라인을 두 번 만들게 된다. Compiler 작업 안에서 함께 해결한다.
