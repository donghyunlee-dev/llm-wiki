# article-metadata-visibility Plan

## Impacted Areas
- `apps/web/src/ui/pages/ArticlePage.tsx` — 상단 metadata 칩 노출 복구
- `apps/web/src/ui/pages/ArticleContentRenderer.tsx` — `wiki.metadata` 블록 접기 처리

## Approach

### 1. ArticlePage.tsx
`<details>` 래퍼를 제거하고 원래의 flat `<div>` 구조로 복구.

변경 전:
```tsx
<details className="mt-6 text-xs text-muted-fg">
  <summary ...>문서 정보</summary>
  <div className="mt-2 flex flex-wrap gap-2">
    ...chips...
  </div>
</details>
```

변경 후:
```tsx
<div className="section-stack mt-6 flex flex-wrap gap-2 space-y-0 text-xs text-muted-fg">
  ...chips...
</div>
```

### 2. ArticleContentRenderer.tsx
`renderNode`의 `pre` 및 `div` 코드 블록 분기에서 `wiki.metadata`로 시작하는 코드를 감지하면 `<details>`로 래핑.

```tsx
if (codeText.trimStart().startsWith("wiki.metadata")) {
  return (
    <details key={key} className="article-metadata-details">
      <summary>문서 메타데이터</summary>
      <WikiCodeBlock code={codeText} language={language} />
    </details>
  );
}
```

## Validation Plan
1. 상세 페이지 상단 metadata 칩 노출 확인
2. `wiki.metadata` 블록 기본 접힘 확인
3. 토글 동작 확인
4. 일반 코드 블록 영향 없음 확인
5. TypeScript 타입 오류 없음 확인

## Risks
- 없음 — 렌더링 레이어만 변경, 데이터 구조 무변경
