# lesson-player-slice-1 Test Result

## Commands Run

| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (all 6 workspace packages) |
| `pnpm test` | PASS — 218 tests (`packages/wiki-core`), 110 tests (`apps/web`), 21 tests (`packages/serverless`), 42 tests (`apps/mcp-server`), 23 tests (`apps/edge-sidebar`) |

## New/Updated Automated Tests

- `packages/wiki-core/src/lib/lessonSemanticBlocks.test.ts` (신규, 13 tests): 단락/불릿/번호목록/표/블록쿼트 변환, 질문+목록 → knowledgeCheck 페어링, Mermaid Forge 확장 → unsupported 블록(매크로 메타데이터 텍스트 미노출 검증), 단독 code 매크로 → unsupported 블록, `inferSceneTypeAndLayout` 5개 분기.
- `packages/wiki-core/src/lib/lessonScenes.test.ts` (2 tests 추가): `blocks`/`type`/`layout` 컴파일 결과, `presentation` 명시값이 추론값보다 우선 적용됨.
- `packages/wiki-core/src/lib/lessonDocuments.test.ts` (2 tests 추가): `courseId`+`order` 정렬이 레거시 `next`-체인 그룹보다 앞에 오는지, `courseId` 없는 레슨 세트가 기존과 동일하게 정렬되는지(회귀 확인).
- `apps/web/src/data/lessonProgress.test.ts` (스키마 전환 반영): `lastSceneId` 기반 저장/복구, 레거시 `lastSceneIndex` 스키마 거부.
- `apps/web/src/ui/pages/lessonScenes/SceneRenderer.test.tsx` (신규, 3 tests): type→컴포넌트/레이아웃 클래스 분기.
- `apps/web/src/ui/pages/useLessonWheelNavigation.test.ts` (신규, 5 tests): 임계치 미만 무시, 임계치 도달 시 1회 이동, 역방향 이동, 잠금 구간 재입력 무시, disabled 시 미동작.
- `apps/web/src/ui/pages/LessonReaderPage.test.tsx` — 시그니처 변경(`splitLessonContentIntoScenes(html, documents, presentation)`)에 맞춰 기존 11개 테스트 유지, 전부 통과(회귀 없음).
- `apps/web/src/ui/pages/LessonIndexPage.test.tsx` — 저장 진도 스키마를 `lastSceneId` 기준으로 갱신, 4개 테스트 통과.

## Playwright Review (remote 모드, 실제 Confluence 데이터)

- 대상: `http://localhost:5188/lesson/ai는-무엇을-잘하고-어디서-약할까` (Mermaid Forge 다이어그램 매크로가 포함된 실제 운영 레슨)
- **수정 전 증상**: `ac:adf-extension`의 확장 ID, "Mermaid diagram", "PRODUCTION" 같은 매크로 메타데이터 원문과 원본 mermaid 문법이 그대로 화면에 노출됨.
- **수정 후 확인**: 해당 장면(3/5)에서 매크로 메타데이터 노출 없이 "이 장면에는 다이어그램이 있지만 아직 화면 미리보기를 지원하지 않습니다." 안내 카드로 대체됨. (AC3 충족)
- 라이트/다크 테마 모두 확인 — 안내 카드와 본문 텍스트 대비가 양쪽 테마에서 정상.
- 같은 레슨의 나머지 장면(1, 4번째)에서 블록쿼트 훅 문장, 일반 단락이 기존과 동일하게 정상 렌더링됨(회귀 없음).
- `/lesson` 인덱스 페이지 확인 — 여전히 "1개 레슨"만 노출(기존에 문서화된 별도 이슈: 운영 콘텐츠 18개 레슨 전부 `courseId`/`next` 미설정. 이번 Slice는 정렬 메커니즘만 제공하며, 콘텐츠팀이 `wiki.metadata.course`를 채우기 전까지는 동일하게 유지됨 — spec.md Clarifications에 문서화된 대로).
- 키보드(←/→)·버튼 이동, "대본 보기" 토글, "학습 흐름" 드로워 열기/장면 이동 모두 정상 동작 확인.
- Codex 리뷰 반영 후 재확인: `?scene=2`로 직접 진입 시 딥링크가 로드 전에 덮어써지지 않고 정확히 3/5 장면(다이어그램 unsupported 카드)이 표시됨. "다음" 클릭 시 URL이 `?scene=1`로 갱신되고, 그 URL로 재진입(새로고침 시뮬레이션)해도 동일한 장면이 복구됨(AC7 최종 확인).

