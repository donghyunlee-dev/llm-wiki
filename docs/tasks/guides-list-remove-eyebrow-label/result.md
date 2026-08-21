# guides-list-remove-eyebrow-label Result

## Delivered Scope
`/guides` 목록 항목에서 의미 없는 "가이드 문서" eyebrow 라벨을 제거. 유일한 사용처였던 `WikiDocumentListItem`의 `eyebrow` prop 자체도 죽은 코드가 되지 않도록 함께 제거.

## Changed Files
- `apps/web/src/ui/pages/CategoryPage.tsx`
- `apps/web/src/ui/pages/WikiDocumentListItem.tsx`

## Key Decisions
- grep으로 `WikiDocumentListItem`의 유일한 호출부가 `CategoryPage.tsx`뿐임을 확인한 뒤, prop 전달만 끊는 대신 컴포넌트 인터페이스에서도 완전히 제거(미사용 prop 방지).

## Open Gaps
없음.

## Next Steps
없음. 사용자 승인 범위 완료.
