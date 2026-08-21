# guides-list-remove-eyebrow-label Tasks

## Implementation Tasks
- `CategoryPage.tsx`에서 `eyebrow={section === "guides" ? "가이드 문서" : undefined}` 제거
- `WikiDocumentListItem.tsx`에서 `eyebrow` prop 및 렌더링 분기 제거

## Test Tasks
- `pnpm test` 전체 회귀 확인

## Documentation Tasks
- `docs/prd/implementation-status.md`에 통합 요약 추가

## Progress Notes
- `CategoryPage.tsx`의 eyebrow 전달과 `WikiDocumentListItem.tsx`의 eyebrow prop/렌더링을 함께 제거.

## Review Notes
- Codex 통합 리뷰(4건 묶음)에서 "삭제 범위가 유일한 호출부와 일치함"을 확인, 별도 지적 없음.
