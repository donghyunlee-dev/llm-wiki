# search-page-typing-lag-fix Plan

## Summary
- `SearchPage.tsx`에서 매 렌더마다 무조건 재계산되던 `turnContexts`/`accumulatedContext` 계산을 `useMemo`로 감싸 `liveTurns`/`documents`가 바뀔 때만 재실행되게 한다.
- 채팅 턴(질문+답변) 렌더링 부분을 별도 컴포넌트로 분리하고 `React.memo`로 감싸, `draftQuestion` 변경이 과거 턴의 `StructuredAnswerView` 재파싱을 유발하지 않게 한다.

## Impacted Modules
- `apps/web/src/ui/pages/SearchPage.tsx`

## Architecture Approach
- 계산 로직(추천 문서 resolve) 자체는 기존 `searchRecommendations.ts` API를 그대로 사용하고, 호출 빈도만 렌더링 구조로 제어한다.
- 턴 렌더링을 `ChatTurn`이라는 순수 프레젠테이션 컴포넌트로 분리해 `React.memo` 적용 — props(`turn`, `documents`)가 바뀌지 않으면 리렌더/재계산되지 않는다.
- `turnRefs`(스크롤 대상 DOM ref) 연결은 `ChatTurn`에 `ref` 콜백을 그대로 전달해 기존 스크롤 동작을 유지한다.

## Data And API Impact
- 없음 — 순수 프론트엔드 렌더링/메모이제이션 변경, 서버 API·데이터 스키마 변경 없음.

## Validation Plan
- `pnpm test` (기존 `SearchPage` 관련 테스트 포함, 회귀 없음 확인)
- `pnpm typecheck`
- Playwright로 `/search` 화면에서 답변 완료 후 입력창에 연속 타이핑 시 즉시 반영되는지 확인, 기존 대화 목록/관련 페이지 패널 렌더링 회귀 없는지 확인
- Codex에 diff 전달해 크리티컬 리뷰 수집

## Risks
- `ChatTurn`을 memo로 분리하면서 `turnRefs`/스크롤 콜백 연결이 깨질 위험 — ref 콜백 전달 방식을 기존과 동일하게 유지해 대응.
- `useMemo` 의존성 배열에 `documents`/`liveTurns`를 누락하면 새 턴 완료 시 추천 문서가 갱신되지 않는 회귀 위험 — 의존성 배열을 명확히 검증.

## Rollback Considerations
- 단일 파일(`SearchPage.tsx`) 변경이므로 `git revert` 또는 해당 파일만 이전 버전으로 되돌려 즉시 롤백 가능.
