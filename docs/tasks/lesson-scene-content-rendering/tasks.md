# lesson-scene-content-rendering Tasks

- [x] `@sfood/ui` git 의존성 dist 빌드 문제 진단 + 이슈 등록(#43) + 수정 반영 확인 + 로컬 재설치
- [x] pnpm이 git 의존성 빌드 산출물을 못 옮기는 문제 자가 치유 스크립트 추가 (`scripts/ensure-sfood-ui-dist.mjs`)
- [x] `.lesson-reader-scene-title`에 `outline: none` 추가
- [x] `apps/web/src/styles.css`에 `@sfood/ui` 시맨틱 토큰 `@theme inline` 노출 + 다크 테마 오버라이드
- [x] `LessonScene`에 `interaction` 통과 (`lessonPresentation.ts` + 테스트)
- [x] `SceneShell`에 `interaction` → 렌더링 추가 (`List`+`Badge`, Codex 리뷰로 `Stepper`에서 교체)
- [x] `SceneRenderer` + 11개 Scene 래퍼 + `LessonReaderPage`에 `interaction` prop 배관
- [x] `pnpm typecheck` / `pnpm test` 통과
- [x] Playwright로 대상 씬 라이트/다크/모바일 확인
- [x] Codex 크리티컬 리뷰 (5건 접수, 4건 반영)
- [x] `test-result.md` / `result.md` / `implementation-status.md` 갱신
