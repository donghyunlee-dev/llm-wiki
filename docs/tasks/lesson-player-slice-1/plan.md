# lesson-player-slice-1 Plan

## Summary

`spec.md`의 6개 스코프 항목을 다음 순서로 구현한다: (1) 도메인 모델/컴파일러 → (2) 메타데이터 확장 → (3) 순서 결정 폴백 → (4) Scene 컴포넌트 → (5) Player 입력(휠) → (6) 진도 저장 키 전환. 기존 `confluenceCleanHtml.ts`/`lessonScenes.ts`/`lessonDocuments.ts`/`lessonProgress.ts`의 패턴을 재사용하고, 완전히 새로운 계층(별도 Backend API, DOMParser 기반 렌더러)은 도입하지 않는다.

**설계서 대비 의도적 축소(사용자 확인 필요):**

- 설계서는 `lesson.course`/`lesson.presentation`을 별도 Content Property 키로 제안하지만, 실제 클라이언트(`confluenceClient.ts`)는 페이지당 `wiki.metadata` 프로퍼티 **하나만** 조회한다. 별도 키를 추가하면 레슨 페이지마다 API 호출이 2~3배로 늘어난다. 대신 두 정보를 기존 `wiki.metadata`의 선택적 하위 필드(`course`, `presentation`)로 접어 넣어 API 호출 횟수를 유지한다.
- 별도 "Course Index" Confluence 페이지 개념도 만들지 않는다. `courseId`+`order`를 레슨 페이지 자신의 `wiki.metadata`에 직접 기록하는 방식으로 대체한다.
- 두 방식 모두 하위 호환(필드 없으면 기존 `next` 체인 폴백)이라 실제 콘텐츠에 대한 회귀는 없다.

## Impacted Modules

- `packages/wiki-core/src/lib/wikiDocuments.ts` — `WikiDocument.metadata` 타입 확장
- `packages/wiki-core/src/lib/confluenceReadModel.ts` — `RawConfluencePage.metadata` 타입 확장, `normalizeConfluencePage` 통과
- `packages/wiki-core/src/lib/confluenceClient.ts` — `readMetadataValue`에 `course`/`presentation` 파싱·검증 추가
- `packages/wiki-core/src/lib/confluenceSnapshots.ts` — 검증용 5-Scene 레슨 fixture 추가
- `packages/wiki-core/src/lib/lessonSemanticBlocks.ts` (신규) — `SceneType`/`SceneLayout`/`SemanticBlock` 타입 + Compiler
- `packages/wiki-core/src/lib/lessonScenes.ts` — 컴파일러 연결, `LessonScene`에 `blocks`/`type`/`layout` 추가
- `packages/wiki-core/src/lib/lessonDocuments.ts` — `listLessonDocumentsFrom` 정렬 로직에 `courseId`+`order` 경로 추가
- `packages/wiki-core/src/index.ts` — 신규 모듈 export
- `apps/web/src/ui/pages/lessonScenes/SceneRenderer.tsx` (신규) + 5개 Scene 컴포넌트 + `SemanticBlockRenderer.tsx`
- `apps/web/src/ui/pages/LessonReaderPage.tsx` — 렌더링을 `SceneRenderer`로 교체, 휠 내비게이션 연결
- `apps/web/src/ui/pages/useLessonWheelNavigation.ts` (신규)
- `apps/web/src/data/lessonProgress.ts` — 저장 키 `lastSceneIndex` → `lastSceneId`
- `apps/web/src/styles.css` — Scene Layout 4종 + Semantic Block 8종 스타일 추가

## Architecture Approach

- **경계 유지**: `packages/wiki-core`는 프레임워크 비의존 도메인/파싱 계층으로 유지한다(`lessonSemanticBlocks.ts`는 `confluenceCleanHtml.ts`처럼 DOM 없이 정규식 기반으로 작성 — DOMParser는 브라우저 전용이라 wiki-core에 넣지 않는다).
- **Compiler 파이프라인**: `lessonScenes.ts`의 기존 H2 분리 → Expand/나레이션 블록쿼트 추출(그대로 유지, raw HTML 의존) → 남은 `bodyHtml`을 `lessonSemanticBlocks.ts`의 `compileSceneBlocks()`에 통과시켜 `SemanticBlock[]` 생성. 이 단계에서 코드/콜아웃/링크 매크로 변환과 Mermaid 확장 정리를 함께 수행한다(현재 발견된 렌더링 버그의 근본 수정).
- **Scene Type/Layout 결정**: `wiki.metadata.presentation.scenes[]`를 anchor로 매칭 → 있으면 사용, 없으면 `inferSceneTypeAndLayout(blocks)` 규칙 기반 추론.
- **Player 렌더링**: `LessonReaderPage`는 원본 HTML을 더 이상 직접 주입하지 않고, `scene.type`에 따라 `SceneRenderer`가 5개 컴포넌트 중 하나를 선택 렌더링한다. 각 컴포넌트는 공통 `SemanticBlockRenderer`로 블록 배열을 그린다.
- **순서 결정**: `listLessonDocumentsFrom`은 먼저 레슨들을 `courseId`로 그룹화한다. `courseId`가 없는 레슨(현재 운영 콘텐츠 전부)은 기존 next-체인 로직을 그대로 적용한 "레거시 그룹"으로 처리해 동작을 바꾸지 않는다. `courseId`가 있고 그룹 내 모든 레슨이 고유한 `order` 값을 가지면 `order` 오름차순으로 정렬한다.

