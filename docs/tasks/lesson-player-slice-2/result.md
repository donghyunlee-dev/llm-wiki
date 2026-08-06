# lesson-player-slice-2 Result

## Delivered Scope

- 설계서의 11개 Scene Type 전부와 8개 Layout 전부를 지원한다(Slice 1의 5개 Type/4개 Layout에 `concept`/`example`/`screenshot`/`misconception`/`summary`/`closing`과 `timeline`/`grid`/`full-visual`/`screenshot-hotspot` 추가).
- 규칙 기반 Scene Type 추론이 설계서 "기본 추론 규칙" 표를 그대로 반영한다(경고 콜아웃 → misconception, 이미지 중심 → screenshot, 그 외 기본값 → concept).
- 콘텐츠팀이 Confluence "HTML" 매크로로 제공하는 도식/도형을 안전하게 렌더링하는 공통 컴포넌트(`CustomHtmlDiagramBlock`)를 만들었다. `sandbox="allow-same-origin"`(스크립트 실행 차단) + CSP(`default-src 'none'` 등, 원격 네트워크 요청 차단) + `referrerPolicy="no-referrer"` 3중 방어로, 콘텐츠에 스크립트나 이벤트 핸들러, 원격 이미지/폰트 로딩이 섞여 있어도 실행·유출되지 않는다.

## Changed Files

- `packages/wiki-core/src/lib/lessonSemanticBlocks.ts` — `SceneType`/`SceneLayout` 확장, HTML 매크로 감지·추출(`customHtml` 블록), 추론 규칙 갱신, 중첩 HTML 매크로 유실 방지
- `packages/wiki-core/src/lib/confluenceClient.ts` — `SCENE_TYPES`/`SCENE_LAYOUTS` 검증 Set 확장
- `apps/web/src/ui/pages/lessonScenes/` — 6개 신규 Scene 컴포넌트, `CustomHtmlDiagramBlock.tsx`(신규, sandbox iframe), `SceneRenderer.tsx`/`SemanticBlockRenderer.tsx` 갱신
- `apps/web/src/styles.css` — 4개 신규 Layout 클래스, `.lesson-block-custom-html` 스타일
- `packages/wiki-core/src/lib/confluenceSnapshots.ts` — HTML 매크로 도식 예시 장면 추가(회귀 fixture)
- 대응하는 테스트 파일 전체(신규 1개 + 기존 3개 갱신)

## Key Decisions

- **HTML 매크로를 콘텐츠 임베드 통로로 채택**: 사용자가 "Confluence 공식 HTML 매크로로 추정"이라고 확인한 대로, `ac:structured-macro ac:name="html"`의 `ac:plain-text-body` CDATA를 원문 그대로 보존해 렌더링 시점에만 안전 처리한다. 컴파일 단계에서 sanitize하지 않는 이유: 정규식 기반 HTML sanitizer는 우회 가능성이 있어 오히려 잘못된 안전감을 줄 수 있다 — 브라우저의 iframe sandbox 격리가 훨씬 강력하고 검증된 경계다.
- **Motion은 순수 CSS로(사용자 확정)**: 설계서가 참조하는 motion.dev 라이브러리를 추가하지 않고 기존 CSS 체계 안에서 구현하기로 확정(다음 Slice에서 적용).
- **Codex 리뷰로 실제 보안 결함 예방**: `allow-same-origin`만으로는 스크립트 실행은 막아도 수동 네트워크 요청(이미지 핑백 등)을 통한 정보 유출은 막지 못한다는 지적을 받아 CSP를 추가했다 — 이 지적이 없었다면 "안전하다"고 잘못 보고할 뻔했다.

## Open Gaps

- **HTML 매크로 추출 정규식의 견고성**: `ac:name="html"`(쌍따옴표), CDATA 내부에 리터럴 `</ac:structured-macro>` 문자열이 없는 경우만 안정적으로 동작한다. 실제 콘텐츠가 다른 저작 형태로 온다면 패턴을 다시 확인해야 한다.
- **iframe 높이 재조정은 `onLoad` 시점 1회만**: 도식 내부에 지연 로딩되는 웹폰트나 나중에 크기가 바뀌는 요소가 있으면 높이가 어긋날 수 있다. `ResizeObserver` 도입은 후속 과제.
- **Screenshot Hotspot은 레이아웃 셸만 존재**: 실제 확대/미니맵/키보드 이동 인터랙션은 이번 Slice 범위 밖(실제 스크린샷 콘텐츠가 있어야 의미 있게 검증 가능 — Interactive 컴포넌트 Slice에서 다룸).
- **`example`/`summary`/`closing`/`mental-model`은 자동 추론 규칙이 없음(설계서 표에도 없음)**: `wiki.metadata.presentation`으로 명시해야만 선택된다.

## Next Steps

- 사용자가 확정한 순서대로 Motion Preset(순수 CSS 전환)을 다음으로 진행한다.
- 이어서 Interactive 컴포넌트(Context Window 등, Screenshot Hotspot 제외) → Backend API/캐시 계층 순으로 진행한다.
