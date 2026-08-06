# lesson-player-slice-2 Plan

## Summary

`lessonSemanticBlocks.ts`에 `customHtml` 블록 종류와 HTML 매크로 감지 로직을 추가하고, `SceneType`/`SceneLayout`을 설계서 전체 목록으로 확장한 뒤, 프런트엔드에 6개 Scene 컴포넌트 + `CustomHtmlDiagramBlock`(sandbox iframe)을 추가한다.

## Impacted Modules

- `packages/wiki-core/src/lib/lessonSemanticBlocks.ts` — 타입 확장, HTML 매크로 파싱, 추론 규칙 갱신
- `apps/web/src/ui/pages/lessonScenes/` — 6개 신규 Scene 컴포넌트, `CustomHtmlDiagramBlock.tsx`(신규), `SemanticBlockRenderer.tsx` 갱신, `SceneRenderer.tsx` 맵 확장
- `apps/web/src/styles.css` — 4개 신규 Layout 클래스 + `customHtml` 블록 스타일

## Architecture Approach

- 기존 sentinel-marker 패턴(Mermaid/code 매크로가 쓰던 `<div data-lesson-unsupported="...">`)과 동일한 방식이지만, `customHtml`은 임의 길이의 원문 HTML을 보존해야 하므로 속성 문자열에 넣지 않고 `compileSceneBlocks` 내부의 배열에 인덱스로 저장한 뒤 `<div data-lesson-custom-html-index="N"></div>` 마커로 치환한다. `splitCleanHtmlIntoBlocks`가 이 마커를 만나면 배열에서 원문을 꺼내 `customHtml` 블록을 만든다.
- HTML 매크로는 Mermaid 확장/코드 매크로보다 먼저 치환한다(매크로 이름이 다르므로 겹치지 않지만, 파이프라인 순서를 명확히 하기 위함).
- `CustomHtmlDiagramBlock`은 `sandbox="allow-same-origin"`만 사용하고 `allow-scripts`를 절대 추가하지 않는다 — 이것이 XSS 방지의 유일하고 충분한 경계다(정규식 기반 sanitize는 추가하지 않는다 — sandbox가 스크립트 실행 자체를 막으므로 이중 방어가 필요 없고, 손으로 짠 sanitizer는 우회 가능성이 있어 오히려 잘못된 안전감을 줄 수 있다).
- 높이 자동 조정은 `onLoad`에서 `iframe.contentDocument?.body.scrollHeight`를 읽어 `iframe.style.height`에 반영한다. `allow-same-origin`이 있으므로 부모에서 같은 출처로 접근 가능하다.

## Data And API Impact

- `SemanticBlock` 유니온에 `{ kind: "customHtml"; html: string }` 추가 — 기존 소비자는 switch 문에 새 case가 필요(타입 체크가 강제).
- `SceneType`/`SceneLayout` 유니온 확장은 `wiki.metadata.presentation`의 허용값 검증(`confluenceClient.ts`의 `SCENE_TYPES`/`SCENE_LAYOUTS` Set)에도 반영해야 한다.

## Validation Plan

- `lessonSemanticBlocks.test.ts`에 HTML 매크로 → `customHtml` 블록 변환, 빈 매크로 무시, script/on* 포함 시에도 원문이 그대로 보존되는지(sandbox가 처리하므로 컴파일러 단계에서 제거하지 않음을 검증) 테스트 추가.
- `CustomHtmlDiagramBlock.test.tsx` — sandbox 속성이 `allow-scripts` 없이 `allow-same-origin`만 포함하는지, srcDoc에 전달한 내용이 그대로 반영되는지 검증.
- `SceneRenderer.test.tsx`에 11개 Scene Type 전체 분기 테스트 추가.
- `pnpm typecheck`/`pnpm test` 전체 통과.
- Playwright: 임의의 `<style>`+`<div>` 다이어그램 HTML을 담은 스냅샷 fixture 레슨을 만들어 브라우저에서 실제로 렌더링되는지, `<script>alert(1)</script>`를 넣어도 alert이 뜨지 않는지 직접 확인.

## Risks

- **iframe 높이 자동조정 실패 가능성**: `sandbox="allow-same-origin"`이지만 `srcDoc` 콘텐츠의 리소스 로딩(이미지 등)이 늦게 끝나면 `onLoad` 시점에 최종 높이가 다를 수 있다 → `ResizeObserver`로 보완.
- **실제 콘텐츠가 HTML 매크로가 아닌 다른 형태로 올 경우**: 이번 Slice의 감지 로직이 무용지물이 될 수 있다 — 실제 사례 발견 시 빠르게 패턴을 추가할 수 있도록 매크로 감지 로직을 한 함수로 격리해둔다.

## Rollback Considerations

- `customHtml` 블록은 옵셔널 신규 종류이므로, 문제가 생기면 HTML 매크로 감지 정규식만 되돌리고(기존 code 매크로 처리 경로로 재흡수) 나머지는 영향받지 않는다.
