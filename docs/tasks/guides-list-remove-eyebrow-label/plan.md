# guides-list-remove-eyebrow-label Plan

## Summary
`CategoryPage.tsx`에서 guides 섹션에 대한 `eyebrow` prop 전달을 제거하고, 유일한 사용처였던 `WikiDocumentListItem`의 `eyebrow` prop/렌더링 분기도 함께 삭제해 죽은 코드를 남기지 않는다.

## Impacted Modules
- `apps/web/src/ui/pages/CategoryPage.tsx`
- `apps/web/src/ui/pages/WikiDocumentListItem.tsx`

## Architecture Approach
grep으로 확인한 결과 `WikiDocumentListItem`의 유일한 호출부는 `CategoryPage.tsx`이고, `eyebrow`를 넘기는 것은 guides 섹션뿐이었다. 호출부에서 prop 전달을 끊고, 컴포넌트 정의에서도 prop을 제거해 인터페이스를 정리한다.

## Data And API Impact
없음. 순수 UI 텍스트 제거.

## Validation Plan
- `pnpm test`, `pnpm typecheck`
- Playwright: `/guides` 목록에서 "가이드 문서" 텍스트 미노출 확인, `/faq`·`/library` 목록 회귀 없음 확인

## Risks
- 낮음. 삭제되는 prop의 다른 호출부가 없음을 grep으로 확인함.

## Rollback Considerations
prop과 텍스트를 되돌리면 즉시 원복 가능.