## Codex 비판적 리뷰

`slice1-full.diff` 전체를 Codex(`gpt-5.2-codex`, read-only sandbox)에 전달해 비판적 리뷰를 받았다. 발견된 6건 전부 확인 후 수정했다.

| # | 지적 사항 | 조치 |
|---|---|---|
| 1 | `splitCleanHtmlIntoBlocks`가 인식하지 못하는 태그(예: `iframe`)를 조용히 삭제함 — "미지원 요소는 삭제하지 않는다" 계약 위반 | 알려진 태그 외의 최상위 요소를 잡아내는 catch-all 패턴을 추가해 `unsupported` 블록으로 보존(`br`/`hr`만 예외로 무시) |
| 2 | Mermaid 확장 감지 정규식이 속성 없는 `<ac:adf-extension>`만 매칭 — 실제 매크로는 속성을 가질 수 있음 | `<ac:adf-extension\b[^>]*>`로 완화 |
| 3 | H2의 `id` 속성이 첫 번째 속성이 아니면 유실되어 `scene-N` 폴백으로 대체됨 — `presentation.scenes[].anchor`/`lastSceneId` 계약을 깨뜨림 | H2 전체 속성 문자열에서 `id`를 위치 무관하게 추출하도록 정규식 수정 |
4 | `courseId`+`order`를 일부 레슨에만 부분 적용하면 기존 `next` 체인이 끊기며 순서가 예기치 않게 바뀜(예: A→B `next` 체인 중 B만 courseId가 붙으면 [B, A]로 뒤집힘) | course-태그 그룹과 레거시 그룹 사이에 `next` 참조 교차가 있으면 전체를 레거시 체인 방식으로만 처리하는 가드 추가 |
| 5 | Knowledge Check 선택 상태가 배열 인덱스 키로 인해 다음 장면으로 새어나감 | `SceneRenderer`에 `key={`${slug}:${scene.id}`}`를 지정해 장면마다 완전히 새로 마운트되도록 수정 |
| 6 | 같은 레슨 내에서 다음/이전으로 이동해도 URL의 `?scene=`이 갱신되지 않아 새로고침 시 옛 위치로 돌아감(AC7 미충족) | `sceneIndex` 변경 시 `setSearchParams(..., { replace: true })`로 URL을 동기화. 단, 레슨 로드 전(`scenes.length === 0`)에는 건드리지 않도록 가드해 딥링크 `?scene=` 값이 로드 완료 전에 덮어써지는 회귀를 방지(Playwright로 직접 재확인) |

각 항목에 대응하는 회귀 테스트를 추가했다: `lessonSemanticBlocks.test.ts`(신규 unsupported/mermaid 속성 케이스), `lessonScenes.test.ts`(id 속성 위치), `lessonDocuments.test.ts`(교차 참조 폴백), `LessonReaderPage.test.tsx`(Knowledge Check 상태 격리, URL 동기화).

수정 후 `pnpm typecheck`/`pnpm test` 재실행 — 전부 통과(wiki-core 220 tests, apps/web 112 tests).

## Skipped Checks

- `docs/prd/lesson-player-design.md`가 정의한 스냅샷 전용 5-Scene fixture(`context-and-memory`, `presentation` 명시 경로)는 브라우저에서 직접 확인하지 못함 — 현재 dev 서버가 `.env.local` 자격 증명으로 remote 모드로 고정되어 있어 snapshot 모드 전환에는 별도 워크트리(자격 증명 미보유)가 필요함. 대신 동일 로직을 `lessonScenes.test.ts`/`lessonSemanticBlocks.test.ts` 단위 테스트로 커버함.
- 모바일 뷰포트/터치 스와이프는 이번 Slice의 Out of Scope(spec.md 참고)이므로 검증하지 않음.
- Knowledge Check의 정답/오답 판정은 콘텐츠에 정답 표시 규약이 없어 이번 Slice에서 구현하지 않음(선택 기록만 제공) — result.md에 알려진 한계로 기록.
