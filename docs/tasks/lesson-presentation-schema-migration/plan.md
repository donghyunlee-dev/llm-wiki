# lesson-presentation-schema-migration Plan

## Summary

레슨 콘텐츠 읽기 경로를 완전히 새로 만든다. `wiki.metadata`는 lesson docType에 대해 평탄화된 새 필드(`courseId`/`order`/`chapter`/`estimatedMinutes`/`learningObjectives`/`lastReviewedAt`)를 읽도록 바꾸고, 별도 Content Property `lesson.presentation`을 새로 fetch해 그 JSON(`schemaVersion`/`lessonId`/`theme`/`scenes[]`)을 우리 내부 Scene 모델로 매핑하는 신규 컴파일러를 만든다. 기존 H2 헤딩 기반 `bodyHtml` 파서(`lessonScenes.ts`)는 완전히 제거한다(사용자 확인). guide/page 등 다른 docType의 `wiki.metadata` 스키마와 `next` 기반 흐름은 손대지 않는다.

## Impacted Modules

- `packages/wiki-core/src/lib/confluenceClient.ts` — property fetch(신규: `lesson.presentation` 조회), `readMetadataValue`(신규 평탄화 필드), `readPresentation`/`readCourse`/`readSceneVisual`/`readHotspotsVisual` 제거·교체.
- `packages/wiki-core/src/lib/confluenceReadModel.ts` — `RawConfluencePage` 타입(`metadata`의 course 필드 평탄화, `presentation`을 metadata 밖의 최상위 필드로 이동), `normalizeConfluencePage`.
- `packages/wiki-core/src/lib/wikiDocuments.ts` — `WikiDocument.metadata`의 `course`→평탄화 필드, `LessonPresentationMetadata` 타입을 새 스키마로 교체.
- `packages/wiki-core/src/lib/lessonSemanticBlocks.ts` — `SceneType`/`SceneLayout`은 유지(실측 값이 기존 enum 안에 있음 확인됨), `SceneVisual`/Hotspot 관련 legacy 매핑 정리, 새 블록 컴파일러 진입점 추가.
- `packages/wiki-core/src/lib/lessonScenes.ts` — **삭제**(H2 파서). 대체: 신규 `packages/wiki-core/src/lib/lessonPresentation.ts` — `LessonPresentationDocument` → `Scene[]` 매핑 컴파일러.
- `packages/wiki-core/src/lib/lessonDocuments.ts` — `listLessonDocumentsFrom`을 평탄화 `courseId`+`order` 기준 정렬로 재작성(`next` 체인 폴백 제거).
- `packages/wiki-core/src/lib/courseOutline.ts` — `chapter` 그룹 헤더 추가.
- `apps/web/src/ui/pages/LessonReaderPage.tsx` — Scene 렌더링을 새 블록 모델(`hook`/`explanation`/`example`/`visual`)에 맞게 교체, `interaction.steps` 기반 Reveal, `transitionToNext` 배너, `narration`→대본 토글 연결.
- `apps/web/src/ui/pages/lessonScenes/*` — `SceneRenderer`/각 Scene 컴포넌트가 새 블록 모델을 소비하도록 조정. `CustomHtmlDiagramBlock.tsx`에 `css` prop 추가(sandboxed iframe의 `<style>`로 주입).
- `apps/web/src/ui/pages/LessonOutlineDrawer.tsx`/`courseOutline.ts` — 챕터 그룹 표시.
- `packages/wiki-core/src/lib/confluenceSnapshots.ts` — 레슨 픽스처를 새 스키마 예시로 교체.
- `docs/prd/confluence-metadata.md` — 새 스키마 문서화(`wiki.metadata`의 lesson 전용 평탄화 필드 + `lesson.presentation` 전체 스펙).
- 제거 대상 테스트: `lessonScenes.test.ts` 전체(H2 파서 전용). 신규 테스트: `lessonPresentation.test.ts`, `confluenceClient.test.ts`(lesson.presentation fetch), `lessonDocuments.test.ts`(courseId/order 정렬).

## Architecture Approach

