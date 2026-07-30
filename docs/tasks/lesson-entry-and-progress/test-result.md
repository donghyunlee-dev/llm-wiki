# Test Result

## 실행한 명령과 결과

- `pnpm -r typecheck` — PASS (edge-sidebar, mcp-server, wiki-core, web, serverless 5개 패키지 모두 통과)
- `pnpm -r test` — PASS
  - `packages/wiki-core`: 16 files / 192 tests
  - `apps/web`: 18 files / 86 tests
  - `apps/mcp-server`: 4 files / 42 tests
  - `apps/edge-sidebar`: 2 files / 23 tests
  - `packages/serverless`: 4 files / 21 tests
- `pnpm --filter @sfood/web build` — PASS (`vite build` 성공, 94 modules transformed)

## Playwright 실사용 검증 (실제 브라우저, `pnpm dev` 기동 후 확인)

- 홈 화면(라이트): 하단에 "AI, 이제 기초부터 이해해 보세요" 진입 카드가 추천 가이드 카드와 동일한 톤(테두리/배경 톤 구분, 하드코딩 색상 없음)으로 노출됨을 확인. 클릭 시 `/lesson`으로 정상 이동.
- `/lesson` 인덱스: 레슨 목록이 `next` 체인 순서대로("AI를 이해하는 첫 번째 관점" → "컨텍스트와 기억의 한계") 노출, 진도 없을 때 "학습 시작하기", 있을 때 "이어서 학습하기" 버튼 전환 확인.
- `/lesson/:slug` 리더: 방향키(→/←)와 버튼으로 장면 전환, "대본 보기/숨기기" 토글, 마지막 장면에서 "레슨 완료" 클릭 시 다음 레슨으로 자동 이동 및 `localStorage` 진도 기록(완료 레슨 목록·마지막 위치) 확인.
- 라이트/다크 테마 및 데스크톱(1280×900)/모바일(390×844) 뷰포트에서 가로 스크롤 없이 정상 렌더링 확인.
- 검색·`/guides`·`/faq`·`/library`·홈 추천 가이드 어디에도 레슨 문서("AI를 이해하는 첫 번째 관점", "컨텍스트와 기억의 한계")가 노출되지 않음을 실제 화면에서 확인 — `/guides` 목록은 기존 가이드 2건만 표시.
- **발견 및 수정한 문제 1(실사용 검증 중 발견)**: 레슨 완료 후 다음 레슨으로 자동 이동할 때, React Router가 동일 라우트(`/lesson/:slug`) 컴포넌트를 리마운트하지 않아 장면 인덱스가 초기화되지 않고 이전 레슨의 마지막 장면 인덱스를 그대로 유지 → `/lesson`의 "이어서 학습하기"가 새 레슨의 마지막 장면으로 잘못 연결되는 버그 재현. `slug` 변경 시 장면 인덱스를 재계산하는 effect를 추가해 수정하고 재검증 완료(수정 후 정상적으로 "1 / 2"로 초기화됨을 스크린샷으로 재확인).
- **발견 및 수정한 문제 2(실사용 검증 중 발견)**: 리더 화면이 `min-h-[calc(100vh-64px)]` + `justify-between`으로 인해 짧은 장면 콘텐츠와 하단 버튼 사이에 화면 대부분을 차지하는 빈 공간이 발생 — 화면 구성이 어색함. 콘텐츠와 컨트롤을 하나의 블록으로 수직 중앙 정렬하도록 CSS 수정 후 재확인, 라이트·다크 모두 자연스러운 배치로 개선됨을 확인.

## Codex 크리티컬 리뷰(6c)

전체 diff(`main...HEAD`)를 Codex에 전달해 리뷰를 받았으며, 5건이 발견되었다.

| # | 내용 | 처리 |
|---|---|---|
| 1 | `wikiDataSource.ts`의 `isAllowedRemotePage`가 `lesson`을 허용 목록에서 누락 — 실제 Confluence(`remote` 모드) 연동 시 레슨 문서가 전부 유실됨 | **수정**: 허용 목록에 `lesson` 추가, 관련 테스트 갱신 |
| 2 | `LessonReaderPage`의 `[slug]`-only reset이 비동기 문서 로딩 레이스에 취약 — 문서 로딩 완료 전에 `?scene=` 딥링크로 진입하면 이후 파라미터가 무시될 수 있음 | **수정**: effect 의존성 배열에 `scenes.length` 추가, 회귀 테스트 추가 |
| 3 | `clampSceneIndex`가 정수가 아닌 값(`?scene=0.5` 등)을 정수로 강제하지 않아 `scenes[sceneIndex]`가 `undefined`가 되는 크래시 가능성 | **수정**: `Number.isFinite` + `Math.trunc` 가드 추가, 테스트 추가 |
| 4 | `lessonProgress.ts`의 `loadLessonProgress`가 `lastSceneIndex`의 정수/음수 여부, `completedLessonSlugs` 원소 타입을 검증하지 않음 | **수정**: `Number.isInteger` + 음수 거부 + 배열 원소 타입 검증 추가, 테스트 추가 |
| 5 | `lessonScenes.ts`의 정규식 기반 장면 분리가, Expand 매크로 내부에 `<h2>`가 포함될 경우 이를 장면 경계로 잘못 인식할 수 있음(매크로 제거보다 H2 탐색이 먼저 실행됨) | **미수정, 알려진 한계로 문서화**(아래 "남은 갭" 참고) — 현재 픽스처는 이 패턴을 사용하지 않고, 후속 ADF Compiler 도입 시 근본적으로 재설계될 영역이라 이번 스코프에서는 정규식 기반 파서의 구조적 한계로 남겨둠 |

수정된 4건은 재검증(`pnpm -r typecheck`/`pnpm -r test` 재실행, 전부 통과) 완료.

## 스킵한 검증

- Confluence 실제 콘텐츠 연동(`remote` 모드) 라이브 스모크 테스트는 수행하지 않음 — 이번 스코프는 `snapshot` 픽스처 개발로 한정(스펙에 명시된 범위, 실제 Confluence Lesson 페이지 부재). Codex가 발견한 remote 허용 목록 누락은 코드 레벨에서 수정했으나, 실제 Confluence 응답으로 재현 검증하지는 못함 — 후속 세션에서 실 연동 시 확인 필요.
- 접근성 자동 검사 도구(axe 등) 실행은 하지 않음 — 수동 키보드 내비게이션(방향키) 확인만 수행. 스크린리더 검증은 이번 스코프 범위 밖.
