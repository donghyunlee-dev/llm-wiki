# lesson-scene-mermaid-diagram Result

## Delivered Scope

레슨 씬의 `visual` 블록이 `html`+`css` 대신(또는 대신할 수 있게) `mermaid`(다이어그램 정의 텍스트)로도 저작할 수 있게 스키마를 확장하고, 실제로 SVG로 렌더링하는 `MermaidDiagramBlock` 컴포넌트를 추가했다. 이 앱의 디자인 토큰(브랜드 컬러·폰트·라운드 반경)을 반영해 Mermaid 기본 테마(청록/각진 상자)가 아닌 브랜드 톤으로 보이며, 라이트/다크 테마 전환에도 대응한다.

## Changed Files

- `packages/wiki-core/src/lib/lessonSemanticBlocks.ts` / `.test.ts` — `mermaid` 필드 파싱, `mermaidDiagram` `SemanticBlock` variant, html/mermaid 상호 배타 처리
- `packages/wiki-core/src/lib/lessonPresentation.ts` / `.test.ts` — `mermaidDiagram` semantic block 컴파일
- `apps/web/src/ui/pages/lessonScenes/MermaidDiagramBlock.tsx`(신규) / `.test.tsx`(신규)
- `apps/web/src/ui/pages/lessonScenes/SemanticBlockRenderer.tsx` / `.test.tsx`
- `apps/web/src/ui/pages/lessonScenes/SceneShell.tsx`, `SceneRenderer.test.tsx`
- `apps/web/src/styles.css` — `.lesson-block-mermaid*` 클래스
- `apps/web/package.json`, `pnpm-lock.yaml` — `mermaid` 의존성 추가

## Key Decisions

- **테마는 새 색상값을 만들지 않고 기존 CSS 변수를 그대로 재사용**: `--accent`, `--panel-bg`, `--page-fg` 등 이미 있는 토큰을 Mermaid `themeVariables`에 매핑. 다크 테마 토큰이 `color-mix()`를 쓰는데 이 값을 `getComputedStyle`로 읽으면(브라우저가 계산을 안 해줌, 계산해도 Mermaid가 모르는 `color(srgb ...)` 형식으로 나옴) Mermaid의 색 파서가 이해 못 해 초기화가 실패하는 문제를 발견 — 실제 `<color>` 프로퍼티에 대입해 브라우저가 계산하게 한 뒤, 그 결과를 레거시 `rgb()`/`rgba()`로 정규식 변환하는 `toLegacyRgb`를 추가해 해결(퍼센트 채널·알파 `none` 등 변형까지 대응, 직접 단위 테스트로 커버).
- **보안**: `securityLevel: "strict"`만으로는 다이어그램 본문의 `%%{init}%%` 지시어가 `themeCSS` 등 설정을 덮어써 페이지 전역 CSS를 주입할 수 있다는 Codex 지적을 받아, `secure` 설정 키 잠금 목록을 명시적으로 추가했다(회귀 테스트 포함).
- **`html`/`mermaid` 상호 배타**: 한 `visual` 블록에 두 방식이 동시에 있으면 어느 게 "진짜"인지 알 수 없으므로 조용히 하나를 고르지 않고 블록 자체를 버린다 — 저작 실수를 숨기지 않기 위함.
- **렌더 직렬화**: Mermaid의 `initialize()`는 모듈 전역 설정이라 두 렌더(예: 빠른 테마 전환)가 겹치면 서로의 설정을 덮어쓸 수 있어, 모든 렌더를 모듈 전역 프라미스 체인으로 직렬화했다.
- **이미 있는 `interaction.steps` 중복 억제 로직에 `mermaidDiagram`도 포함**: `customHtml`과 동일하게 취급해, mermaid로 그린 도식이 있는 씬에서 텍스트 리스트가 중복 표시되지 않게 했다.

## Codex Review 대응

4개 지적 모두 코드로 반영(보안 설정 키 잠금, 렌더 큐 직렬화, 스키마 상호 배타, 색 변환 함수 하드닝+테스트). 자세한 내용은 `test-result.md`.

## Open Gaps

- Mermaid 렌더링은 iframe 샌드박스 없이 SVG를 직접 `innerHTML`로 주입한다(`customHtml` 경로는 iframe+CSP 사용). `secure` 키 잠금으로 알려진 설정-덮어쓰기 공격은 막았지만, iframe 수준의 완전한 격리는 아니다 — 콘텐츠팀이 신뢰할 수 있는 내부 저작자로 한정된다는 전제. 더 강한 격리가 필요하면 별도 태스크로 iframe 샌드박싱 검토.
- `mermaid` 패키지는 번들 크기가 크다 — 동적 import로 코드 스플리팅했지만, 레슨 리더 자체 페이지 로드에는 영향을 줄 수 있다(실측 안 함).
- 이번 예시(flowchart)만 실제로 Playwright 확인했다 — 다른 Mermaid 다이어그램 타입(sequence, state, gantt 등)은 라이브러리가 일반적으로 지원하지만 개별 확인은 하지 않았다.

## Next Steps

- 사용자 확인 후 커밋.
