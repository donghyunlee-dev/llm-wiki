# search-page-typing-lag-fix Result

## Delivered Scope
- `/search` 페이지 하단 검색 입력창의 타이핑 지연 버그를 수정. 원인은 입력값(`draftQuestion`) state 변경마다 `SearchPage` 전체가 리렌더되면서, 완료된 대화 턴들에 대한 추천 문서 재계산(전체 문서 코퍼스 lexical 스코어링)과 답변 마크다운 재파싱이 매 키 입력마다 다시 실행되던 것. 대화가 쌓일수록(특히 200턴 수준) 실제 타이핑이 수 초간 멈추는 수준으로 확인됨.
- `useMemo`로 추천 문서 계산을 `liveTurns`/`documents` 변경 시에만 재실행하도록 하고, 채팅 턴 렌더링을 `React.memo` 컴포넌트(`ChatTurn`)로 분리해 입력값 변경이 과거 턴 리렌더로 전파되지 않게 했다.

## Changed Files
- `apps/web/src/ui/pages/SearchPage.tsx`

## Key Decisions
- 계산 로직(`resolveTurnContext`, `searchRecommendations.ts` API) 자체는 변경하지 않고, 호출 빈도만 렌더링 구조(useMemo/React.memo)로 제어 — 랭킹/추천 로직 변경 없이 최소 범위로 수정.
- `turnRefs` 스크롤 ref 등록을 위해 `registerTurnRef`(빈 deps `useCallback`)를 두고 `ChatTurn` 내부에서 `item.id`에만 의존하는 안정적 콜백으로 감싸, `React.memo`가 실제로 효과를 내도록 함.

## Open Gaps
- 이 리렌더 최적화를 고정하는 자동 회귀 테스트가 없음(Codex 리뷰 Low 지적) — 향후 `ChatTurn`에 새 inline prop이 추가되면 동일 문제가 조용히 재발할 수 있음.
- `SearchContextPanel`은 여전히 `draftQuestion` 변경 시마다 리렌더됨(현재 비용 미미, 이번 범위에서는 미수정).

## Next Steps
- 없음 — 사용자 승인 범위(타이핑 지연 수정) 완료. 위 Open Gaps는 후속 과제로 필요 시 별도 태스크로 진행.