- **레이어 분리 유지**: Confluence REST 세부사항(`confluenceClient.ts`) → 정규화된 도메인 모델(`WikiDocument`, `confluenceReadModel.ts`) → Scene 컴파일(`lessonPresentation.ts`) → UI(`LessonReaderPage.tsx`/`SceneRenderer`). 기존 아키텍처 원칙(운영 정보와 트랜스포트 분리) 그대로 따른다.
- **`RawConfluencePage` 확장**: `presentation`을 `metadata` 안이 아니라 최상위 필드로 이동한다(`lesson.presentation`이 별도 Content Property이므로, 우리 내부 모델도 별도 필드로 표현하는 것이 실제 데이터 소스와 일치). 예:
  ```ts
  export type RawConfluencePage = {
    // ...existing fields
    metadata: {
      docType: ...;
      audience: ...;
      status: ...;
      prerequisites: string[];
      next: string[];
      related: string[];
      // lesson 전용, 평탄화(다른 docType은 항상 undefined):
      courseId?: string;
      order?: number;
      chapter?: string;
      estimatedMinutes?: number;
      learningObjectives?: string[];
      lastReviewedAt?: string;
    };
    presentation?: LessonPresentationDocument; // metadata 밖, lesson.presentation property 그대로
  };
  ```
- **`LessonPresentationDocument` 신규 타입** (실측 23개 데이터 기준):
  ```ts
  export type LessonPresentationDocument = {
    schemaVersion: 1;
    lessonId: string;
    theme: string;
    scenes: LessonPresentationScene[];
  };

  export type LessonPresentationScene = {
    sceneId: string;
    anchor: string;
    type: SceneType;   // 기존 enum 재사용 (실측: concept/example/comparison/closing 전부 기존 값)
    layout: SceneLayout; // 기존 enum 재사용 (실측: visual-split/grid/side-by-side/focus 전부 기존 값)
    motion?: string;    // 실측: step-reveal/stagger/fade/highlight
    reveal?: "manual";
    narration: string;
    blocks: LessonPresentationBlock[];
    interaction?: { kind: string; steps: string[] };
    completionEvidence?: string; // 학습자 화면에는 노출 안 함(진단/QA용)
    transitionToNext?: string;
  };

  export type LessonPresentationBlock =
    | { order: number; kind: "hook" | "explanation" | "example"; content: string }
    | { order: number; kind: "visual"; visualKind?: string; purpose?: string; html: string; css: string }
    | { order: number; kind: string; [key: string]: unknown }; // 알려지지 않은 kind — 안전하게 무시
  ```
  파싱 함수는 `kind`가 알려진 3가지 텍스트 kind나 `"visual"`이 아니면 마지막 유니온 브랜치로 통과시키고, 렌더러 쪽에서 이 경우 아무것도 그리지 않는다(크래시 없이 무시, AC7).
