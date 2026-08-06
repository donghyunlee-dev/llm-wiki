# lesson-presentation-schema-migration Spec

## Problem Statement

콘텐츠 관리 에이전트(및 사용자)가 레슨 콘텐츠를 저작하는 방식이 완전히 바뀌었다. 실제 Confluence의 레슨 문서 23개를 REST API로 직접 조회해 확인한 결과:

1. 코스 순서는 더 이상 `wiki.metadata.next` 체인이 아니라 `wiki.metadata.courseId`/`order`(평탄화된 최상위 필드)로 결정된다.
2. 진짜 학습 콘텐츠(Scene 구조, 내레이션, 시각 자료, 모션, 인터랙션, 다음 장면 예고 등)는 `bodyHtml`이 아니라 **`lesson.presentation`이라는 별도의 Confluence Content Property**(JSON)에 있다.
3. 우리 코드(`confluenceClient.ts`)는 `wiki.metadata` 하나만 `?key=wiki.metadata`로 조회하므로 `lesson.presentation`을 아예 읽지 않는다. `wiki.metadata`도 옛 스키마(`course: {courseId, order}` 중첩, `next`/`related` 배열)를 기대하지만 실제 값은 평탄화된 새 스키마다.
4. 결과적으로 우리 레슨 리더는 (a) 코스 순서를 전혀 계산하지 못하고 (b) H2 헤딩 기반 `bodyHtml` 파서(`lessonScenes.ts`)가 만들어내는 콘텐츠는 실제 저작 콘텐츠의 열화된 미러(플레이스홀더 텍스트, 평문 표)일 뿐 진짜 시각 자료·모션·인터랙션을 전혀 반영하지 못한다.

