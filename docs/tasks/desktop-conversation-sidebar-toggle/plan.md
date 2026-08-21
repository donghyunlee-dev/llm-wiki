# desktop-conversation-sidebar-toggle Plan

## Summary
HomePage/SearchPage 각각에 데스크톱 전용 collapse state(`isConversationSidebarCollapsed`)를 새로 추가하고, `search-sidebar-left`에 `search-sidebar-collapsed` 클래스를 조건부로 붙여 `lg` 이상에서 `hidden` 처리한다. 토글 버튼은 기존 모바일 툴바 자리 옆에 `lg`에서만 보이는 새 desktop toggle bar로 추가한다. 모바일 드로어의 기존 state/클래스와는 완전히 분리해 혼용하지 않는다.

## Impacted Modules
- `apps/web/src/ui/pages/HomePage.tsx`
- `apps/web/src/ui/pages/SearchPage.tsx`
- `apps/web/src/styles.css`

## Architecture Approach
- CSS: `.search-sidebar-left.search-sidebar-collapsed { @apply lg:hidden; }` 한 줄 추가로 데스크톱에서만 완전히 숨긴다(모바일 `max-lg` 트랜지션 규칙과 간섭하지 않음).
- 새 `.search-desktop-sidebar-toggle` 클래스(`hidden ... lg:flex`)로 데스크톱에서만 보이는 토글 바를 만든다. 모바일 툴바 버튼과 이 버튼이 같은 스타일을 쓰도록 기존 `.search-mobile-toolbar button` 셀렉터를 `.search-toolbar-button` 공용 클래스로 바꾼다(중복 스타일 방지, 기존 시각적 결과는 동일).
- state: `useState(false)`로 `isConversationSidebarCollapsed` 추가, 토글 버튼 클릭 시 반전.

## Data And API Impact
없음.

## Validation Plan
- `pnpm test`, `pnpm typecheck`
- Playwright: 데스크톱 뷰포트에서 토글 클릭 → 사이드바 사라짐 → 다시 클릭 → 사이드바 복귀, 홈/검색 양쪽 확인. 모바일 뷰포트에서 기존 드로어 동작 회귀 없음 확인. 라이트/다크 확인.

## Risks
- 기존 `.search-mobile-toolbar button` 셀렉터를 공용 클래스로 바꾸는 과정에서 버튼 마크업에 클래스를 빠뜨리면 스타일이 깨질 수 있음 — 변경한 모든 버튼에 클래스 추가 여부를 Playwright로 시각 확인.

## Rollback Considerations
새로 추가한 state/클래스/CSS 블록만 제거하면 기존 동작으로 원복 가능(기존 모바일 드로어 로직은 손대지 않음).