- **`fetchConfluencePageRecords` 흐름 확장**: `wiki.metadata`를 읽어 `docType === "lesson"`으로 판명된 페이지에 대해서만 `lesson.presentation` property를 추가로 1회 조회한다(기존 `fetchPageMetadata`와 동일한 "값이 없으면 detail follow-up" 패턴 재사용). `lesson.presentation`이 없으면 해당 레슨은 통째로 `null` 반환(= 목록에서 제외, spec의 Clarifications 결정과 동일).
- **Scene 컴파일러(`lessonPresentation.ts`)**: `LessonPresentationScene` → 기존 내부 `Scene` 모델(`id`, `title`, `type`, `layout`, `blocks: SemanticBlock[]`, `visual?`, `reveal?`, `scriptHtml?`)로 매핑하는 순수 함수. `bodyHtml` 파싱은 전혀 하지 않는다. 매핑 규칙:
  - `scene.title` ← Confluence 페이지 title(레슨 페이지 자체가 이미 Scene 1개짜리이므로).
  - `blocks: SemanticBlock[]` ← `LessonPresentationBlock[]`을 새 kind(`hook`/`explanation`/`example`/`visual`)로 매핑. `visual` 블록은 새 `SemanticBlock` variant `{ kind: "customHtmlWithCss"; html: string; css: string }`로(기존 `customHtml`은 `css` prop이 없으므로 신규 variant 추가, 또는 기존 `customHtml`에 `css?` optional 필드 추가 — 후자가 더 단순하므로 이 방식으로 결정).
  - `scriptHtml` ← `narration`을 `<p>`로 감싸 기존 "대본 보기" UI와 그대로 호환.
  - `motion`/`interaction` ← **클릭 게이팅이 아니라 Scene 진입 애니메이션이다**(참고 사이트 실측 확인: Scene 진입 즉시 모든 블록이 보이고, "다음"은 애니메이션 완료 여부와 무관하게 곧바로 다음 Scene으로 이동함). 따라서 Task #25의 `reveal: "manual"` 클릭-게이팅 메커니즘은 이 신규 스키마에는 연결하지 않는다 — `motion` 값(`step-reveal`/`stagger`/`fade`는 기존 Motion Preset과 이름이 겹침, `highlight`는 신규)을 Scene mount 시 1회 재생되는 CSS 진입 애니메이션에만 매핑한다. `interaction.steps`는 그 애니메이션이 등장시키는 요소들의 설명 텍스트로, 화면에 직접 노출하지 않고 애니메이션 순서/`aria-label` 등 접근성 보강에만 참고한다.
  - `transitionToNext` ← Scene 객체의 신규 필드로 그대로 보존, `LessonReaderPage.tsx`에서 하단 배너로 렌더링(신규 `.lesson-reader-transition-banner` CSS, 참고 사이트의 빨간 테두리 스타일 참고).
  - `completionEvidence` ← Scene 객체에 보존은 하되 학습자 화면에는 렌더링하지 않음(진단 패널에서만 참고, 선택적).
- **`CustomHtmlDiagramBlock.tsx` 확장**: `css` prop을 추가로 받아 `srcDoc`의 `<style>` 태그에 `html(css)`와 별개로 삽입한다(기존 CSP `style-src 'unsafe-inline'`가 이미 `<style>` 태그도 허용하므로 CSP 변경 불필요, sandbox=`allow-same-origin`만 유지).
- **정렬**: `listLessonDocumentsFrom`을 `courseId`+`order` 오름차순으로 재작성(다른 courseId 그룹핑은 필요 시 courseId별로 나눠 정렬 후 이어붙임 — 지금은 전부 `courseId: "ai-foundation"` 하나뿐이라 단순 정렬로 충분하지만, 여러 코스가 생길 가능성을 감안해 courseId 그룹별 정렬 유지).
- **챕터 그룹**: `courseOutline.ts`의 `buildCourseOutline`에 `chapter` 필드를 레슨에 실어 반환, `LessonOutlineDrawer.tsx`가 같은 `chapter` 값이 연속되면 그룹 헤더를 한 번만 렌더링(참고 사이트의 챕터 구분과 유사, 새 UI지만 최소 추가).

## Data And API Impact

- **Confluence API 호출 증가**: 레슨 문서당 property 조회가 1회(`wiki.metadata`)에서 최대 2회(`wiki.metadata` + `lesson.presentation`)로 증가. lesson docType이 아닌 나머지 ~320개 문서는 영향 없음(`docType` 확인 후에만 추가 조회하므로).
- **`WikiDocument.metadata`의 `course?: LessonCourseMetadata`(중첩) 필드 제거** — 이 필드를 참조하는 코드는 현재 `lessonDocuments.ts`(`listLessonDocumentsFrom`)뿐임을 확인함(grep 필요, 구현 시 재확인).
- **`WikiDocument.metadata.presentation` 제거, `WikiDocument.presentation`(최상위)으로 이동** — 참조처: `LessonReaderPage.tsx`(`useLessonScenes` 계열 훅), `lessonDocuments.ts`. 구현 시 grep으로 전체 참조 재확인.
- **스냅샷 픽스처(`confluenceSnapshots.ts`) 전면 교체**: 기존 레슨 픽스처(H2 헤딩 기반)를 실측 스키마와 동일한 구조의 새 픽스처로 교체. Reference Panel/Screenshot Hotspot/Reveal 등 최근 추가한 데모 Scene들은 이 마이그레이션으로 사라지므로, 각 기능의 유닛 테스트(컴포넌트 레벨)는 영향 없으나 **Playwright로 이미 확인해 둔 통합 데모 경로는 새 픽스처 기준으로 다시 만들어야 함**(별도 언급 없으면 새 픽스처에도 유사한 데모 Scene을 최소 1개씩 남겨 회귀 확인 경로를 유지).

