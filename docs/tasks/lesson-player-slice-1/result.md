# lesson-player-slice-1 Result

## Delivered Scope

`docs/prd/lesson-player-design.md`("AI 기초교육 Lesson Player 개발 설계 계획서")의 "권장 첫 번째 구현 Slice"를 구현했다.

- **근본 버그 수정**: 레슨 장면이 원본 Confluence storage HTML을 그대로 `dangerouslySetInnerHTML`로 렌더링하던 문제를 제거했다. Confluence 매크로(코드 블록, 콜아웃, Mermaid Forge 다이어그램 확장 등)를 안전하게 정리하는 `Lesson Compiler`(`lessonSemanticBlocks.ts`)를 새로 만들어, 매크로 메타데이터 원문이나 미가공 마크업이 화면에 노출되지 않게 했다. Mermaid/원문 코드 블록은 실제 다이어그램 렌더링 대신 "이 장면에는 다이어그램이 있지만 아직 화면 미리보기를 지원하지 않습니다" 같은 안내형 `unsupported` 블록으로 안전하게 대체된다(설계서의 "지원하지 않는 요소는 삭제하지 않는다" 원칙 준수).
- **Scene 도메인 모델**: 5개 Scene Type(`hook`/`mental-model`/`process`/`comparison`/`knowledge-check`) × 4개 Layout(`focus`/`visual-split`/`horizontal-flow`/`side-by-side`)과 8종 `SemanticBlock`(paragraph/bullets/steps/comparison/callout/image/knowledgeCheck/unsupported)을 도입했다. `wiki.metadata.presentation.scenes[]`에 명시가 있으면 그대로 쓰고, 없으면 규칙 기반으로 추론한다.
- **Course Manifest 스텁**: `wiki.metadata.course`(`courseId`+`order`)가 있는 레슨은 그 값으로 정렬하고, 없는 레슨(현재 운영 콘텐츠 전부)은 기존 `next` 체인 방식을 그대로 유지한다. 두 그룹 사이에 `next` 참조가 걸쳐 있으면(콘텐츠팀이 레슨을 하나씩 순차 태깅하는 전환기에 실제로 벌어질 수 있는 상황) 전체를 레거시 체인 방식으로 안전하게 폴백한다.
- **Player 이동**: 기존 방향키·버튼에 세로 휠 스크롤 이동(`useLessonWheelNavigation`)을 추가했다. 임계치 누적 후 1회만 이동하고, 이동 직후 짧게 재입력을 잠근다.
- **진도 저장 전환**: `localStorage` 진도 키를 `lastSceneIndex`(number)에서 `lastSceneId`(scene anchor 문자열)로 바꿔, 향후 장면이 추가/삭제돼도 위치가 안정적으로 유지되게 했다. 장면 이동 시 URL의 `?scene=` 파라미터도 함께 갱신해 새로고침 후 같은 위치로 복구된다.

## Changed Files

- `packages/wiki-core/src/lib/lessonSemanticBlocks.ts` (신규) — Lesson Compiler: `SceneType`/`SceneLayout`/`SemanticBlock` 타입, `compileSceneBlocks`, `inferSceneTypeAndLayout`
- `packages/wiki-core/src/lib/lessonScenes.ts` — Compiler 연결, `LessonScene`에 `blocks`/`type`/`layout` 추가, H2 `id` 속성 추출 위치 무관화
- `packages/wiki-core/src/lib/lessonDocuments.ts` — `courseId`+`order` 정렬 경로 + 레거시 그룹 교차 참조 가드
- `packages/wiki-core/src/lib/wikiDocuments.ts` / `confluenceReadModel.ts` / `confluenceClient.ts` — `metadata.course`/`metadata.presentation` 선택적 필드 및 파싱·검증
- `packages/wiki-core/src/lib/courseOutline.ts` — 시그니처 변경 반영
- `packages/wiki-core/src/lib/confluenceSnapshots.ts` — 5-Scene fixture(`context-and-memory`) 확장(Hook/Mental-model/Process/Comparison/Knowledge-check, Mermaid 확장 포함)
- `packages/wiki-core/src/index.ts` — 신규 모듈 export
- `apps/web/src/ui/pages/lessonScenes/` (신규) — `SceneRenderer`, 5개 Scene 컴포넌트, `SemanticBlockRenderer`, `SceneShell`
- `apps/web/src/ui/pages/useLessonWheelNavigation.ts` (신규)
- `apps/web/src/ui/pages/LessonReaderPage.tsx` — `SceneRenderer` 연결, 휠 내비게이션, URL `scene` 파라미터 동기화, scene-keyed 리마운트
- `apps/web/src/ui/pages/LessonIndexPage.tsx` — 이어보기 링크를 `lastSceneId` 기준으로 재계산
- `apps/web/src/data/lessonProgress.ts` — `lastSceneId` 스키마 전환
- `apps/web/src/styles.css` — Scene Layout/Semantic Block 스타일 추가
- 대응하는 테스트 파일 전체(신규 3개 + 기존 6개 갱신)

