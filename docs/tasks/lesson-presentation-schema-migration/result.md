# lesson-presentation-schema-migration Result

## Delivered Scope
콘텐츠 관리 에이전트가 저작 방식을 완전히 바꾼 것(별도 Content Property `lesson.presentation` + `wiki.metadata` 평탄화 필드)에 맞춰 레슨 콘텐츠 읽기·렌더링 파이프라인을 처음부터 다시 만들었다.

- `wiki.metadata`의 lesson 전용 필드(`courseId`/`order`/`chapter`/`estimatedMinutes`/`learningObjectives`/`lastReviewedAt`)를 실제 저작 스키마(평탄화)에 맞춰 읽는다.
- `lesson.presentation` Content Property(신규, 별도 API 호출)를 파싱해 Scene(내레이션/블록/모션/인터랙션/completionEvidence/transitionToNext)을 컴파일하는 새 파이프라인을 만들었다.
- 코스 순서는 `courseId`+`order`로만 결정한다(`next` 체인 폴백 완전 제거, 사용자 확인).
- 기존 H2 헤딩 기반 `bodyHtml` 파서(`lessonScenes.ts`)를 완전히 삭제했다(실 콘텐츠 23개 전부 새 스키마 사용 확인됨).
- 레슨 리더 화면에 `transitionToNext` 배너를 추가하고, Task #25에서 만든 클릭 게이팅형 Reveal 상태 기계는 참고 사이트 실측 결과에 맞춰 신규 스키마에는 연결하지 않았다(모션/인터랙션은 진입 애니메이션 개념으로만 캡처).
- 학습 흐름 드로어에 `chapter` 그룹 헤더를 추가했다.
- Codex 비판 리뷰에서 **Critical 1건**(원격 JSON 재검증 계층이 신규 필드를 전부 누락 — 실사용 시 레슨이 통째로 사라지는 버그)을 발견해 근본 수정했다.

## Changed Files
**wiki-core (신규)**
- `packages/wiki-core/src/lib/lessonPresentation.ts` — `LessonPresentationDocument` → 내부 Scene 모델 컴파일러
- `packages/wiki-core/src/lib/lessonPresentation.test.ts`

**wiki-core (수정)**
- `packages/wiki-core/src/lib/lessonSemanticBlocks.ts` — `LessonPresentationDocument`/`Scene`/`Block` 타입, `SCENE_TYPES`/`SCENE_LAYOUTS`, 공유 파서 `readLessonPresentationValue`(및 헬퍼) 신규, `SemanticBlock`에 `hookStatement`/`exampleNote` variant 추가, `customHtml`에 `css?` 추가
- `packages/wiki-core/src/lib/lessonSemanticBlocks.test.ts` — `readLessonPresentationValue` 유닛 테스트 추가
- `packages/wiki-core/src/lib/confluenceClient.ts` — `lesson.presentation` 별도 fetch(lesson docType만), `wiki.metadata` 평탄화 파싱, 공유 파서로 교체(중복 제거)
- `packages/wiki-core/src/lib/confluenceClient.test.ts` — 신규 스키마 fetch/파싱 테스트로 교체
- `packages/wiki-core/src/lib/confluenceReadModel.ts` — `RawConfluencePage` 타입(메타데이터 평탄화, `presentation` 최상위 이동), `normalizeConfluencePage`
- `packages/wiki-core/src/lib/wikiDataSource.ts` — **(Critical 수정)** 원격 JSON 재검증 계층에 `presentation`/평탄화 필드 읽기 추가
- `packages/wiki-core/src/lib/wikiDataSource.test.ts` — 회귀 테스트 추가
- `packages/wiki-core/src/lib/wikiDocuments.ts` — `WikiDocument` 타입(메타데이터 평탄화, `presentation` 최상위)
- `packages/wiki-core/src/lib/lessonDocuments.ts` — `listLessonDocumentsFrom`을 `courseId`+`order` 전용으로 재작성(레거시 체인 제거), `presentation` 없는 레슨 제외
- `packages/wiki-core/src/lib/lessonDocuments.test.ts`
- `packages/wiki-core/src/lib/courseOutline.ts` — 새 컴파일러 사용, `estimatedMinutes` 메타데이터 우선, `chapter` 패스스루
- `packages/wiki-core/src/lib/courseOutline.test.ts`
- `packages/wiki-core/src/lib/lessonDiagnostics.ts`/`.test.ts` — 새 Scene 타입 사용, obsolete한 anchor 교차검증 진단 제거
- `packages/wiki-core/src/lib/confluenceSnapshots.ts` — 레슨 픽스처 2건을 신규 스키마로 전면 교체
- `packages/wiki-core/src/index.ts` — export 갱신

