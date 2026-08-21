# search-conversation-sidebar-title Plan

## Summary
`SearchPage.tsx`가 `ConversationSidebar`에 `title="최근 대화"` prop을 홈 화면과 동일하게 전달하도록 한 줄 추가한다.

## Impacted Modules
- `apps/web/src/ui/pages/SearchPage.tsx`

## Architecture Approach
기존 `ConversationSidebar`가 이미 지원하는 선택적 `title` prop을 재사용한다. 컴포넌트 구조 변경 없음.

## Data And API Impact
없음.

## Validation Plan
- `pnpm test`, `pnpm typecheck`
- Playwright: `/search`에서 좌측 사이드바에 "최근 대화" 텍스트 노출 확인(라이트/다크)

## Risks
- 낮음. 기존 prop 재사용이며 레이아웃 영향 없음(HomePage에서 이미 검증된 패턴).

## Rollback Considerations
한 줄 제거로 즉시 원복 가능.
