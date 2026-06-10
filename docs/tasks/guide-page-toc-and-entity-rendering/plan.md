# guide-page-toc-and-entity-rendering Plan

## Summary
- HTML 엔티티 디코딩을 `wiki-core`의 Confluence read model 단계에 추가하고, 목차 계층 표현은 web CSS와 작은 마크업 보강으로 해결한다.

## Impacted Modules
- `packages/wiki-core/src/lib/confluenceReadModel.ts`
- `packages/wiki-core/src/lib/confluenceReadModel.test.ts`
- `apps/web/src/ui/pages/ArticlePage.tsx`
- `apps/web/src/ui/pages/GuidesPage.tsx`
- `apps/web/src/styles.css`

## Architecture Approach
- 엔티티 디코딩은 shared read-model normalization에 넣어 summary, heading text, contentHtml이 같은 기준을 쓰게 한다.
- 목차 계층 표시는 데이터가 아니라 presentational marker이므로 CSS/markup에서 처리한다.

## Data And API Impact
- `WikiDocument.contentHtml`, `summary`, `headings.text`가 엔티티 디코딩된 값으로 정규화될 수 있다.
- API shape 자체는 변하지 않는다.

## Validation Plan
- `pnpm --filter @sfood/wiki-core test`
- `pnpm --filter @sfood/web test`
- `pnpm typecheck`

## Risks
- HTML 전체를 무분별하게 디코딩하면 속성값이나 URL 의미가 바뀔 수 있어 텍스트 노드/표준 엔티티 위주 처리여야 한다.
- CSS prefix가 링크 클릭 영역이나 overflow를 깨지 않게 주의해야 한다.

## Rollback Considerations
- 엔티티 디코딩 헬퍼와 TOC prefix 스타일을 제거하면 기존 동작으로 국소 롤백 가능하다.
