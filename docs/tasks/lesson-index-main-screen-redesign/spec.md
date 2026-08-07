# lesson-index-main-screen-redesign Spec

## Problem Statement
`/lesson`은 교육 콘텐츠의 메인 화면인데 디자인 요소 없이 단조로운 리스트로만 보인다는 피드백. 또한 "완료" 표시를 삭제했음에도 진행 상태 기반 "이어서 학습하기" 기능이 그대로 남아 있어 일관성이 없다는 지적을 받았다.

## Business Context
`/lesson`은 사용자가 교육 콘텐츠에 진입하는 첫 화면으로, 다른 화면과 동일한 스타일을 강제할 필요는 없지만 디자인 시스템 토큰만 사용해 "메인 화면"다운 시각적 완성도를 갖춰야 한다.

## Scope
- `/lesson` 히어로 영역: eyebrow 뱃지 + 큰 헤드라인 + 통계 chip + CTA로 재구성.
- 레슨 리스트: 챕터별 그룹 헤더 + 구분선 기반 행(블로그 리스트 스타일)로 재구성.
- "이어서 학습하기"(진행 상태 기반 재진입) 기능과 그 기반 모듈(`lessonProgress.ts`) 전체 삭제 — 사용자 확인.
- 시작 버튼은 항상 첫 번째 레슨으로 연결.

## Out Of Scope
- 레슨 리더 화면(직전 태스크에서 이미 개편) 재변경 없음.
- 코스 순서/씬 카운트 계산 로직 변경 없음.

## User Or Operator Scenarios
- 사용자가 `/lesson`에 진입하면 교육 과정임을 알리는 히어로와 통계, "학습 시작하기" CTA를 먼저 본다.
- 사용자가 챕터별로 그룹핑된 23개 레슨 목록을 구분선 리스트로 훑어본다.
- 재방문 사용자도 항상 1번 레슨부터 "학습 시작하기"로 진입한다(이전 위치 복귀 없음).

## Acceptance Criteria
- AC1: 히어로 영역이 카드/뱃지/헤드라인/통계칩/CTA 구조로 렌더링된다.
- AC2: 레슨 리스트가 챕터 헤더 + 구분선 행으로 렌더링된다.
- AC3: `lessonProgress.ts`, `markLessonCompleted`(이전 태스크에서 제거)에 이어 `markSceneVisited`/`loadLessonProgress`/`LESSON_COURSE_ID`/`progress_recovered` 참조가 코드베이스에 전혀 남지 않는다.
- AC4: "학습 시작하기" 버튼이 항상 `lessons[0]`으로 연결된다.

## Edge Cases
- 레슨이 1개뿐인 경우: 히어로/리스트 모두 정상 렌더링.
- 챕터가 없는(undefined) 레슨들이 연속될 때 챕터 헤더가 중복 렌더링되지 않음.

## Assumptions
- `outline.lessons`와 `lessons`는 동일한 필터/정렬(`listLessonDocumentsFrom`) 기반이라 인덱스가 항상 같은 레슨을 가리킨다(Codex 리뷰로 확인).

## Clarifications
- Q: "완료" 삭제와 함께 "이어서 학습하기"도 삭제할지?
- A: 삭제(사용자 확인, AskUserQuestion).