## Data And API Impact

- `WikiDocument.metadata`에 선택적 필드 추가: `course?: { courseId: string; order: number }`, `presentation?: { scenes: Array<{ anchor: string; type: SceneType; layout: SceneLayout }> }`. 기존 소비자는 옵셔널 체이닝만 하면 되므로 하위 호환.
- `localStorage` 스키마 변경: `lesson-progress:{courseId}`의 `lastSceneIndex: number` → `lastSceneId: string`. 기존에 저장된 구버전 객체는 새 스키마 검증에서 걸러져 "저장된 진도 없음"으로 취급된다(진도 데이터는 비필수 로컬 캐시이므로 마이그레이션 불필요, 사용자는 처음부터 다시 시작하지만 데이터 손상은 없음).
- Confluence 실 콘텐츠에는 아직 `course`/`presentation` 필드가 없으므로, 실 데이터 검증(Playwright)에서는 "필드 없음 → 폴백 규칙" 경로만 확인 가능하고, "필드 있음" 경로는 스냅샷 fixture로 검증한다.

## Validation Plan

- `pnpm typecheck`, `pnpm test` 전체 통과.
- 신규 단위 테스트: `lessonSemanticBlocks.test.ts`(Mermaid 확장 정리, code/callout/link 변환, unsupported 보존), `lessonDocuments.test.ts`(courseId+order 정렬, 레거시 폴백 회귀), `lessonProgress.test.ts`(sceneId 기반 저장/복구, 구버전 데이터 거부).
- 컴포넌트 테스트: `SceneRenderer`가 5개 Scene Type을 올바르게 분기하는지, 휠 누적 임계치 로직.
- Playwright 실제 브라우저 검증(remote 모드): 실제 Mermaid 포함 레슨 페이지(`/lesson/ai는-무엇을-잘하고-어디서-약할까`)를 열어 매크로 원문 노출이 사라지고 코드 블록으로 보이는지 확인. 스냅샷 모드로 5-Scene fixture 레슨을 열어 5개 Scene Type이 각각 다른 레이아웃으로 보이는지, 방향키·버튼·휠 이동이 모두 동일하게 동작하는지, 새로고침 후 위치 복구를 확인.
- Codex 비판적 리뷰(diff 전체) 실시 후 지적사항 반영.

## Risks

- **범위 산정 오류**: 5개 Scene 컴포넌트 + Compiler + 휠 내비게이션을 한 슬라이스로 묶어 예상보다 커질 수 있다 → `tasks.md`에서 태스크 단위를 작게 쪼개고 태스크별로 typecheck/test를 확인한다.
- **휠 내비게이션 오작동**: 일반 페이지 스크롤과 혼동될 수 있다 → Player 내부에는 세로 스크롤 영역이 없다는 설계 전제를 지키고, Drawer/Reference가 열려 있을 때는 휠 리스너를 비활성화한다.
- **설계서와의 괴리**: Course Manifest/Presentation을 별도 Content Property가 아닌 `wiki.metadata` 하위 필드로 접은 결정이 이후 설계서의 다른 부분(Wiki Backend API, 별도 캐시 계층)과 어긋날 수 있다 → 이후 Slice에서 별도 Property로 분리해야 한다면 마이그레이션은 이번 옵셔널 필드 설계 덕분에 점진적으로 가능하다.
- **진도 저장 스키마 변경**: 기존 사용자의 저장된 `lastSceneIndex` 값이 폐기된다 → 영향은 "마지막 위치 초기화" 수준으로 낮음(Assumptions에 명시).

## Rollback Considerations

- 모든 신규 필드는 옵셔널이며 기존 코드 경로(레거시 next-체인, 원본 HTML 직접 렌더링)를 제거하지 않고 폴백으로 유지하므로, 문제가 생기면 `LessonReaderPage.tsx`의 `SceneRenderer` 호출부만 되돌려 이전 `dangerouslySetInnerHTML` 렌더링으로 즉시 롤백 가능하다.
- `lessonProgress.ts` 스키마 변경은 로컬 스토리지 키 형식 변경만이라 배포 롤백 시 자동으로 이전 형식이 다시 유효해진다(단, 전환 기간의 진도는 유실됨 — 허용된 리스크).
