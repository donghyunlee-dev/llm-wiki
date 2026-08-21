# home-faq-entry-link Plan

## Summary
`search-flow-contract.md`에 "이 규칙은 AI 답변 내 노출에 한정되며 정적 내비게이션과는 무관하다"는 구분 문구를 먼저 추가한 뒤, `HomePage.tsx`의 `home-guides-header`에 기존 `home-secondary-button` 스타일의 FAQ 링크를 하나 더 추가한다.

## Impacted Modules
- `docs/prd/search-flow-contract.md` (문서)
- `apps/web/src/ui/pages/HomePage.tsx`

## Architecture Approach
`homeContent.ts`의 `entryCards`는 이미 FAQ 항목을 갖고 있으나 지금까지 어디에도 렌더링되지 않던 죽은 데이터였다. 새 컴포넌트나 데이터를 만들지 않고 이 기존 데이터에서 FAQ 카드 하나만 찾아 링크로 렌더링한다. `home-guides-header`는 현재 `justify-between`으로 제목(왼쪽)과 링크 1개(오른쪽)만 배치하는 구조이므로, 오른쪽에 링크 2개를 담을 작은 flex wrapper를 추가한다.

## Data And API Impact
없음. 순수 UI 링크 추가.

## Validation Plan
- `pnpm test`, `pnpm typecheck`
- Playwright: 홈 화면에서 FAQ 링크 클릭 시 `/faq` 이동 확인, 라이트/다크/모바일 레이아웃 확인(줄바꿈/겹침 없는지)

## Risks
- 낮음. 기존 스타일 재사용, 새 상태 없음.
- `home-guides-header`가 모바일에서 두 링크로 인해 좁아 보일 수 있음 — Playwright로 실측 확인 필요.

## Rollback Considerations
추가한 Link 엘리먼트와 계약 문서 문구를 제거하면 즉시 원복 가능.
