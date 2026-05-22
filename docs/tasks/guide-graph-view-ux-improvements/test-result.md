# guide-graph-view-ux-improvements Test Result

## Environment

- Profile: local web app (Vite dev server, http://localhost:5173)
- Test runner: Vitest
- Browser: manual verification via dev server

## Automated Test Commands

```
pnpm --filter @sfood/web test
pnpm --filter @sfood/web typecheck
```

## Results

- PASS: wiki-core test suite 45/45 통과
- PASS: web test suite 26/26 통과
- PASS: web app typecheck 0 errors
- PASS: /guides/map 페이지 HTTP 200 응답

## Snapshot Fix

개발 환경에서 그래프가 빈 상태로 표시되는 문제가 있었다. 원인: `isIndexWikiDocument()` 가 slug 또는 제목에 "index"/"인덱스"가 포함된 문서를 index 노드로 인식하는데, 기존 9개 스냅샷 문서에는 해당 키워드가 없었다.

해결: `confluenceSnapshots.ts`에 "가이드 인덱스" 문서(id: 91000000, slug: "guide-index") 추가. `next: ["91000001", "91000002", "91000003"]`으로 기존 가이드 문서 3개를 연결하여 클릭 확장 시 하위 문서가 펼쳐지도록 구성.

관련 테스트 두 곳 수정:
- `confluenceSnapshots.test.ts`: `documents.length` 9 → 10
- `wikiDataSource.test.ts`: 두 곳의 length 9 → 10, `documents[0].title` "Agent 시작하기" → "가이드 인덱스"

## Manual Verification Checklist

- PASS: overview 상태에서 index 노드만 표시됨
- PASS: index 노드 클릭 시 expandedGroupId 상태 변경 → 연결 문서 등장 (CSS transition)
- PASS: 재클릭 시 overview로 복귀
- PASS: "← 전체 보기" 버튼으로 overview 복귀
- PASS: SVG 엣지가 focused 상태에서 정상 표시 (stroke-width 1.2px)
- PASS: 노드 원 내부에 prefix 약어 표시
- PASS: 원 아래 전체 페이지명 표시 (잘림 없음)
- PASS: 페이지 레이아웃이 다른 페이지와 동일하게 정렬됨
- PASS: 초기 안내 힌트 표시 (overview 상태)
- PASS: focus bar가 선택 시 나타남 (index 제목, 카운트, "문서 열기", "전체 보기")

## Known Gaps

- 노드가 매우 많을 경우 focused 상태에서 자식 노드 겹침 가능 (현재 데이터로는 미발생)
- overview 상태에서 index 노드 레이블이 긴 경우 인접 노드 레이블과 시각적으로 겹칠 수 있음

## Acceptance Criteria Coverage

- AC1: index 노드 클릭 확장 → 수동 검증 PASS
- AC2: 재클릭 / 전체 보기 버튼 → 수동 검증 PASS
- AC3: overview 레이블 가독성 → 수동 검증 PASS
- AC4: prefix 약어 + 전체 페이지명 → 수동 검증 PASS
- AC5: SVG 엣지 표시 → 수동 검증 PASS
- AC6: 페이지 레이아웃 정렬 → 수동 검증 PASS
