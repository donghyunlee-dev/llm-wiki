# lesson-reader-focus-ring-and-rail-centering-fix Spec

## Problem Statement
사용자가 캡처한 스크린샷을 분석해 3가지 문제를 지적했다:
1. 씬 타이틀에 항상 빨간 테두리(포커스 링)가 떠 있음 — 의도된 디자인이 아님.
2. "다음 페이지" 사이드 레일이 화면 위쪽(타이틀 옆)에 떠서, 원래 정한 "우측 하단 고정" 의도와 반대로 구현됨.
3. 사이드 레일을 추가하면서 본문 콘텐츠 자체가 원래의 정중앙 위치에서 왼쪽으로 밀림.

## Scope
1. `.lesson-reader-scene-title`에서 `focus-visible:outline*` 클래스 제거.
2. `.lesson-reader-side-rail`을 상단 고정에서 화면 우측 하단 고정으로 변경.
3. 사이드 레일이 콘텐츠의 중앙 정렬에 영향을 주지 않도록 그리드 구조를 걷어내고 `position: fixed`로 완전히 분리.

## Out Of Scope
- "교육 설명" 패널, 키보드 네비게이션 등 이전에 이미 확정된 동작은 변경하지 않음.

## Acceptance Criteria
- AC1: 타이틀에 `outline: none`(항상), 씬 전환 시에도 빨간 테두리가 보이지 않는다.
- AC2: 2xl(1536px) 이상 화면에서 사이드 레일이 화면 우측 하단(하단 dock보다 위)에 고정 표시된다.
- AC3: 어떤 화면 폭에서도 `.lesson-reader-content`의 좌우 여백이 정확히 동일하다(정중앙 유지).
- AC4: (구현 중 발견) 사이드 레일이 하단 dock(전체 폭 고정)에 가려지지 않는다 — 씬이 짧아 콘텐츠 끝이 dock 영역과 겹치는 경우에도 항상 dock보다 위에 보인다.

## Assumptions
- 콘텐츠는 `lg:max-w-5xl`(64rem)로 항상 고정 폭 중앙 정렬을 유지한다.
- 사이드 레일 폭(220px) + 여백을 감안해 2xl(1536px)부터 노출해야 콘텐츠 폭을 줄이지 않고도 겹치지 않는다.

## Clarifications
- Q: 레일을 콘텐츠 흐름에 맞춰(절대 위치, bottom-of-content) 배치할지, 뷰포트에 완전히 고정(fixed)할지?
- A: 뷰포트 fixed로 확정 — content-relative absolute 배치는 짧은 씬에서 하단 dock(전체 폭, fixed)에 가려지는 문제가 있어 폐기.