## Key Decisions

- **메타데이터 구조 축소(사용자 승인)**: 설계서는 `lesson.course`/`lesson.presentation`을 별도 Confluence Content Property로 제안했지만, 실제 클라이언트는 페이지당 `wiki.metadata` 하나만 조회한다. 별도 키를 쓰면 레슨마다 API 호출이 2~3배 늘어나므로, 두 정보를 기존 `wiki.metadata`의 선택적 하위 필드로 접어 넣기로 사용자와 합의했다. API 호출 횟수는 그대로 유지되고, 두 필드 모두 없으면 기존 동작과 100% 동일하다.
- **Mermaid/코드 블록을 "안내형 unsupported 블록"으로 처리**: 실제 다이어그램 렌더링(mermaid.js 등)은 이번 Slice의 범위가 아니다. 원문을 그대로 보여주거나 매크로 메타데이터를 노출하는 대신, 설계서의 "지원하지 않는 요소는 삭제하지 않되 안전한 폴백으로 변환한다" 원칙에 따라 짧은 안내 카드로 대체했다.
- **Codex 리뷰 반영**: 정규식 기반 HTML 블록 분리기가 인식하지 못하는 태그를 조용히 삭제하던 문제, Mermaid 확장 태그의 속성 유무 처리, H2 `id` 속성 위치 의존성, courseId 부분 적용 시의 순서 역전, Knowledge Check 선택 상태 누수, URL 동기화 누락을 모두 발견·수정했다(자세한 내용은 `test-result.md`).

## Open Gaps

- **실 콘텐츠에 courseId/order 미적용**: 실제 Confluence의 레슨 18개는 아직 `wiki.metadata.course`가 없어 `/lesson` 인덱스에는 여전히 1개 레슨만 노출된다. 이 Slice는 정렬 메커니즘만 제공하며, 콘텐츠팀이 실제로 `wiki.metadata.course`를 채워야 해결된다.
- **Mermaid 실제 다이어그램 렌더링 미구현**: 현재는 "미리보기 미지원" 안내로 대체할 뿐, 실제 flowchart를 그리지 않는다. 후속 Slice에서 mermaid.js 등을 도입할 수 있다.
- **여러 courseId를 넘나드는 레슨 전환**: `getNextLessonSlugFrom`은 courseId가 다른 레슨들도 하나의 전역 리스트로 이어붙이므로, 과정 A의 마지막 레슨에서 "다음"을 누르면 과정 B의 첫 레슨으로 자연스럽게 넘어간다. 지금은 과정이 하나(`ai-foundation`)뿐이라 문제가 되지 않지만, 여러 과정이 생기면 과정 경계를 명시적으로 처리해야 한다.
- **Knowledge Check 정답 판정 없음**: 콘텐츠에 정답을 표시하는 별도 규약이 없어, 이번 Slice는 선택 기록만 제공하고 정답/오답 피드백은 구현하지 않았다.
- **snapshot 모드 브라우저 실검증 미완료**: dev 서버가 remote 모드로 고정돼 있어, 5-Scene fixture 데이터의 브라우저 렌더링은 단위/컴포넌트 테스트로만 확인했다(coverage는 test-result.md 참고).

## Next Steps

- 콘텐츠팀에 `wiki.metadata.course`(courseId/order) 입력을 요청해 `/lesson` 인덱스에 18개 레슨이 모두 노출되도록 한다.
- 설계서의 다음 구현 단계(나머지 6개 Scene Type, Motion Preset, Interactive 컴포넌트, Wiki Backend API)를 별도 Slice로 브레인스토밍해 진행할지 결정한다.
