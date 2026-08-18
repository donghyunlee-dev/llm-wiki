# search-three-pane-layout Result

## Delivered Scope
- `/search` 화면을 좌(대화 목록)/중(연속 답변 스트림)/우(컨텍스트 패널) 3단 풀 높이 레이아웃으로 재구성. 사이트 헤더는 그대로 유지.
- 브라우저 localStorage 기반 대화 목록: 생성/조회/전환/삭제(확인 다이얼로그)/최신순 정렬/최대 20개 자동 정리.
- 대화 제목은 AI 검색 응답의 신규 `title` 필드로 자동 생성(첫 턴에서만 설정), 없으면 첫 질문 텍스트로 폴백.
- 우측 컨텍스트 패널: 추천 페이지 → 관련 페이지 → FAQ 순서로 섹션 구분, 현재 대화의 모든 턴에서 나온 문서를 중복 없이(최신 턴 기준 재배치) 누적 표시.
- 모바일/좁은 화면: 중앙 답변만 기본 노출, 좌/우 패널은 배경 오버레이가 있는 드로어로 토글.
- Codex 크리티컬 리뷰에서 발견된 title 유실 버그, 대화 삭제 레이스 컨디션, 대화 전환 후 답변 유실 문제, 우측 패널 2열 CSS 문제를 모두 수정.

## Changed Files
- `apps/web/src/ui/pages/SearchPage.tsx` (3단 셸로 재구성, conversation state를 신규 훅 기반으로 교체)
- `apps/web/src/ui/pages/SearchPage.types.ts` (신규, `SearchAnswer` 타입 추출 + `title` 필드 추가)
- `apps/web/src/ui/pages/search/useSearchConversations.ts` (신규)
- `apps/web/src/ui/pages/search/searchConversationsStore.ts` (신규)
- `apps/web/src/ui/pages/search/searchContextAccumulation.ts` (신규)
- `apps/web/src/ui/pages/search/ConversationSidebar.tsx` (신규)
- `apps/web/src/ui/pages/search/SearchContextPanel.tsx` (신규)
- `apps/web/src/styles.css` (3단 그리드/사이드바/모바일 드로어 CSS 추가)
- `packages/wiki-core/src/lib/aiAsk.ts` (`title` 필드 스키마+프롬프트 추가)
- `packages/wiki-core/src/lib/aiSearchResponse.ts` (`title` 파싱/반환 추가)
- `docs/prd/search-screen-layout.md` (신규, 화면 설계 기준 문서)
- `docs/prd/ai-ask-prompt-guide.md` (`title` 필드 규칙 추가)
- `docs/tasks/search-three-pane-layout/` (spec/plan/tasks/test-result/result)
- 각 신규 모듈에 대응하는 `*.test.ts(x)` 단위 테스트 다수 추가

## Key Decisions
- 우측 패널은 단일 턴이 아니라 대화 전체 턴을 누적 표시하며, 중복 문서는 최신 턴 기준으로 재배치한다(사용자 확정 사항).
- 새 대화는 홈/검색창에서 질문할 때만 생성되고, `/search` 화면 내 이어서 질문은 기존 대화에 턴을 추가한다.
- 대화 제목은 별도 API 호출 없이 기존 검색 응답 스키마에 `title` 필드를 추가해 같은 호출에서 함께 받는다.
- localStorage는 최대 20개 대화만 보관하고 초과분은 자동 정리한다.
- 사이트 헤더는 축소하지 않고 기존 그대로 유지, 헤더 아래 영역만 3단으로 분할한다(실제 헤더 렌더 높이를 런타임에 측정해 `--search-shell-offset`으로 반영).

## Post-Delivery Fixes (2026-08-18)
- 사용자 실사용 테스트에서 발견된 2건 수정: (1) React StrictMode 이중 실행으로 인해 질문 1개당 대화가 2개 생성되던 버그(`currentConversationIdRef`로 수정, 회귀 테스트 `SearchPage.strictmode.test.tsx` 추가), (2) 우측 컨텍스트 패널 카드 여백이 커서 스크롤이 생기던 문제(카드/섹션 간격 축소로 스크롤 없이 더 많은 카드 노출, 죽은 CSS `.chat-guide-list` 함께 정리).

## Open Gaps
- 검색 요청에 대한 명시적 취소(`AbortController`)가 없다. unmount/대화 전환 이후에도 네트워크 응답 자체는 계속 처리되지만, 화면 반영과 localStorage 오염은 `activeConversationIdRef`/`deletedConversationIdsRef` 가드로 방지했다. 실사용 영향은 낮다고 판단해 이번 스코프에서는 별도 취소 로직을 추가하지 않았다.
- 답변 대기 중(로딩 상태) 새로고침 시 진행 중이던 턴은 저장되지 않아 유실된다(스펙에 문서화된 허용 트레이드오프).
- 대화 목록 검색/필터링 기능은 이번 스코프에 포함하지 않았다.

## Next Steps
- 필요 시 검색 요청에 `AbortController`를 도입해 unmount/전환 시 네트워크 요청 자체를 취소하는 후속 작업 고려.
- 실사용 피드백에 따라 대화 제목 품질(AI 프롬프트 튜닝) 조정.
