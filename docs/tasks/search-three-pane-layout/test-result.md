# search-three-pane-layout Test Result

## Scope
- `/search` 화면 3단 레이아웃(대화 목록/답변 스트림/컨텍스트 패널) 신규 구현
- localStorage 기반 대화 저장/조회/삭제/정렬/20개 제한
- 우측 패널 다중 턴 누적/중복 제거/재배치 로직
- AI 검색 응답 `title` 필드 추가(스키마+프롬프트)

## Environment
- Node/pnpm workspace, `apps/web`(vitest+jsdom), `packages/wiki-core`(vitest)
- 실제 브라우저 검증: `pnpm --filter @sfood/web dev`로 로컬 서버 구동 후 Playwright MCP로 접속
- Playwright 검증 시 실제 OpenAI 연동 환경(로컬 `.env`에 `OPENAI_API_KEY` 설정됨)이라 실제 AI 응답까지 end-to-end로 확인함

## Commands
- `pnpm --filter @sfood/web test` (vitest run)
- `pnpm --filter @sfood/wiki-core test` (vitest run)
- `pnpm --filter @sfood/web typecheck` (tsc)
- `pnpm --filter @sfood/wiki-core typecheck` (tsc, `tsc -p tsconfig.json --noEmit`로 직접 실행)
- Playwright MCP: `/search?q=...` 데스크톱(1440x900)/모바일(390x844) 접속, 질문 제출, 대화 전환, 대화 삭제(취소/확인), 다크 테마 전환, 모바일 드로어 토글

## Results
- `pnpm --filter @sfood/web test`: PASS — 30 files, 197 tests
- `pnpm --filter @sfood/wiki-core test`: PASS — 19 files, 235 tests
- `pnpm --filter @sfood/web typecheck`: PASS (에러 없음)
- `pnpm --filter @sfood/wiki-core typecheck`: PASS (에러 없음)
- Playwright 데스크톱: 3단 레이아웃 렌더링 확인, 좌측 대화 목록·중앙 답변 스트림·우측 컨텍스트 패널 모두 정상 노출. 헤더 실제 렌더 높이를 런타임에 측정해 `--search-shell-offset`으로 반영한 뒤에는 사이드바가 뷰포트에 고정되고 중앙 스트림만 내부 스크롤되는 것을 확인(최초 구현에서는 전체 문서가 스크롤되며 사이드바가 함께 밀려나가는 버그가 있었음 — 실측 후 수정).
- Playwright: 같은 대화에서 후속 질문 시 턴이 누적되고, 우측 패널의 추천/관련/FAQ가 최신 턴 기준으로 재배치되며 이전 턴 문서와 중복 없이 합쳐짐을 확인.
- Playwright: 좌측 목록에서 다른 대화를 선택하면 중앙 스트림과 우측 패널이 해당 대화 기준으로 완전히 교체됨을 확인(다른 대화의 컨텍스트가 섞이지 않음).
- Playwright: 삭제 아이콘 클릭 시 `window.confirm` 다이얼로그 노출, 취소 시 유지·확인 시 삭제되는 것을 확인.
- Playwright: 모바일(390px)에서 좌/우 패널이 기본 숨김 처리되고, 상단 토글 버튼으로 대화 목록 드로어가 배경 오버레이와 함께 열리는 것을 확인.
- Playwright: 다크 테마 전환 시 3단 모두 색상 대비 정상 확인.
- Codex 크리티컬 리뷰: 완료. 5건 지적 중 4건 수정, 1건(요청 취소/unmount cleanup 부재)은 Open Gap으로 문서화.
  1. **(High, 수정)** `title` 필드가 스키마에는 추가됐지만 `aiSearchResponse.ts`의 `parseAiSearchResponseText`가 `parsed.title`을 읽지 않아 항상 폴백 제목만 쓰이던 문제 — `ParsedAiSearchResult`에 `title` 추가하고 정상/복구/기본 경로 모두에서 반환하도록 수정. `aiSearchResponse.test.ts`에 회귀 테스트 추가.
  2. **(High, 수정)** 답변 대기 중 해당 대화를 삭제해도 응답이 늦게 도착하면 `commitTurn`이 대화를 되살리던 문제 — `deletedConversationIdsRef`로 삭제된 대화 id를 추적해, 응답 도착 시 삭제된 대화면 `commitTurn`을 건너뛰도록 수정.
  3. **(Medium, 수정)** 응답 대기 중 다른 대화로 갔다가 같은 대화로 돌아오면, 완료된 답변이 저장은 되지만 화면(`liveTurns`)에는 반영되지 않던 문제 — `activeConversationIdRef`로 "현재 보고 있는 대화"를 실시간 추적하고, 완료 시 해당 대화를 보고 있으면 기존 턴에 없어도 새로 추가(upsert)하도록 수정(`upsertLiveTurn`).
  4. **(Low, 수정)** 우측 패널이 `.chat-guide-list`(768px 이상에서 2열 그리드)를 재사용해 288px 너비 사이드바에서 카드가 좁은 2열로 눌리던 문제 — 전용 `.search-context-list`(항상 1열) 클래스로 교체.
  5. **(Open Gap)** 요청 자체에 unmount/abort 시 취소 로직이 없음 — 위 3개 수정으로 실질적인 데이터 오염/유실은 막았으나, 컴포넌트 unmount 이후에도 네트워크 응답이 도달하면 `setLiveTurns`/`commitTurn`이 호출될 수 있다. 실제 영향은 낮음(React 18 이후 unmount된 컴포넌트의 state 업데이트는 경고 없이 무시됨, `commitTurn`은 여전히 localStorage에 정상 반영됨)이라 이번 스코프에서는 별도 `AbortController` 도입 없이 Open Gap으로 남긴다.