사용자가 제공한 참고 사이트(https://sfood-ai-education.leedh84.chatgpt.site/)는 이 `lesson.presentation` JSON을 그대로 렌더링하는 것으로 확인됐다(Scene별 hook/explanation/visual 블록, transitionToNext 배너, lessonId 기반 eyebrow 라벨 등 1:1 대응 확인).

## Business Context

콘텐츠 에이전트가 이미 23개 레슨 전체를 새 스키마로 저작 완료했고, 앞으로도 이 스키마로 계속 저작할 것이다. 지금 상태로는 실제 배포된 레슨 리더가 참고 사이트와 전혀 다른(빈약한) 화면을 보여주므로, AI 기초교육을 사내에 오픈할 수 없다.

## Scope

- `wiki.metadata`에서 레슨 전용 필드(`courseId`, `order`, `chapter`, `estimatedMinutes`, `learningObjectives`, `lastReviewedAt`)를 새 평탄화 스키마 그대로 읽도록 파싱 로직을 갱신한다. **다른 docType(guide/page/faq 등)의 `wiki.metadata` 스키마는 그대로 둔다** — lesson docType에 대해서만 이 새 필드를 읽는다.
- Confluence에서 `wiki.metadata`와 `lesson.presentation` 두 Content Property를 모두 가져오도록 fetch 로직을 확장한다(레슨 문서에 한해 property 조회 1회 추가).
- `lesson.presentation` JSON(`schemaVersion`, `lessonId`, `theme`, `scenes[]`, 각 Scene의 `sceneId`/`anchor`/`type`/`layout`/`motion`/`reveal`/`narration`/`blocks[]`/`interaction`/`completionEvidence`/`transitionToNext`)을 파싱해 우리 내부 Scene 모델로 매핑하는 새 컴파일러를 만든다.
  - `blocks[].kind`(`hook`/`explanation`/`example`/`visual` — 실제 저작 데이터에서 관찰된 값. 스키마가 향후 새 kind를 추가할 수 있으므로, 인식하지 못하는 kind는 크래시 없이 안전하게 무시하거나 대체 텍스트로 표시한다)를 화면 블록으로 렌더링한다.
  - `visual` 블록의 `html`/`css`는 기존 `CustomHtmlDiagramBlock`(sandbox iframe, `allow-scripts` 없음)을 확장해 안전하게 렌더링한다(지금은 `html`만 받고 있고 `css`는 못 받음 — 이 부분 확장 필요).
  - `interaction`(`kind: "step-reveal"|"highlight"|"stagger"`, `steps: string[]`)을 기존 Reveal 상태 기계(Task #25에서 만든 `reveal: "manual"` 메커니즘)에 연결해, 저작자가 정의한 단계 수만큼 "다음"으로 순차 공개되게 한다.
  - `narration`을 기존 "대본 보기" 토글 UI에 연결한다(지금처럼 `scriptHtml`로 다루되, 소스가 `bodyHtml`의 나레이션 blockquote가 아니라 이 JSON 필드로 바뀐다).
  - `transitionToNext`를 Scene 하단의 새 배너 UI로 노출한다(참고 사이트의 빨간 테두리 문구 박스와 유사하게).
  - `completionEvidence`는 학습자 화면에는 노출하지 않는다(저작/QA용 메타데이터로 취급 — 콘텐츠 검증 스크립트나 진단 패널에서만 참고용으로 노출 가능).
- `listLessonDocumentsFrom`(코스 정렬)을 새 평탄화 `courseId`/`order` 필드 기준으로 재작성한다. `next` 체인 폴백은 완전히 제거한다(아래 Out Of Scope 참고).
- `chapter` 필드를 활용해 코스 개요(`courseOutline.ts`/`LessonOutlineDrawer`)에 챕터 그룹 헤더를 추가한다(레슨을 챕터별로 묶어 보여줌 — Index 페이지의 "AI 이해의 시작"/"도구와 모델 선택" 같은 6개 챕터 구조를 반영).
- 관련 타입(`RawConfluencePage["metadata"]`, `LessonPresentationMetadata`, `SceneVisual` 등)과 `docs/prd/confluence-metadata.md` 문서를 새 스키마에 맞게 갱신한다.
- 스냅샷 픽스처(`confluenceSnapshots.ts`)를 새 스키마 예시로 갱신해, 원격 Confluence 연결 없이도 새 파이프라인을 개발/검증할 수 있게 한다.

## Out Of Scope

- **기존 H2 헤딩 기반 `bodyHtml` 파서(`lessonScenes.ts`의 `splitLessonContentIntoScenes`) 경로는 완전히 제거한다** — 사용자 확인: 실제 레슨 23개 전부가 새 스키마를 쓰고 있어 레거시 폴백이 불필요. 레거시 전용 테스트/타입도 함께 제거.
- `wiki.metadata.next`/`related`/중첩 `course` 필드 자체는 **guide/page 등 다른 docType에서는 그대로 유지**한다(이번 스코프는 lesson docType 한정).
- Confluence 저작 UI, `course-map-agent`/`storyboard-writer-agent`(콘텐츠 생성 에이전트) 자체의 동작은 다루지 않는다 — 이미 만들어진 데이터를 읽는 쪽만 다룬다.
- 참고 사이트의 랜딩 페이지(히어로 일러스트, "01-22 교육" 배지 등)를 그대로 복제하지 않는다 — Scene 내부 콘텐츠 렌더링 정확도에 집중한다. 랜딩/홈 화면 스타일은 별도 요청 시 후속 스코프.
- `theme`(예: `"ai-foundation"`) 필드의 활용(테마별 배색 등)은 이번 스코프에서 다루지 않는다 — 파싱은 하되 렌더링에는 아직 반영하지 않는다.

## User Or Operator Scenarios

1. 학습자가 `/lesson`에 진입하면, 23개 레슨이 `courseId`+`order` 기준으로 올바른 순서로 코스 개요에 나타나고, `chapter` 기준으로 그룹핑되어 보인다.
2. 학습자가 레슨을 열면, `lesson.presentation`의 Scene이 렌더링된다 — hook 문구가 큰 제목으로, explanation/example이 본문으로, visual 블록의 커스텀 HTML+CSS 다이어그램이 시각 자료로 나타난다.
3. Scene에 `motion`/`interaction`이 있으면, Scene 진입 시 `steps`가 설명하는 순서대로 시각 요소가 순차 등장하는 진입 애니메이션이 재생된다(참고 사이트 실측 확인 — "다음" 버튼은 이 애니메이션과 무관하게 항상 곧바로 다음 Scene으로 이동하며, 애니메이션 재생을 기다리거나 여러 번 클릭할 필요가 없다).
4. Scene 하단에 `transitionToNext` 문구가 강조 배너로 보인다.
5. "대본 보기"를 누르면 `narration` 텍스트가 나타난다.

## Acceptance Criteria

- AC1: 실 Confluence 데이터(dev 서버 remote 모드)로 23개 레슨이 `/lesson` 코스 개요에 `courseId`+`order` 순서대로, `chapter`별로 그룹핑되어 노출된다.
- AC2: 레슨 리더가 `lesson.presentation`의 `blocks[]`를 렌더링하며, `visual` 블록의 `html`+`css`가 참고 사이트와 시각적으로 유사하게(레이아웃/구조 기준) 나타난다.
- AC3: `motion`/`interaction.steps`가 있는 Scene은 진입 시 순차 등장(stagger/fade) 애니메이션이 재생되지만, "다음" 클릭은 애니메이션과 무관하게 즉시 다음 Scene으로 이동한다(참고 사이트 실측 확인: 클릭 한 번으로 진입한 Scene이 이미 모든 요소를 보여준 상태였음 — 클릭 게이팅 없음).
- AC4: `transitionToNext`가 Scene마다 하단에 노출된다.
- AC5: guide/page 등 다른 docType 문서의 기존 동작(검색, `/guides` 노출, `next` 체인 등)에 회귀가 없다.
- AC6: 레거시 H2 파서 제거 후에도 `pnpm typecheck`/`pnpm test` 전체 통과.
- AC7: 알려지지 않은 `blocks[].kind`나 `interaction.kind` 값이 들어와도 크래시 없이 안전하게 처리된다(무시 또는 대체 텍스트).

## Edge Cases

- `lesson.presentation` Content Property가 아직 없는 레슨(향후 저작 중인 문서 등) — 이 레슨은 코스 개요/리더에서 제외하거나, "콘텐츠 준비 중" 상태로 표시한다(정확한 처리 방식은 Clarifications에서 결정).
- `scenes` 배열이 1개보다 많은 레슨(현재는 전부 1개지만 스키마는 여러 개를 허용) — 여러 Scene을 순서대로(배열 순서, 혹은 `order` 필드가 있다면 그 기준) 렌더링해야 한다.
- `visual` 블록이 없는 Scene(관찰된 데이터에는 항상 있었지만, 스키마상 optional일 수 있음) — 시각 자료 없이 텍스트만 렌더링.
- `prerequisites` 필드의 타입이 문서마다 다름(문자열 배열도 있고 숫자 배열도 있음, 실측 확인됨) — 파싱 시 문자열로 정규화.

## Assumptions

- `lesson.presentation`의 `scenes[].type`/`layout`은 우리 기존 `SceneType`/`SceneLayout` enum 값과 호환된다(실측 23개 전부 기존 enum 값 안에 있음: type={comparison, concept, example, closing}, layout={side-by-side, visual-split, grid, focus}).
- `motion`/`interaction.kind` 값(`step-reveal`, `stagger`, `fade`, `highlight`)은 기존 Motion Preset(Task #25/Slice 3)과 대부분 겹치며, `highlight`는 신규로 추가 매핑이 필요하다.
- 콘텐츠 에이전트는 앞으로도 이 스키마(`schemaVersion: 1`)를 계속 사용한다 — 스키마 버전이 바뀌면 별도 마이그레이션 태스크로 처리한다(이번 스코프는 `schemaVersion: 1`만 지원).
- `bodyHtml`은 Confluence 편집기 안에서 사람이 읽기 위한 미러 텍스트일 뿐, 우리 앱은 레슨 docType에 대해 더 이상 `bodyHtml`을 파싱하지 않는다.

## Clarifications

- Q: `lesson.presentation`이 아직 없는 레슨은 어떻게 처리할까?
  - A: (기본 결정, plan.md 검토 시 확정) 기존 "`wiki.metadata` 없는 문서는 전체 제외" 선례(`missing_metadata`)와 동일하게, `lesson.presentation`이 없는 레슨 docType 문서도 코스 개요/리더에서 제외한다. 크래시하지 않고 조용히 걸러내되, 콘솔 진단(`lesson_load_failure` 류 관측성 이벤트)으로 남긴다.
- Q: `chapter` 그룹핑을 이번 스코프에 포함할지?
  - A: 포함(Scope에 명시). 그룹 UI 세부 디자인은 plan.md에서 제안.
