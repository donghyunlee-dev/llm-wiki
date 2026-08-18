# search-three-pane-layout Tasks

## Implementation Tasks
- `useSearchConversations` 훅 구현: localStorage 읽기/쓰기, 생성/전환/삭제, 정렬, 20개 초과 시 정리, 저장 실패 흡수
- 우측 패널 누적 유틸(`searchContextAccumulation.ts` 등) 구현: 섹션별 중복 제거 + 최신 턴 기준 재배치
- `ConversationSidebar.tsx` 구현: 목록 렌더링, 선택, 삭제 아이콘 + 확인 다이얼로그
- `SearchContextPanel.tsx` 구현: 추천/관련/FAQ 세로 스택 + 섹션 헤더
- `SearchPage.tsx` 리팩터링: 3단 그리드 셸 적용, conversation state를 훅 기반으로 교체, 새 대화/이어서 질문 분기 처리
- 모바일 드로어 토글 UI 및 breakpoint CSS 추가
- 서버 AI 검색 응답 스키마에 `title` 필드 추가 (프롬프트 가이드 문서 확인 후 진행)
- `docs/prd/search-flow-contract.md` 등 관련 계약 문서에 우측 패널 누적 규칙 반영 여부 검토

## Test Tasks
- `useSearchConversations` 단위 테스트 작성
- 우측 패널 누적 유틸 단위 테스트 작성
- `SearchPage` 대화 생성/전환/삭제 흐름 테스트
- Playwright: 데스크톱 3단 레이아웃, 모바일 드로어, 라이트/다크 테마 확인

## Documentation Tasks
- `docs/prd/implementation-status.md`에 진행 상황 갱신
- 필요 시 `docs/prd/search-flow-contract.md`/`ai-ask-prompt-guide.md` 갱신

## Progress Notes
- 사용자 실사용 테스트(2026-08-18)에서 2건 추가 리포트: (1) 같은 질문에 대화가 2개 생성됨, (2) 우측 패널 카드가 커서 스크롤이 생김. 두 건 모두 조사 후 수정 완료(아래 Review Notes 참고).

## Review Notes
- (Codex 크리티컬 리뷰 결과 기록)

### 2026-08-18 — 실사용 리포트 2건 수정
- **대화 2개 생성 버그(재현: "claude token 제한에 대해 설명해줘")**: 근본 원인은 `main.tsx`의 `React.StrictMode`(dev 전용)가 `useEffect`를 의도적으로 2회 실행하는데, 검색 요청 effect가 "새 대화를 만들지 여부"를 `activeConversationId`(리액트 state, 두 번째 invoke 시점에도 아직 갱신되지 않은 stale 값)로 판단하고 있어 두 번째 invoke에서도 `startNewConversation()`이 다시 호출되어 대화가 2개 생성되고, 대화 id가 다른 dedupe 키 때문에 실제 API 요청도 2번 나갔던 것. `SearchPage.tsx`에 `currentConversationIdRef`(useRef, effect 재실행 사이에도 값 유지)를 추가해 "현재 진행 중인 대화"를 state가 아닌 ref로 동기적으로 추적하도록 수정 — `useSearchConversations` 훅이나 서버 로직 변경 없이 `SearchPage.tsx` 내부 effect 로직만 수정.
- **회귀 테스트**: `SearchPage.strictmode.test.tsx` 신규 — `<StrictMode>`로 감싸 렌더링한 뒤 질문 1개에 fetch 1회·localStorage 대화 1개만 생성되는지 검증. 수정 전 실행하면 실제로 대화 2개/fetch 2회가 재현되어 버그를 정확히 잡아냄을 확인(RED) 후 수정(GREEN).
- **우측 패널 스크롤 문제**: `.chat-guide-card`가 `min-h-[80px]`, `px-4 py-3` 등 고정 높이 위주였고 섹션/리스트 간격(`gap-6`/`gap-3`)도 넓어, 카드 수가 늘면 우측 패널 안에서 스크롤이 발생했음. `min-h` 제거, 패딩/간격 축소(`.search-context-panel` gap-6→gap-4·p-4→p-3, `.search-context-list` gap-3→gap-1.5, `.chat-guide-card` px-4 py-3→px-3 py-2 gap-1.5→gap-1, 카드 제목 14px→13px)로 카드 밀도를 높여 동일 화면에서 스크롤 없이 더 많은 카드가 보이도록 수정. 실측(Playwright, 추천 3+관련 3+FAQ 3 = 9장): `scrollHeight === clientHeight`로 스크롤 불필요 확인.
- **부수 정리**: 위 CSS 작업 중 이전 리팩터링에서 이미 죽은 코드가 된 `.chat-guide-list`(`.search-context-list`로 대체된 뒤 더 이상 아무 곳에서도 참조되지 않던 규칙)를 함께 제거.
- `pnpm test`(31 files/198 tests) 전체 통과, `pnpm typecheck` 통과, Playwright로 실제 OpenAI 연동 환경에서 두 수정 모두 재현·재검증 완료.

