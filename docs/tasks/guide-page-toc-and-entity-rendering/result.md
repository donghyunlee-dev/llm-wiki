# guide-page-toc-and-entity-rendering Result

## Delivered
- Confluence read model에 HTML entity 처리 보강을 넣어 `&amp;mdash;` 같은 이중 이스케이프 엔티티는 HTML 렌더용 `&mdash;`로 정리하고, summary/heading text는 실제 문자 `—` 등으로 디코딩되게 했다.
- 가이드/문서 목차의 level 2/3/4 항목에 prefix marker를 추가해 들여쓰기만으로 보이던 계층 구조를 더 명확하게 만들었다.
- wiki-core/web 회귀 테스트를 추가했다.

## Key Decisions
- 렌더 HTML 전체를 문자로 완전 디코딩하지 않고, `contentHtml`에는 `&amp;entity; -> &entity;` 한 단계만 풀었다.
  - 이유: `&lt;` 같은 엔티티를 실제 `<` 문자로 바꾸면 HTML 구조가 바뀔 수 있기 때문이다.
- plain text 변환 경로에서는 별도 entity map + numeric entity 디코딩을 적용해 heading/summary 가독성만 개선했다.
- 목차 구조 표시는 마크업 변경보다 CSS `::before` marker 방식으로 해결해 영향 범위를 최소화했다.

## Remaining Gaps
- live Confluence 데이터에 어떤 엔티티가 실제로 자주 들어오는지는 추가 운영 로그가 있으면 더 넓은 entity map으로 확장할 수 있다.
