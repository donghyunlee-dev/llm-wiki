# ai-ask-no-ops-context Spec

## Problem Statement
- `aiAsk` 경로가 `ops` 문서를 AI 입력에 함께 넣고 있어서, 문서량이 많을 때 AI 호출 준비가 느려질 수 있다.

## Business Context
- AI 답변 생성은 정책 문서만으로도 충분해야 한다.
- `ops` 문서는 별도 운영 기준 문서로 남겨두되, 현재 AI 입력 경로에서는 제외하는 편이 빠르고 단순하다.

## Scope
- `aiAsk`와 `aiSearch` 입력에서 `ops` 문서를 제거한다.
- 서버에서 `ops` 문서를 AI 프롬프트용으로 적재하지 않도록 정리한다.
- 문서 지침에서 `ops` 제외 사실을 명시한다.

## Out Of Scope
- `ops` 문서 자체를 삭제하는 작업.
- `ops` 관련 문서 검색/수집 로직 전체 정리.

## User Or Operator Scenarios
- 사용자는 더 빠른 답변 생성을 기대한다.
- 운영 문서는 AI 입력이 아니라 별도 기준 문서로 유지한다.

## Acceptance Criteria
- AC1: `aiAsk` 프롬프트에 `ops` 문서가 포함되지 않는다.
- AC2: 서버 캐시 구성에서도 AI 입력용 `ops` 문서 주입이 제거된다.
- AC3: 지침 문서에 `ops` 제외 사실이 반영된다.

## Edge Cases
- `policy` 문서가 비어 있어도 AI 입력은 동작해야 한다.

## Assumptions
- `ops` 문서는 AI 응답 생성의 필수 입력이 아니다.

## Clarifications
- Question: `ops` 문서는 완전히 제거하나요?
- Answer: 아니요. AI 입력에서만 제외합니다.
