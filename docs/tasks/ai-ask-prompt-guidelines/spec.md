# ai-ask-prompt-guidelines Spec

## Problem Statement
- AI 답변 규칙이 `packages/wiki-core/src/lib/aiAsk.ts` 안에 길게 박혀 있어서, 수정할 때마다 기준을 다시 찾기 어렵다.
- 답변 순서, 읽는 페이지 종류, 정책 문서 처리 규칙을 별도 지침서로 분리해야 한다.

## Business Context
- AI 답변 규칙은 화면 계약과 분리해 두어야 변경 범위가 분명해진다.
- 개발자가 프롬프트를 바꾸기 전에 먼저 읽을 문서가 있으면, 같은 실수를 반복할 가능성이 줄어든다.

## Scope
- AI 답변 지침서를 `docs/prd/` 아래에 추가한다.
- 지침서에 읽는 페이지 종류와 답변 순서를 정리한다.
- `aiAsk.ts`에 지침서 참조를 남긴다.
- PRD 문서 읽기 순서를 새 지침서에 맞게 정리한다.

## Out Of Scope
- AI 답변 로직 자체의 의미 변경.
- 검색 결과 화면 레이아웃 변경.
- 실제 Confluence 데이터 모델 변경.

## User Or Operator Scenarios
- 개발자가 AI 프롬프트를 수정하기 전에 지침서를 먼저 읽는다.
- 개발자가 답변 순서나 페이지 종류를 바꾸려면 지침서와 코드가 함께 바뀐다.

## Acceptance Criteria
- AC1: AI 답변 지침서가 한국어 Markdown 문서로 존재한다.
- AC2: 지침서에 AI가 읽는 페이지 종류와 답변 순서가 명시된다.
- AC3: `aiAsk.ts`가 지침서 확인이 필요하다는 점을 코드 수준에서 드러낸다.
- AC4: PRD 문서의 읽기 순서에 지침서가 포함된다.

## Edge Cases
- 기존 프롬프트 규칙과 지침서 문구가 어긋날 수 있다.
- 답변 유형별 순서가 일부 다를 수 있다.

## Assumptions
- 프롬프트 규칙의 기준은 코드가 아니라 문서와 코드의 조합으로 유지한다.

## Clarifications
- Question: 지침서는 사용자도 읽는 문서인가?
- Answer: 네, 현재는 개발자와 리뷰어가 함께 읽는 기준 문서로 둔다.
