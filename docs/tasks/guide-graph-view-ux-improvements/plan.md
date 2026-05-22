# guide-graph-view-ux-improvements Plan

## Impacted Areas

- `apps/web/src/ui/pages/GuideIndexGraphPage.tsx`: 컴포넌트 구조, 상태 관리, 렌더링 로직
- `apps/web/src/styles.css`: guide-graph CSS 섹션 전체 (변수, 레이아웃, 노드 상태)
- `apps/web/src/ui/guideIndexGraph.ts`: placeGraphNodes clamping 추가
- `apps/web/src/ui/pages/GuideIndexGraphPage.test.tsx`: assertion 현행화

## Technical Approach

### 버그 수정

**SVG 엣지 invisible 버그**
- 원인: `vector-effect: non-scaling-stroke` + `stroke-width: 0.18` 조합으로 0.18 screen-pixel 선이 생성됨
- 수정: `stroke-width: 1.2` (non-scaling-stroke 유지, 1.2px screen-pixel)

**SVG 클릭 차단 버그**
- 원인: `<svg class="guide-graph-links">` 가 `absolute inset-0`으로 board 전체를 덮으며 pointer-events를 가로챔
- 수정: `.guide-graph-links { pointer-events: none; }`

**노드 캡션 어두운 색상 버그**
- 원인: `text-page-fg` (라이트 테마 다크 색상)를 다크 보드 위에서 사용
- 수정: `color: rgba(255,255,255,0.80)` + `text-shadow` 적용

**페이지 레이아웃 breakout 버그**
- 원인: `.guide-graph-page` 클래스가 `width: calc(100vw - 48px)` + 음수 margin으로 viewport 전체를 점유
- 수정: `guide-graph-outer { mx-auto max-w-7xl }` 표준 레이아웃으로 교체

### 인터랙션 설계

**2단계 상태 머신**
```
Overview (expandedGroupId = null)
  → index 노드만 표시, 3rem, 레이블 명확
  → 클릭 → Focused

Focused (expandedGroupId = nodeId)
  → 선택 index 강조(2.8rem), 나머지 index 흐릿(opacity 0.20)
  → 해당 그룹 child/next/related 노드 등장 (0.28s ease 애니메이션)
  → 재클릭 또는 "전체 보기" → Overview
```

**노드 상태 함수**
```typescript
type NodeState = "overview-index" | "focused-index" | "dimmed-index" | "visible-child" | "hidden"

function getNodeState(node, expandedGroupId): NodeState {
  if (expandedGroupId === null) return node.kind === "index" ? "overview-index" : "hidden"
  if (node.id === expandedGroupId) return "focused-index"
  if (node.kind === "index") return "dimmed-index"
  if (node.kind === "orphan" || node.kind === "missing") return "hidden"
  if (node.groupId === expandedGroupId) return "visible-child"
  return "hidden"
}
```

**CSS data-state 기반 제어**
- 상태별 opacity + transform으로 visibility 제어
- `transition: opacity 0.28s ease, transform 0.30s ease`로 부드러운 전환

### Prefix 약어 파싱

```typescript
function parseNodeLabel(title, kind): { abbrev, name } {
  const match = title.match(/^\[([^\]]+)\]\s*(.+)/)
  const maxAbbrev = kind === "index" ? 2 : 1
  if (match) {
    return { abbrev: prefix.slice(0, maxAbbrev), name: match[2] }
  }
  return { abbrev: title.charAt(0), name: title }
}
```

- index 노드: prefix 2글자 (원 내부)
- child 노드: prefix 1글자 또는 첫 글자 (원 내부)
- 원 아래: 전체 페이지명 (자르기 없음)

## Validation Plan

- `pnpm --filter @sfood/web test`: 전체 test suite 통과
- `pnpm --filter @sfood/web typecheck`: 타입 에러 없음
- 브라우저 수동 확인: http://localhost:5173/guides/map
  - index 노드 클릭 시 확장 동작
  - 재클릭 시 축소
  - 레이블 가독성
  - 엣지 표시

## Risks

- `data-state` 기반 CSS transition이 React re-render 타이밍과 맞지 않을 수 있음 → 모든 노드를 DOM에 유지하고 opacity로 제어하여 해결
- 노드가 많을 경우 focused 상태에서 child 노드 위치가 겹칠 수 있음 → placeGraphNodes clamping으로 boundary 처리