- 수정 후 재검증: `pnpm --filter @sfood/web test`(30 files/197 tests) PASS, `pnpm --filter @sfood/wiki-core test`(19 files/235 tests) PASS, 양쪽 typecheck PASS, Playwright로 title 정상 반영과 우측 패널 1열 레이아웃을 재확인.

## Failure Notes
- 없음 (위 항목 모두 통과, Codex 리뷰 지적 사항도 재검증 통과). 헤더 높이 오프셋 버그는 최초 구현 단계에서 발견해 같은 세션에서 수정 후 재검증 완료.

## Retest Results
- 헤더 오프셋 수정 후 데스크톱 레이아웃 재검증 통과.

## Retest Results (2026-08-18 실사용 리포트 대응)
- 사용자가 실제 dev 서버에서 "claude token 제한에 대해 설명해줘"로 테스트하다가 대화가 2개 생성되는 문제와 우측 패널 스크롤 문제를 리포트.
- **대화 2개 생성**: `SearchPage.strictmode.test.tsx`(신규)로 재현 — `<StrictMode>`로 렌더링 시 질문 1개에 fetch 2회·localStorage 대화 2개가 생성됨을 확인(RED), `currentConversationIdRef` 도입 후 fetch 1회·대화 1개로 수정 확인(GREEN). Playwright로 같은 시나리오("claude token 제한...") 재현 시 실제로 대화 1개("Claude 토큰 한도")만 생성됨을 재확인.
- **우측 패널 스크롤**: `.chat-guide-card`/`.search-context-panel`/`.search-context-list` 간격·최소높이 축소. Playwright로 추천 3+관련 3+FAQ 3(총 9장) 상태에서 `panel.scrollHeight === panel.clientHeight`(840=840)로 스크롤이 발생하지 않음을 실측 확인.
- `pnpm --filter @sfood/web test`: PASS — 31 files, 198 tests(신규 회귀 테스트 1건 포함). `pnpm --filter @sfood/web typecheck`: PASS.

## Acceptance Criteria Coverage
- AC1 (3단 레이아웃 + 헤더 유지): PASS
- AC2 (질문 제출 시 localStorage 생성/갱신, 새로고침 복원): PASS — 단위 테스트(`searchConversationsStore.test.ts`, `useSearchConversations.test.tsx`)로 저장/조회 검증. 새로고침 자체는 브라우저 세션 특성상 별도 재현하지 않았고, localStorage 저장/조회 단위 테스트로 대체 확인.
- AC3 (정렬/20개 제한): PASS — 단위 테스트로 확인.
- AC4 (삭제 확인 다이얼로그): PASS — 단위 테스트 + Playwright 확인.
- AC5 (우측 패널 섹션 구분 + 다중 턴 누적/재배치): PASS — 단위 테스트(`searchContextAccumulation.test.ts`) + Playwright 확인.
- AC6 (모바일 드로어): PASS — Playwright 확인.
- AC7 (`title` 필드 + 폴백): PASS — `aiAsk.test.ts` 스키마/프롬프트 테스트 + Playwright 실측(이번 실행에서는 모델이 빈 title을 반환해 폴백인 첫 질문 텍스트가 쓰이는 경로까지 실제로 확인됨).