## Validation Plan

1. `pnpm --filter @sfood/wiki-core test`/`typecheck` — 신규 `lessonPresentation.ts`/`confluenceClient.ts`/`lessonDocuments.ts`/`courseOutline.ts` 단위 테스트 전체 통과.
2. `pnpm --filter @sfood/web test`/`typecheck` — `LessonReaderPage`/`SceneRenderer`/`CustomHtmlDiagramBlock` 갱신 테스트 통과.
3. **실 데이터 통합 확인(remote 모드)**: dev 서버를 remote 모드로 띄워 `/api/wiki-pages`로 실제 23개 레슨의 `courseId`/`order`/`chapter`/`presentation`이 올바르게 파싱되는지 직접 확인(이번 조사에서 쓴 방법 재사용).
4. **Playwright 시각 대조**: 실 데이터 기준으로 `/lesson`(코스 개요, 챕터 그룹) + 최소 3개 레슨(visual-split, grid, focus 레이아웃 각 1개)을 열어 참고 사이트(https://sfood-ai-education.leedh84.chatgpt.site/)의 동일 레슨과 나란히 비교 — 텍스트 내용/시각 자료 레이아웃/전환 배너가 구조적으로 일치하는지 확인. 라이트/다크, 데스크톱/모바일.
5. `motion`이 있는 Scene에서 진입 애니메이션이 재생되고, "다음" 클릭이 애니메이션과 무관하게 즉시 다음 Scene으로 이동하는지 최소 1개 레슨에서 확인(클릭 게이팅이 생기지 않았는지 회귀 확인).
6. `pnpm -r test`/`pnpm -r typecheck` 전체 회귀 확인(guide/page 등 다른 docType 영향 없음 확인).
7. Codex 비판 리뷰(6c) — 특히 `lesson.presentation`이 없는 레슨/알려지지 않은 `blocks[].kind`/`prerequisites`의 숫자·문자열 혼용 같은 edge case 처리를 집중 점검.

## Risks

- **콘텐츠 에이전트가 스키마를 계속 바꿀 수 있음** — `schemaVersion: 1`만 지원하도록 명시적으로 체크하고, 버전이 다르면 해당 레슨을 조용히 제외(크래시 방지). 향후 버전 변경 시 별도 마이그레이션 필요.
- **`blocks[].kind`/`interaction.kind`가 실측 4~3개뿐이라 향후 새 kind 등장 시 시각적으로 누락될 수 있음** — AC7로 안전 처리(크래시 없음)는 보장하지만, 새 kind가 추가되면 후속 세션에서 매핑 추가가 필요함을 `docs/prd/confluence-metadata.md`에 명시.
- **API 호출 2배 증가로 대량 레슨(수백 개) 시 로딩 시간 증가 가능** — 지금 23개 규모에서는 무시할 수준. 배치 크기(`METADATA_FETCH_BATCH_SIZE`)는 그대로 유지.
- **레거시 H2 파서 제거로 되돌릴 수 없음** — 사용자가 명시적으로 확인(23개 전부 새 스키마 사용). 만약 향후 구 스키마 콘텐츠가 재등장하면 이 결정을 재검토해야 함(가능성 낮음으로 판단됨).

## Rollback Considerations

- 이 브랜치/커밋 전체를 되돌리면 기존 H2 파서 기반 동작(빈약하지만 동작은 하던 상태)으로 복구된다.
- `confluenceSnapshots.ts` 픽스처 교체는 별도 커밋으로 분리해, 필요 시 스냅샷만 되돌려 개발 모드 확인이 가능하게 한다.
- 실 Confluence 데이터(`wiki.metadata`/`lesson.presentation`)는 이번 작업으로 전혀 수정하지 않음(읽기 전용 마이그레이션) — 콘텐츠 쪽 롤백은 필요 없음.
