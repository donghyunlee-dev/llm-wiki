# desktop-conversation-sidebar-toggle Result

## Delivered Scope
홈(`HomePage.tsx`)과 검색(`SearchPage.tsx`) 양쪽에 데스크톱(`lg` 이상)용 좌측 "최근 대화" 사이드바 접기/펼치기 토글 버튼을 추가. 새 state `isConversationSidebarCollapsed`, CSS 클래스 `.search-sidebar-collapsed`(`lg:hidden`)로 구현. 기존 모바일 드로어(`isConversationDrawerOpen`) 로직은 건드리지 않고 완전히 분리.

## Changed Files
- `apps/web/src/ui/pages/HomePage.tsx`
- `apps/web/src/ui/pages/SearchPage.tsx`
- `apps/web/src/styles.css`

## Key Decisions
- 트랜지션 애니메이션 없이 단순 `hidden` 토글로 구현(요구사항에 애니메이션 명시 없음, 최소 구현 원칙).
- 접힘 상태는 세션 내 컴포넌트 state로만 유지, localStorage 영속화하지 않음(요청 범위 밖).
- 기존 `.search-mobile-toolbar button` 스타일을 `.search-toolbar-button` 공용 클래스로 리팩터링해 새 데스크톱 토글 버튼과 공유 — 중복 스타일 방지.
- Codex 리뷰 반영: 토글 버튼에 `aria-expanded`/`aria-controls`를 추가하고 사이드바 컨테이너에 stable id(`home-conversation-sidebar`/`search-conversation-sidebar`) 부여.

## Open Gaps
- 접힘 상태 미영속화(새로고침 시 항상 펼쳐진 상태로 시작) — 사용자가 요청하지 않은 범위라 의도적으로 남김.
- 우측 컨텍스트 패널(`search-sidebar-right`)에는 동일한 접기 기능이 없음 — 요청 범위 아님.

## Next Steps
없음. 사용자 승인 범위 완료.
