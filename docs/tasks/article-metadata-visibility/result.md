# article-metadata-visibility Result

## 완료 범위

### ArticlePage.tsx
- 상단 metadata 칩 영역의 `<details>` 래퍼를 제거
- 원래 flat `<div className="section-stack ...">` 구조로 복구
- docType, audience, updatedAt 칩이 항상 노출됨

### ArticleContentRenderer.tsx
- `renderNode`의 `pre` 블록 분기에 `wiki.metadata` 감지 로직 추가
- `<div>` 기반 Confluence 코드 블록 분기에도 동일하게 적용
- 감지 시 `<details class="article-metadata-details">` 로 래핑 (기본 접힘)

### styles.css
- `.article-metadata-details`, `.article-metadata-summary` 스타일 추가
- 열렸을 때 summary 아래 구분선 처리

## 결정 사항
- `wiki.metadata` 판별 기준: `codeText.trimStart().startsWith("wiki.metadata")`
- 토글 레이블: "문서 메타데이터"

## 남은 사항
- 브라우저에서 실제 렌더링 확인 권장
