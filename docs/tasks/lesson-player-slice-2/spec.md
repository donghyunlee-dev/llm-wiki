# lesson-player-slice-2 Spec

참조 설계: `docs/prd/lesson-player-design.md`. Slice 1(`docs/tasks/lesson-player-slice-1/`) 완료 후 이어지는 다음 단계 — 사용자가 "콘텐츠 관련(메타데이터 입력, 콘텐츠 작성 자체) 제외하고 나머지 전부 진행"을 요청, 우선순위는 "나머지 Scene Type → Motion → Interactive → Backend API" 순으로 확정. 이 문서는 그중 1번째(Scene Type 확장 + 신규 HTML 다이어그램 블록)를 다룬다.

## Problem Statement

- 현재 5개 Scene Type(hook/mental-model/process/comparison/knowledge-check)만 지원해, 설계서가 정의한 나머지 6개(`concept`/`example`/`screenshot`/`misconception`/`summary`/`closing`)와 4개 Layout(`timeline`/`grid`/`full-visual`/`screenshot-hotspot`)이 없다.
- 콘텐츠팀이 도식·도형·관계 표현을 Confluence에 HTML+CSS로 직접 제공하기로 했다. 현재 Lesson Compiler는 임의 HTML을 전부 `unsupported` 안내 카드로 처리하므로, 이렇게 제공되는 다이어그램이 그대로 안내 카드로만 보이고 실제로 렌더링되지 않는다.

## Business Context

- Slice 1은 "장면이 깨져 보이는" 근본 버그를 고쳤을 뿐 설계서 전체 기능의 일부만 구현했다. 콘텐츠팀과의 협의로 도식은 HTML+CSS로 제공하기로 했으므로, 이를 안전하게 렌더링할 공통 컴포넌트가 없으면 콘텐츠팀의 작업이 무의미해진다.

## Scope

1. `SceneType`에 6개 추가: `concept`, `example`, `screenshot`, `misconception`, `summary`, `closing`. `SceneLayout`에 4개 추가: `timeline`, `grid`, `full-visual`, `screenshot-hotspot`(레이아웃 셸만 — 실제 Hotspot 인터랙션은 후속 Interactive 컴포넌트 Slice에서 다룸).
2. `inferSceneTypeAndLayout`의 규칙 기반 추론을 설계서 "기본 추론 규칙" 표에 맞춰 전부 반영(현재 `concept` 자리채움으로 쓰던 `mental-model` 기본값을 실제 `concept`로 교체).
3. 신규 `SemanticBlock` 종류 `customHtml` 추가 — Confluence의 "HTML" 매크로(`ac:structured-macro ac:name="html"`, `ac:plain-text-body` CDATA)로 작성된 콘텐츠를 감지해 원문 그대로(가공하지 않고) 보존한다.
4. 신규 공통 컴포넌트 `CustomHtmlDiagramBlock` — `customHtml` 블록을 sandbox 처리된 `<iframe srcDoc>`로 렌더링한다. `sandbox="allow-same-origin"`만 부여하고 `allow-scripts`는 절대 부여하지 않아, 콘텐츠팀이 넣은 스크립트가 있어도 실행되지 않는다. 부모 창에서 iframe의 `contentDocument.body.scrollHeight`를 읽어 높이를 자동 맞춘다.
5. 새 Scene 컴포넌트 6개(`ConceptScene` 등) + 새 Layout 4개에 대응하는 CSS.

## Out Of Scope

- 실제 Screenshot Hotspot 인터랙션(확대/미니맵/키보드 이동) — 레이아웃 셸만 만들고 동작은 후속 Interactive 컴포넌트 Slice에서.
- Motion Preset·장면 전환 애니메이션 — 다음 Slice.
- Backend 전용 API/캐시 계층 — 다음 Slice.
- 콘텐츠팀의 실제 HTML 다이어그램 작성(콘텐츠 작업 자체) — 이번 Slice는 "발견되면 렌더링되는 메커니즘"만 만든다.
- HTML 매크로 외의 다른 임베드 방식(예: 별도 Forge 매크로) 지원 — 실제 사례가 나타나면 후속으로 확장.

## Acceptance Criteria

- AC1: 11개 Scene Type 전부가 대응하는 컴포넌트로 렌더링된다.
- AC2: 명시적 `presentation` 지정이 없을 때, 설계서 추론 규칙표와 일치하는 Scene Type/Layout이 선택된다.
- AC3: `ac:structured-macro ac:name="html"` 매크로가 포함된 장면을 열면, 매크로 내용이 sandbox iframe으로 렌더링되고 원본 HTML/CSS 모양이 유지된다.
- AC4: 위 iframe에 `<script>` 태그나 `onclick` 등 이벤트 핸들러가 포함돼 있어도 실행되지 않는다(sandbox 검증).
- AC5: iframe 높이가 내용에 맞춰 자동으로 조정되어 스크롤이나 잘림이 발생하지 않는다(합리적인 콘텐츠 크기 기준).
- AC6: 기존 `pnpm test`, `pnpm typecheck` 통과.

## Edge Cases

- HTML 매크로 내용이 비어 있음: 빈 iframe을 만들지 않고 조용히 생략한다.
- HTML 매크로가 매우 큰 콘텐츠(과도한 높이)를 포함: 높이에 상한을 두지 않되(설계서 "콘텐츠 예산" 원칙상 저작 단계에서 통제해야 함), 최소 높이는 보장한다.
- `<script>`가 포함된 매크로: sandbox가 실행을 막으므로 안전하게 무시된다(에러 없이 렌더링만 스킵).

## Assumptions

- HTML 매크로 authoring 컨벤션은 실제 사례가 없어 "Confluence 공식 HTML 매크로"로 가정한다(사용자 확인). 실제 콘텐츠가 다른 형태로 온다면 이 가정을 재검토해야 한다.
- Scene Type 확장은 기존 5개와 동일한 셸 패턴(`SceneShell` + 블록 목록)을 그대로 재사용한다.

## Clarifications

- Q: Motion/Interactive/Backend API는 이 Slice에 포함되나?
  A: 아니오. 사용자가 확정한 순서(Scene Type → Motion → Interactive → Backend API)에 따라 별도 후속 Slice로 진행한다.