### 2026-08-18 — 홈 화면 "최근 대화" 진입점 추가 (좌측 고정 사이드바로 재구성)
- 배경: 사용자가 "대화 이후 메인화면 검색으로 이동하니까 다시 대화를 볼 수가 없다"고 리포트 — 대화 목록이 `/search` 좌측에만 있어 홈에서는 접근 불가. 몇 개까지 보여줄지 확인 질문에 "동일하게 패널 구성하고 20개까지 보여줘"로 답변받아 1차로 검색창 아래 인라인 카드 섹션으로 구현했으나, 사용자가 "동일한 패널로 왼쪽에 보여야지, 메인 화면 구조를 나누기 싫어서 하단에 넣은 거냐"고 재지적. 홈 화면 구조를 어떻게 바꿀지 다시 확인한 결과 "검색 화면과 동일하게 좌측 고정 사이드바"로 확정.
- `HomePage.tsx`를 `/search`와 동일한 `search-shell`/`search-sidebar-left`/`search-main-column` 구조로 재구성: 저장된 대화가 있을 때만 좌측에 `ConversationSidebar`("최근 대화" 제목 포함)를 고정 배치하고, 기존 홈 콘텐츠(검색창/추천 가이드/레슨 카드)는 `search-main-column` 안의 `home-scroll-column`(내부 스크롤 컨테이너)으로 이동 — `/search`와 동일하게 사이드바는 고정, 메인 콘텐츠만 내부 스크롤. 헤더 실제 높이를 런타임에 측정하는 `--search-shell-offset` 로직도 `/search`와 동일하게 재사용(코드는 각 페이지에 소규모로 중복 — 공용 컴포넌트로 추출하지 않고 최소 변경으로 처리).
- `ConversationSidebar`에 선택적 `title` prop 추가(기본 미노출, `/search` 좌측 사이드바는 그대로 제목 없이 사용) — 홈에서는 `title="최근 대화"`로 헤딩 노출.
- `SearchPage.tsx`에 `c` 쿼리 파라미터 처리 추가: 마운트 시 `c` 값과 일치하는 저장된 대화를 찾아 `selectConversation` + `liveTurns` 복원. `currentConversationIdRef`를 여기서도 동일하게 채워, `q` 파라미터 기반 새 대화 생성 로직과 충돌하지 않도록 함.
- TDD로 진행: `HomePage.recentConversations.test.tsx`(섹션 노출 조건, 정렬, 클릭 시 navigate 호출), `SearchPage.conversationParam.test.tsx`(`?c=`로 진입 시 턴 복원), `ConversationSidebar.test.tsx`(선택적 title prop) 각각 RED 확인 후 구현.
- `pnpm test`(33 files/203 tests) 전체 통과, `pnpm typecheck` 통과. Playwright로 데스크톱(좌측 사이드바 고정 + 메인 콘텐츠만 내부 스크롤, 실측: 뷰포트를 좁혀도 사이드바 위치 불변·`scrollHeight>clientHeight`인 내부 스크롤 확인)과 모바일(드로어 토글) 모두 재확인.