**wiki-core (삭제)**
- `packages/wiki-core/src/lib/lessonScenes.ts`, `lessonScenes.test.ts`

**apps/web**
- `apps/web/src/ui/pages/LessonReaderPage.tsx` — 새 컴파일러 연결, Reveal 상태 기계 제거, `transitionToNext` 배너 추가, `scene.visual`(context-window/hotspots) 렌더 분기 제거
- `apps/web/src/ui/pages/LessonReaderPage.test.tsx` — 전면 재작성(신규 스키마 픽스처, Reveal/Reference-Panel-내부-링크 테스트 제거 — 아래 Open Gaps 참고)
- `apps/web/src/ui/pages/LessonIndexPage.tsx`/`.test.tsx`
- `apps/web/src/ui/pages/LessonOutlineDrawer.tsx`/`.test.tsx` — `chapter` 그룹 헤더
- `apps/web/src/ui/pages/HomePage.test.tsx` — 픽스처 갱신
- `apps/web/src/ui/pages/lessonScenes/SemanticBlockRenderer.tsx` — `hookStatement`/`exampleNote`/`customHtml`+`css` 렌더링
- `apps/web/src/ui/pages/lessonScenes/CustomHtmlDiagramBlock.tsx`/`.test.tsx` — `css` prop 지원 + `</style>` 브레이크아웃 방어
- `apps/web/src/styles.css` — 신규 블록/배너/챕터헤더 CSS, 이제 도달 불가능해진 `[data-revealing]` 애니메이션 규칙 제거
- `docs/prd/confluence-metadata.md` — 새 스키마 전체 문서화

