# Result

## 배경

Wiki 메인 화면에 AI 기초교육(Lesson) 영역으로 들어가는 진입 경로가 없었다. Confluence에 `docType: "lesson"`이 새로 도입될 예정이라, 홈 진입 UI·docType 격리·계정 없는 환경에서의 학습 진도 저장(이어서 학습하기)·좌우 전환형 리더 화면을 구현했다. 설계 문서: `docs/superpowers/specs/2026-07-30-lesson-entry-and-progress-design.md`. 구현 계획: `docs/superpowers/plans/2026-07-30-lesson-entry-and-progress.md`.

## 전달 범위

- `docType: "lesson"` 스키마 등록(`confluence-metadata.md`, `CLAUDE.md` Frozen 표, `WikiDocument`/`RawConfluencePage` 타입) — 검색·가이드·페이지·라이브러리·홈 추천 가이드 어디에도 노출되지 않음을 회귀 테스트로 증명.
- 레슨 문서 간 학습 순서: 신규 필드 없이 기존 `metadata.next` 체인 재사용(`listLessonDocumentsFrom`/`getLessonDocumentFrom`/`getNextLessonSlugFrom`, `packages/wiki-core`).
- H2 헤딩 기준 장면(Scene) 분리 + Confluence Expand 매크로 → 장면별 숨겨진 "대본"(script) 추출(`splitLessonContentIntoScenes`).
- 홈 하단 진입 카드(레슨 문서가 1개 이상 있을 때만 노출), `/lesson` 목록 페이지("이어서 학습하기"/"학습 시작하기"), `/lesson/:slug` 좌우 전환 리더(키보드 방향키·버튼, 장면별 대본 토글, 마지막 장면 완료 시 다음 레슨 자동 이동).
- `localStorage` 기반 진도 저장(`lesson-progress:{courseId}`) — 완료 레슨 목록, 마지막 레슨/장면 위치.
- Confluence `remote` 모드 문서 로딩 경로에도 `lesson` docType 허용(향후 실 Confluence 연동 시 즉시 사용 가능하도록).

## 주요 결정

- 스코프를 단순화된 좌우 Player로 한정 — ADF 기반 Lesson Compiler, `LessonAst`, `lesson.presentation`/`lesson.course` Content Property, Motion Preset, 마우스 휠/스와이프 탐색, Knowledge Check 등 인터랙티브 컴포넌트는 후속 단계로 명시적으로 제외(사용자 승인 완료).
- 콘텐츠는 아직 실제 Confluence에 없어 `confluenceSnapshots.ts` 픽스처(레슨 2건, 각 2개 장면, Expand 매크로 대본 포함)로 개발.
- 단일 고정 course(`ai-foundation`)만 지원 — 다중 Course 관리(Course Manifest)는 제외.
- 대본 콘텐츠는 콘텐츠 관리팀이 만들지 않고(이번 세션에서 콘텐츠 생성 없음), Confluence Expand 매크로 형식을 파싱·바인딩하는 메커니즘만 구현.

## 검증

`docs/tasks/lesson-entry-and-progress/test-result.md` 참고. `pnpm -r typecheck`/`pnpm -r test`/`pnpm --filter @sfood/web build` 전부 통과. Playwright로 라이트·다크 + 데스크톱(1280)·모바일(390)에서 홈 진입→목록→리더 전체 플로우, 키보드 내비게이션, 대본 토글, 새로고침 후 진도 복구, 검색/가이드/페이지에 레슨 미노출을 직접 확인. Codex 크리티컬 리뷰에서 5건 발견 — 4건(remote 로딩 경로 lesson 누락, 비동기 로딩 레이스, 정수 아닌 scene 인덱스 크래시, 진도 데이터 검증 미흡) 수정 완료, 1건(Expand 매크로 내부 H2 오인식)은 알려진 한계로 남김.

Playwright 실사용 검증 중에도 2건의 실제 문제를 추가로 발견해 수정했다: (1) 레슨 완료 후 다음 레슨 이동 시 장면 인덱스가 초기화되지 않는 버그(React Router가 동일 라우트 컴포넌트를 리마운트하지 않아 발생), (2) 리더 화면의 과도한 빈 공간(레이아웃 어색함).

## 남은 갭 / 후속 과제

- **Expand 매크로 내부 H2 오인식**(Codex 발견, 미수정): `lessonScenes.ts`의 정규식 기반 장면 분리는 Expand 매크로를 제거하기 *전에* H2 헤딩을 먼저 찾기 때문에, 저자가 대본(Expand 매크로) 안에 `<h2>`를 포함시키면 이를 장면 경계로 잘못 인식할 수 있다. 현재 픽스처는 이 패턴을 쓰지 않아 실제 영향은 없지만, 콘텐츠 작성 가이드에 "대본 안에 H2를 쓰지 말 것"을 명시하거나, 후속 ADF Compiler 도입 시 매크로 제거를 먼저 수행하는 순서로 재설계해야 한다.
- Confluence 실 연동(`remote` 모드) 라이브 스모크 테스트 미수행 — 실제 Lesson 페이지가 생기면 검증 필요.
- 접근성 자동 검사(axe 등)·스크린리더 검증 미수행 — 수동 키보드 내비게이션만 확인.
- 다중 Course, Motion Preset, Knowledge Check 등은 설계 문서에 명시된 대로 후속 세션 범위.
