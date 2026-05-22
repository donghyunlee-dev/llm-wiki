# home-guide-section-spec Spec

## Problem Statement

홈 화면 추천 가이드 섹션의 정확한 동작이 `ui-spec.md`에 잘못 정의되어 있거나 누락되어 있다.
- "5개" → 실제 코드와 사용자 의도는 4개
- 홈 화면에서 가이드를 가져오는 소스(동적 corpus)가 명시되지 않음
- `/guides` 규칙이 실제 구현(guide + page 모두 표시)과 불일치

## Business Context

홈 화면 추천 가이드는 사용자가 위키 입문 시 가장 먼저 접하는 컨텐츠다.
"왜 변경됐지?"라는 혼란이 발생하지 않도록 의도된 동작을 명확히 문서화한다.

## Scope

- `docs/prd/ui-spec.md` 수정:
  - 홈 추천 가이드 섹션 동작 정의 추가 (소스, 필터, 정렬, 개수)
  - "5개" → "4개" 수정
  - Guide List Rules에서 `/guides`가 `guide + page` 모두 표시하도록 수정

## Out Of Scope

- `confluenceSnapshots.ts` 변경 없음
- `HomePage.tsx` 코드 변경 없음

## Acceptance Criteria

- AC1: ui-spec에 홈 추천 가이드의 소스(동적 corpus), 필터(`guide` docType), 정렬(최신순), 개수(4개) 명시
- AC2: "5개" → "4개"로 수정
- AC3: Guide List Rules가 실제 구현과 일치 (guide + page 모두)
- AC4: 시작 가이드(고정)와 4개 추천 가이드 구분이 명확하게 기술
