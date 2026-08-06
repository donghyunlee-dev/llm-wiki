# lesson-nav-fix-and-pretendard-font Spec

## Problem Statement
1. 레슨 리더의 "이전" 버튼이 항상 비활성 상태처럼 동작한다는 사용자 지적 — 현재 콘텐츠는 레슨당 씬이 1개라 "이전"이 레슨 경계를 넘지 못하고 항상 죽어있었다("다음"은 레슨 경계를 넘도록 이미 구현돼 있어 비대칭).
2. 전체 폰트를 Pretendard 기반으로 교체 요청, 본문/코드-인용구 폰트 스택 지정, Pretendard woff2 설치 여부 확인 요청.

## Business Context
- 네비게이션 비대칭은 실사용 중 바로 체감되는 버그다.
- 폰트는 브랜드/가독성 일관성을 위한 요청.

## Scope
- `getPreviousLessonSlugFrom`(wiki-core) 신규 추가, `goPrevious()`가 레슨 경계를 넘어 이전 레슨의 마지막 씬으로 이동하도록 수정, "이전" 버튼 `disabled` 조건 수정.
- `pretendard` npm 패키지 설치(woff2 폰트 미설치 상태였음 — 확인 후 설치), 가변 폰트 + 유니코드 서브셋 지연 로딩 방식 적용.
- `--font-sans`/`--font-mono` 토큰을 앱 레벨(`apps/web/src/styles.css`)에서 오버라이드.
- 코드/인용구(blockquote) 요소에 모노스페이스 폰트 적용.

## Out Of Scope
- 디자인 시스템 패키지(`@sfood/ui`) 자체의 폰트 토큰 변경 없음(앱 레벨 오버라이드만).
- 정적(비가변) Pretendard 웨이트별 파일 사용 안 함(가변 폰트로 대체).

## User Or Operator Scenarios
- 사용자가 두 번째 이후 레슨의 첫(유일한) 씬에서 "이전"을 누르면 이전 레슨의 마지막 씬으로 이동한다.
- 첫 번째 레슨의 첫 씬에서는 "이전"이 비활성 상태를 유지한다.
- 모든 화면의 본문이 Pretendard로, 코드/인용구가 모노스페이스로 표시된다.

## Acceptance Criteria
- AC1: 두 번째 이후 레슨에서 "이전" 클릭 시 이전 레슨의 마지막 씬으로 정확히 이동한다.
- AC2: 첫 번째 레슨의 첫 씬에서는 "이전" 버튼이 비활성 상태다.
- AC3: 본문 텍스트가 Pretendard(가변 폰트)로 렌더링되고, 폰트 로드 실패 시 맑은 고딕→Malgun Gothic→Arial→sans-serif 순으로 폴백한다.
- AC4: 코드/인용구 영역이 Consolas/Menlo/Monaco/맑은 고딕 모노스페이스로 렌더링된다.

## Edge Cases
- `courseId`/`order`가 없는(unordered) 레슨이 섞여 있을 때 `getPreviousLessonSlugFrom`이 오작동하지 않아야 한다 — `listLessonDocumentsFrom`과 동일한 정렬 기준을 재사용해 일관성 보장.

## Assumptions
- 실 콘텐츠는 레슨당 씬 1개 구조를 유지하므로, "이전 레슨의 마지막 씬"이 사실상 "이전 레슨의 유일한 씬"과 같다(다만 코드는 다중 씬 레슨에도 동작하도록 일반화해서 작성).

## Clarifications
- Q: "Pretendard" 정확히 그 이름을 쓸지, npm 패키지의 가변 폰트 패밀리명("Pretendard Variable")을 쓸지?
- A: 성능(가변 폰트 1세트로 전체 굵기 커버 + 서브셋 지연 로딩) 이점 때문에 "Pretendard Variable"을 사용하기로 결정(Codex 리뷰로 문제 없음 확인 예정).
