# desktop-conversation-sidebar-toggle Tasks

## Implementation Tasks
- `styles.css`: `.search-sidebar-collapsed` 규칙 추가, `.search-toolbar-button` 공용 버튼 클래스 추가, `.search-desktop-sidebar-toggle` 바 추가
- `HomePage.tsx`: `isConversationSidebarCollapsed` state 추가, 사이드바 클래스에 반영, 데스크톱 토글 바 추가, 기존 모바일 버튼에 공용 클래스 적용
- `SearchPage.tsx`: 동일 패턴 적용

## Test Tasks
- `pnpm test` 전체 회귀 확인
- Playwright로 데스크톱 토글 왕복 동작 + 모바일 드로어 회귀 확인

## Documentation Tasks
- `docs/prd/implementation-status.md`에 통합 요약 추가

## Progress Notes
- CSS에 `.search-sidebar-collapsed`/`.search-desktop-sidebar-toggle`/`.search-toolbar-button` 추가 → HomePage/SearchPage에 collapse state와 토글 버튼 추가, 기존 모바일 툴바 버튼에 공용 클래스 적용.

## Review Notes
- Codex 통합 리뷰(4건 묶음)에서 Minor 1건: 데스크톱 토글 버튼에 `aria-expanded`/`aria-controls` 부재 → 사이드바 컨테이너에 stable id 부여 후 속성 추가로 반영 완료. Critical/Major 없음, 모바일-데스크톱 state 분리도 문제없음으로 확인됨.