## Key Decisions
- **레거시 H2 파서 완전 제거**(사용자 명시적 확인) — 실 콘텐츠 23개 전부 새 스키마 사용.
- **Reveal 클릭 게이팅을 신규 스키마에 연결하지 않음** — 참고 사이트 실측 결과 `reveal: "manual"`이 있어도 클릭 게이팅 없이 즉시 전체 노출됨을 확인, spec.md/plan.md를 이 발견에 맞춰 구현 중 수정.
- **파싱 로직을 한 곳(`lessonSemanticBlocks.ts`)에 모음** — Critical 버그(두 검증 계층이 따로 유지되다 한쪽이 신규 필드를 놓침)가 발견된 뒤, 같은 실수가 재발하지 않도록 confluenceClient.ts/wikiDataSource.ts가 동일 함수를 공유하도록 리팩터링.
- **완료된 12개 레거시 기능(Task #25 Reveal, #28 Hotspot/Context Window)의 컴포넌트 자체는 삭제하지 않음** — 새 스키마가 이들을 더 이상 트리거하지 않지만, 명시적으로 삭제 요청받지 않은 기능을 이번 스코프에서 함께 제거하지 않기로 결정(Open Gaps에 명시).

## Removed (사용자 확인)
- **Reference Panel(출처 패널) 기능 전체 삭제** — `ReferencePanel.tsx`/`.test.tsx` 삭제, `LessonReaderPage.tsx`에서 `handleSceneContentClick`/`reference` 상태/관련 CSS(`lesson-reference-*`) 전부 제거. 실 23개 레슨 데이터와 참고 사이트를 직접 재확인한 결과 링크(`<a>`, `http(s)://`)가 단 하나도 없음을 확인 — 이 기능은 실 콘텐츠나 참고 사이트가 애초에 쓰지 않는 기능이었고, 이전 세션에서 만든 테스트용 픽스처로만 동작을 확인했던 것으로 판단, 사용자 확인 후 삭제.
- **"안 쓰는 것, 죽은 것 다 삭제" 전면 감사 후 삭제** (사용자 요청):
  - `ContextWindowVisual.tsx`/`.test.tsx`, `HotspotVisual.tsx`/`.test.tsx` 삭제(새 컴파일러가 생성하지 않는 `scene.visual` 경로를 위해 만들었던 컴포넌트) + 관련 CSS(`lesson-context-window-*`, `lesson-hotspot-*`) 삭제.
  - `lessonSemanticBlocks.ts`의 `SceneVisual`/`HotspotPoint` 타입 삭제.
  - `lessonSemanticBlocks.ts`의 `compileSceneBlocks`(H2 `bodyHtml` → SemanticBlock 정규식 컴파일러 전체)와 `inferSceneTypeAndLayout` 삭제 — 이 파이프라인의 유일한 호출자였던 `lessonScenes.ts`가 이미 삭제되어 있어 완전히 도달 불가능한 상태였다. 이에 딸린 헬퍼(`splitCleanHtmlIntoBlocks`, `buildKnowledgeCheckBlock`, `extractTableRows`, `extractListItems` 등)와 정규식 상수 전부 함께 삭제, `confluenceCleanHtml`/`WikiDocument` import도 제거.
  - `SemanticBlock` 타입에서 이제 어떤 컴파일러도 생성하지 않는 variant(`bullets`/`steps`/`comparison`/`callout`/`image`/`knowledgeCheck`/`unsupported`) 삭제 — `paragraph`/`customHtml`/`hookStatement`/`exampleNote` 4개만 남김.
  - `SemanticBlockRenderer.tsx`에서 위 variant들의 렌더 분기, `ImageBlock`/`KnowledgeCheckBlock` 컴포넌트 삭제 + 관련 CSS(`lesson-block-bullets/steps/comparison/callout/image/knowledge-check/unsupported`) 삭제.
  - `lessonDiagnostics.ts`에서 `missing_image_alt`/`unsupported_block_rendered` 진단(다시는 발생할 수 없는 block kind를 검사) 삭제.
  - `lessonAnalytics.ts`의 `LessonEventName`에서 `unsupported_block_rendered`/`asset_load_failure`(유일한 발생 경로였던 컴포넌트들이 모두 삭제됨) 삭제, `LessonReaderPage.tsx`의 관련 로깅 분기 삭제.
  - **삭제하지 않은 것**: `KnowledgeCheckScene.tsx`와 기타 Scene 타입 컴포넌트(HookScene/MentalModelScene/ProcessScene/MisconceptionScene/ScreenshotScene/SummaryScene) — 이들은 `SceneType`/`SceneLayout` enum이 여전히 유효하게 허용하는 값(콘텐츠 에이전트가 아직 안 썼을 뿐 저작 가능)에 대한 라우팅 타깃이라 죽은 코드가 아니다. `.lesson-scene-layout-grid`/`full-visual`/`screenshot-hotspot` 등 레이아웃 CSS도 동일한 이유로 유지.

## Open Gaps
- **`motion`/`interaction` 필드는 캡처만 하고 렌더링에 반영하지 않는다** — Scene 진입 애니메이션(stagger/step-reveal/fade/highlight)을 실제로 구현하려면 sandbox iframe 경계를 넘나드는 방식을 별도로 설계해야 한다(현재 `visual` 콘텐츠는 iframe 내부라 부모 페이지 애니메이션을 직접 걸 수 없다).
- 모바일 좁은 화면에서 저작자가 3열 그리드로 만든 `visual` 블록이 가로 스크롤 없이 다 안 보이는 경우가 실측 확인됨(콘텐츠 저작 쪽 반응형 이슈, 코드 결함 아님) — 필요하면 콘텐츠팀에 반응형 CSS 가이드 전달 필요.

## Next Steps
- 콘텐츠팀에 `visual` 블록 CSS의 모바일 반응형 가이드 공유(선택).
