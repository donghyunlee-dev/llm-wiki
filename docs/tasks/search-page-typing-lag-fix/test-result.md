# search-page-typing-lag-fix Test Result

## Scope
- `/search` 페이지 하단 입력창 타이핑 반응성 회귀 여부, 기존 검색 결과 렌더링(추천/관련 문서, 스크롤, 대화 목록) 회귀 여부.

## Environment
- 로컬 dev 서버(`pnpm --filter @sfood/web dev`, `apps/web/.env.local`의 실제 Confluence/OpenAI 설정 사용)
- 문서 코퍼스: `/api/wiki-pages` 기준 360개 문서 (실제 원격 데이터)
- Playwright MCP (Chromium)

## Commands
- `pnpm typecheck`
- `pnpm test`
- Playwright: `/search?q=...`로 실제 AI 답변 1턴 생성 → localStorage에 동일 답변을 15/60/200턴으로 복제한 스트레스 대화(`stress-convo`) 주입 → `/search?c=stress-convo` 진입 후 `.chat-input-bar-textarea`에 실제 키보드 입력(`pressSequentially`, 5000ms 기본 타임아웃)

## Results
- PASS `pnpm typecheck` — 전체 워크스페이스 통과 (hooks 순서 위반 없음)
- PASS `pnpm test` — 34 files / 208 tests, 회귀 없음
- PASS (수정 전 재현) 200턴 상태에서 **수정 전 코드**로 실제 타이핑 시도 → 5000ms 동안 문자 1개만 입력되고 타임아웃 발생 (`이것은 ... 아 아 아 아안` — "안" 한 글자만 반영). 사용자가 리포트한 증상과 일치.
- PASS (수정 후 확인) 동일 200턴 상태에서 **수정 후 코드**로 동일 문장 타이핑 → 타임아웃 없이 즉시 완료, `textarea.value`가 입력한 문장과 정확히 일치.
- PASS 15/60턴 상태에서 합성 keystroke 타이밍 측정(`performance.now()` 기반) — 수정 후 평균 4.5ms/키, 최대 5ms, longtask(>50ms) 없음.
- PASS `pnpm test`에 포함된 기존 `SearchPage.strictmode.test.tsx`, `SearchPage.conversationParam.test.tsx` 등 대화 복원/스크롤 관련 테스트 회귀 없음 확인.

## Failure Notes
- 없음. 다만 합성 keystroke 타이밍 측정(15/60턴)만으로는 200턴에서 나타난 심각한 지연을 잡지 못했음 — 실제 키보드 이벤트(Playwright `pressSequentially`) 기반 재현이 결정적 증거였음. 이는 이번 수정의 검증 방법상 기록해 둘 한계.

## Retest Results
- 위 "수정 후 확인" 항목이 재현 시나리오에 대한 retest — 정상 확인.

## Acceptance Criteria Coverage
- AC1 (draftQuestion 변경 시 완료 턴 추천 재계산 미실행): Codex 리뷰로 `useMemo` 의존성 검증, 실측(타이핑 반응성)으로 간접 확인.
- AC2 (draftQuestion 변경이 과거 턴 리렌더 유발 안 함): `ChatTurn` `React.memo` + 안정적 `registerTurnRef`로 구조적 확인, Codex 리뷰로 stale closure/ref 문제 없음 확인.
- AC3 (기존 렌더링 결과 동일, 회귀 없음): `pnpm test` 전체 통과, Playwright로 답변/추천 패널/대화 복원 정상 렌더링 확인.

## Open Gaps (Codex 리뷰 반영)
- Low: 이 리렌더 최적화를 고정하는 자동 회귀 테스트가 없음 — 향후 `ChatTurn`에 새 inline prop이 추가되면 동일 문제가 조용히 재발할 수 있음.
- Low: `SearchContextPanel`은 `draftQuestion` 변경 시에도 여전히 리렌더됨(현재 비용은 미미해 이번 수정 범위에서는 손대지 않음).
