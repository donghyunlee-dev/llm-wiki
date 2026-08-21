# desktop-conversation-sidebar-toggle Result

## Delivered Scope
홈(`HomePage.tsx`)과 검색(`SearchPage.tsx`) 양쪽에 데스크톱(`lg` 이상)용 좌측 "최근 대화" 사이드바 접기/펼치기 기능을 추가.

1차 구현은 메인 컬럼 상단에 텍스트 버튼("대화 목록 닫기"/"열기")을 두고 접히면 사이드바가 `lg:hidden`으로 완전히 사라지는 방식이었으나, 사용자가 "여러 UI 대안이 있는데 최선의 선택이었냐"고 재확인 요청 — ChatGPT/Notion류 패턴(사이드바 가장자리 아이콘 버튼 + 접힌 상태에서도 남는 얇은 rail)으로 재설계.

## Changed Files
- `apps/web/src/ui/pages/HomePage.tsx`
- `apps/web/src/ui/pages/SearchPage.tsx`
- `apps/web/src/styles.css`

## Key Decisions
- 텍스트 버튼 대신 사이드바 우상단에 고정된 chevron 아이콘 버튼(`.search-sidebar-collapse-toggle`, 기존 `ArticlePage.tsx`의 `BackArrowIcon`과 동일한 화살표 path 재사용, 접힘 여부에 따라 `rotate-180`으로 방향 반전) 하나로 통일.
- 접힘 상태는 사이드바를 `lg:hidden`으로 완전히 제거하지 않고 `lg:w-10`의 얇은 rail로 축소, 내부 `ConversationSidebar`(`.search-conversation-sidebar`)만 `lg:hidden`으로 숨겨 토글 버튼만 rail에 남도록 함 — 접힌 상태에서도 "다시 열 수 있다"는 게 시각적으로 드러남.
- 토글 버튼은 `hidden lg:flex`로 데스크톱에서만 노출되며, 모바일 드로어(`isConversationDrawerOpen`)와는 완전히 분리된 별도 state(`isConversationSidebarCollapsed`) — 모바일 드로어 진입/드로어 안 콘텐츠는 변경 없음.
- 이전에 있던 별도의 `.search-desktop-sidebar-toggle` 툴바 행과 텍스트 버튼은 제거.
- 트랜지션 애니메이션 없음(요구사항에 명시 없음, 최소 구현 원칙), 접힘 상태는 세션 내 컴포넌트 state로만 유지(localStorage 미영속화, 요청 범위 밖).
- Codex 리뷰 반영: 토글 버튼에 `aria-expanded`/`aria-controls`를 추가하고 사이드바 컨테이너에 stable id(`home-conversation-sidebar`/`search-conversation-sidebar`) 부여(재설계 후에도 유지).

## Verification (재설계 후)
- `pnpm typecheck`, `pnpm test`(34 files/208 tests, 회귀 없음) 통과.
- Playwright로 재확인: 데스크톱(1440×900) 홈/검색 양쪽에서 접기→열기 왕복, 라이트 테마, 모바일(390×844)에서 데스크톱 토글이 노출되지 않고 기존 드로어("대화 목록"/"관련 페이지" 버튼, 백드롭)가 그대로 동작함을 확인.
- 조사 중 모바일 드로어 상단이 사이트 헤더(z-40, 59px)에 일부 가려지는 기존 이슈를 발견 — `git diff c5c4305 origin/develop -- apps/web/src/styles.css`로 해당 CSS가 이번 작업에서 전혀 손대지 않은 영역임을 확인, 오늘 작업 이전부터 존재하던 사전 이슈로 판단해 범위 밖으로 두고 별도 보고만 함(수정하지 않음).

## Open Gaps
- 접힘 상태 미영속화(새로고침 시 항상 펼쳐진 상태로 시작) — 요청 범위 밖.
- 우측 컨텍스트 패널(`search-sidebar-right`)에는 동일한 접기 기능이 없음 — 요청 범위 아님.
- (신규 발견, 범위 밖) 모바일 대화 목록 드로어 상단이 사이트 헤더에 약간 가려지는 사전 존재 이슈 — 오늘 작업으로 발생한 회귀 아님, 별도 리포트로 후속 처리 필요.

## Next Steps
없음. 사용자 승인 범위(아이콘 기반 재설계) 완료.
