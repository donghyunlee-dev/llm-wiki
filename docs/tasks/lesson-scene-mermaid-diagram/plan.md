# lesson-scene-mermaid-diagram Plan

## Impacted Areas

- `packages/wiki-core/src/lib/lessonSemanticBlocks.ts` (+`.test.ts`) — `visual` 블록이 `mermaid` 필드를 받아들이도록 파서 확장, `SemanticBlock`에 `mermaidDiagram` variant 추가
- `packages/wiki-core/src/lib/lessonPresentation.ts` (+`.test.ts`) — `compileBlock`에서 `mermaid` 필드가 있으면 `mermaidDiagram` semantic block으로 컴파일
- `apps/web/src/ui/pages/lessonScenes/MermaidDiagramBlock.tsx`(신규) — Mermaid 정의를 SVG로 렌더링, 앱 디자인 토큰 기반 커스텀 테마 적용, 라이트/다크 대응
- `apps/web/src/ui/pages/lessonScenes/SemanticBlockRenderer.tsx` (+`.test.tsx`) — `mermaidDiagram` kind 분기 추가
- `apps/web/src/ui/pages/lessonScenes/SceneShell.tsx` (+관련 테스트) — `hasVisualBlock` 판정에 `mermaidDiagram`도 포함
- `apps/web/package.json`, `pnpm-lock.yaml` — `mermaid` 의존성 추가

## Approach

1. **스키마**: `readLessonPresentationBlock`의 `kind === "visual"` 분기를 확장한다 — `html`+`css`가 있으면 기존과 동일하게 처리하고, 없고 `mermaid`(string)가 있으면 `{ order, kind: "visual", mermaid, visualKind?, purpose? }`를 반환한다. 둘 다 없으면 기존처럼 조용히 버린다(undefined).
2. **컴파일**: `compileBlock`에서 `"html" in block"`(기존)에 이어 `"mermaid" in block`이면 `{ kind: "mermaidDiagram", definition: block.mermaid }`를 반환한다.
3. **렌더링 컴포넌트**: `MermaidDiagramBlock.tsx`가
   - `mermaid` 패키지를 동적 `import()`로 로드한다(번들 분리 — 레슨 리더를 안 쓰는 페이지 초기 로드에 영향 없음).
   - `useTheme()`의 `resolvedTheme`을 구독해 라이트/다크가 바뀌면 다시 렌더링한다.
   - 렌더링 직전에 `getComputedStyle(document.documentElement)`로 이 앱이 이미 쓰는 CSS 변수(`--accent`, `--accent-strong`, `--panel-bg`, `--panel-border`, `--page-fg`, `--font-sans`)의 **현재 계산된 값**을 읽어 Mermaid `themeVariables`(`primaryColor`, `primaryBorderColor`, `lineColor`, `background`, `textColor`, `fontFamily` 등)에 그대로 대입한다 — 새 색상값을 만들지 않고 이미 있는 토큰을 그대로 재사용한다("하드코딩 금지" 원칙 준수). Mermaid의 기본 테마(각진 사각형, 청록색)를 그대로 쓰지 않기 위한 최소한의 개입이다.
   - `mermaid.render(id, definition)`이 반환한 SVG 문자열을 컨테이너에 삽입한다. `securityLevel: "strict"`를 명시해 다이어그램 텍스트에 포함된 `click` 이벤트 등으로 스크립트가 실행되지 않게 한다(AC7).
   - 파싱 실패(잘못된 Mermaid 문법) 시 예외를 삼키지 않고 사용자에게 "다이어그램을 표시할 수 없습니다" 같은 최소한의 폴백 텍스트를 보여준다(빈 화면보다 안전).
4. **`SemanticBlockRenderer.tsx`**: `case "mermaidDiagram"` 추가.
5. **`SceneShell.tsx`**: `hasVisualBlock`을 `blocks.some(b => b.kind === "customHtml" || b.kind === "mermaidDiagram")`로 확장.
6. **테스트**: Mermaid는 실제 SVG 레이아웃 계산에 `getBBox` 등 jsdom이 구현하지 않는 API를 쓰므로, 컴포넌트 테스트에서는 `vi.mock("mermaid")`로 `render()`가 고정 SVG 문자열을 반환하게 목킹하고, "definition을 mermaid.render에 넘긴다", "반환된 SVG를 그린다", "테마 전환 시 다시 렌더링한다" 정도를 검증한다. 실제 시각적 결과(도형이 예쁘게 나오는지)는 Playwright로 확인한다.

## Validation Plan

- `pnpm typecheck`, `pnpm test`(wiki-core + web)
- Playwright: 사용자가 제시한 예시 Mermaid 정의(이해→연결→완성→확장 flowchart)를 씬 8 데이터에 임시로 넣어 라이트/다크 테마에서 실제 렌더링 확인, 커스텀 테마(브랜드 컬러 반영)가 적용됐는지 확인.
- Codex 크리티컬 리뷰(보안: `securityLevel`, XSS 여부 중점 확인 요청).

## Risks

- `mermaid` 패키지는 용량이 크다(트리셰이킹 후에도 수백 KB) — 동적 import로 완화하지만, 레슨 리더 자체의 초기 로드는 영향받을 수 있다.
- Mermaid의 `themeVariables`는 렌더링 시점에 값을 굽는(bake) 방식이라, 테마가 바뀔 때마다 전체를 다시 `render()`해야 한다 — 다이어그램이 많은 씬에서는 약간의 깜빡임이 있을 수 있다.
- Mermaid 문법 오류가 있는 콘텐츠가 배포되면 폴백 텍스트만 보인다 — 콘텐츠팀에 문법 사전 검증 방법 안내가 필요할 수 있음(이번 범위 밖, 필요시 별도 태스크).
