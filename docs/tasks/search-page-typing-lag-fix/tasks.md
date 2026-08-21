# search-page-typing-lag-fix Tasks

## Implementation Tasks
- `turnContexts`/`accumulatedContext` 계산을 `useMemo`로 감싸기 (의존성: `liveTurns`, `documents`)
- 턴 렌더링(`chat-turn` 블록)을 `ChatTurn` 컴포넌트로 분리하고 `React.memo` 적용
- `turnRefs` ref 콜백을 `ChatTurn`에 전달해 기존 스크롤 동작 유지

## Test Tasks
- `pnpm test` 전체 회귀 확인
- `pnpm typecheck`
- Playwright로 `/search`에서 답변 완료 후 입력창 연속 타이핑 반응성 확인

## Documentation Tasks
- `docs/prd/implementation-status.md`에 세션 기록 추가

## Progress Notes
- (진행 중 기록)

## Review Notes
- (Codex 리뷰 결과 기록)
