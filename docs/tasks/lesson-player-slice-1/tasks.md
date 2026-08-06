# lesson-player-slice-1 Tasks

## Implementation Tasks

1. `wikiDocuments.ts` / `confluenceReadModel.ts` / `confluenceClient.ts`: `metadata.course`/`metadata.presentation` 선택적 필드 추가 및 파싱·검증(잘못된 enum은 무시하고 폴백).
2. `lessonSemanticBlocks.ts`(신규): `SceneType`, `SceneLayout`, `SemanticBlock` 타입 + `compileSceneBlocks(bodyHtml)` — 코드/콜아웃/링크 매크로 변환, Mermaid Forge 확장 정리, 미지원 요소는 `unsupported` 블록으로 보존.
3. `lessonSemanticBlocks.ts`: `inferSceneTypeAndLayout(blocks)` 규칙 기반 추론 함수.
4. `lessonScenes.ts`: `compileSceneBlocks`/`inferSceneTypeAndLayout` 연결, `LessonScene`에 `blocks`/`type`/`layout` 필드 추가(scene별 `presentation.scenes[]` 매칭 우선).
5. `lessonDocuments.ts`: `listLessonDocumentsFrom`에 `courseId`+`order` 그룹 정렬 경로 추가(courseId 없는 레슨은 기존 next-체인 로직 그대로 유지).
6. `confluenceSnapshots.ts`: "컨텍스트와 기억의 한계" 5-Scene fixture 추가(Hook/Mental-model/Process/Comparison/Knowledge-check, `presentation` 필드 포함, Mermaid 유사 코드 블록 포함).
7. `packages/wiki-core/src/index.ts`: 신규 타입/함수 export.
8. `apps/web/src/ui/pages/lessonScenes/SemanticBlockRenderer.tsx`(신규): 8종 블록 렌더링 공통 컴포넌트.
9. `apps/web/src/ui/pages/lessonScenes/{Hook,MentalModel,Process,Comparison,KnowledgeCheck}Scene.tsx`(신규) + `SceneRenderer.tsx` 디스패처.
10. `apps/web/src/ui/pages/useLessonWheelNavigation.ts`(신규): 누적 임계치·잠금 로직.
11. `apps/web/src/ui/pages/LessonReaderPage.tsx`: `dangerouslySetInnerHTML` 제거 후 `SceneRenderer` 연결, 휠 내비게이션 연결.
12. `apps/web/src/data/lessonProgress.ts`: `lastSceneIndex` → `lastSceneId` 전환, `LessonReaderPage`의 진도 저장/복구 호출부 갱신.
13. `apps/web/src/styles.css`: Scene Layout 4종 + Semantic Block 8종 스타일 추가(SFOOD 토큰 기준).

## Test Tasks

- `lessonSemanticBlocks.test.ts`: Mermaid 확장 정리, 코드/콜아웃/링크 변환, unsupported 보존, 추론 규칙 케이스별 검증.
- `lessonDocuments.test.ts`: courseId+order 정렬, courseId 없는 레거시 그룹 폴백 회귀.
- `lessonProgress.test.ts`: sceneId 기반 저장/복구, 구버전 스키마 거부.
- `SceneRenderer`/각 Scene 컴포넌트 렌더링 테스트.
- `useLessonWheelNavigation` 임계치·잠금 단위 테스트.
- `LessonReaderPage` 통합 테스트 갱신(기존 dangerouslySetInnerHTML 가정 테스트를 blocks 기반으로 수정).

## Documentation Tasks

- `docs/tasks/lesson-player-slice-1/test-result.md` 작성.
- `docs/tasks/lesson-player-slice-1/result.md` 작성.
- `docs/prd/implementation-status.md` 갱신.
- `docs/prd/confluence-metadata.md`에 `wiki.metadata.course`/`presentation` 신규 필드 반영.

## Progress Notes
- 구현 태스크 1~13 전부 완료. `pnpm typecheck`/`pnpm test` 통과(wiki-core 220, apps/web 112, 나머지 워크스페이스 회귀 없음).
- 실 콘텐츠(Mermaid 포함 레슨) Playwright 검증 완료 — 매크로 메타데이터 노출 버그 해소 확인, 라이트/다크 테마 모두 확인.

## Review Notes
- Codex 비판적 리뷰에서 6건 발견 — 전부 수정 및 회귀 테스트 반영(상세 내용은 `test-result.md`, `result.md` 참고): unsupported 콘텐츠 조용한 삭제, Mermaid 확장 속성 미매칭, H2 id 속성 위치 의존성, courseId 부분 적용 시 순서 역전, Knowledge Check 상태 누수, URL scene 파라미터 미동기화(+ 동기화 가드 관련 자체 발견 회귀 수정).
