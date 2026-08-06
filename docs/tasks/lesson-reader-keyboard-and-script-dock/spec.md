# lesson-reader-keyboard-and-script-dock Spec

## Problem Statement
사용자 피드백 3건:
1. 키보드로 씬을 넘길 때 Space/PageDown/PageUp 등 "아래로" 계열 키까지 다음/이전으로 동작해, "교육 설명" 긴 텍스트를 읽으려고 스크롤하면 씬이 넘어가 버림 — 좌우(ArrowLeft/ArrowRight)만 남겨야 함.
2. "교육 설명"이 길어지면 페이지 전체가 늘어나며 스크롤이 생김 — 하단 컨트롤 바 위에 고정하고, 그 안에서만 스크롤되게 해야 함.
3. "숨기기" 텍스트 버튼을 아이콘으로 바꾸고, 누르면 컨트롤 바에 붙어 접히는 형태로.

## Scope
- 전역 키보드 핸들러에서 Space/PageDown/PageUp 제거, ArrowLeft/ArrowRight(+기존 Home/End)만 유지.
- "교육 설명" 패널 + 하단 컨트롤 바를 하나의 고정 dock으로 묶고, 패널 본문에 자체 스크롤(`max-h-[26vh] overflow-y-auto`) 적용.
- "숨기기/보기"를 회전하는 셰브론 아이콘 버튼으로 교체, 접으면 슬림 헤더 한 줄만 dock에 남음.
- (구현 중 발견) `transitionToNext` 배너를 같은 dock 안으로 이동, dock 높이를 `ResizeObserver`로 실측해 본문 하단 여백에 정확히 반영.

## Out Of Scope
- 레슨 목록(`/lesson`) 화면 변경 없음.
- 마우스 휠/트랙패드 스크롤 네비게이션(`useLessonWheelNavigation`) 동작 변경 없음(사용자가 명시한 것은 키보드).

## Acceptance Criteria
- AC1: ArrowLeft/ArrowRight만 씬을 이동시키고, Space/PageDown/PageUp은 아무 동작도 하지 않는다.
- AC2: "교육 설명" 본문이 길어도 페이지 전체가 아니라 패널 내부에서만 스크롤된다.
- AC3: 패널이 하단 컨트롤 바에 항상 맞닿아 있다(펼침/접힘 모두).
- AC4: "숨기기/보기"가 텍스트가 아닌 회전하는 아이콘 버튼이며, 접힌 상태는 컨트롤 바에 붙은 슬림 헤더로 표시된다.
- AC5: 씬 콘텐츠(다이어그램/카드 등)가 dock에 가려져도 스크롤하면 완전히 볼 수 있다(영구적으로 가려지는 콘텐츠 없음).

## Edge Cases
- "교육 설명"이 없는 씬: dock에는 컨트롤 바만 남는다.
- `transitionToNext`가 없는 씬: 배너 행이 렌더링되지 않는다.
- 씬이 바뀔 때 이전 씬의 패널 스크롤 위치가 남지 않고 새 씬은 항상 맨 위부터 보인다(본문에 씬별 `key` 부여).

## Assumptions
- ResizeObserver는 실제 브라우저에서는 표준 API이고, 테스트 환경(jsdom)에는 없으므로 `typeof ResizeObserver === "undefined"` 가드로 안전하게 스킵한다.

## Clarifications
- 없음(이전 대화에서 이미 방향 합의됨, 이번엔 구현 지시).
