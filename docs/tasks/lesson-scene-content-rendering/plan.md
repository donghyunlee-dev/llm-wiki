# lesson-scene-content-rendering Plan

## Impacted Areas

- `packages/wiki-core/src/lib/lessonPresentation.ts` (+`.test.ts`) — `LessonScene`에 `interaction` 통과
- `apps/web/src/ui/pages/lessonScenes/SceneRenderer.tsx` (+`.test.tsx`), `SceneShell.tsx`, 11개 `*Scene.tsx` 래퍼 — `interaction` prop 전달
- `apps/web/src/ui/pages/LessonReaderPage.tsx` — `currentScene.interaction` 전달
- `apps/web/src/styles.css` — 타이틀 outline 수정, `@sfood/ui` 시맨틱 토큰을 Tailwind 유틸리티로 노출(`@theme inline`), 다크 테마에서도 같은 토큰이 맞게 오버라이드되도록 추가
- `apps/web/package.json`, `pnpm-lock.yaml`, root `package.json`, `scripts/ensure-sfood-ui-dist.mjs` — `@sfood/ui` 최신화 + git 의존성 dist 빌드 문제 해결(완료, 아래 "완료된 사전 작업" 참고)

## 완료된 사전 작업 (이미 반영됨)

- 디자인시스템 저장소에 "git 의존성 설치 시 dist 미빌드" 이슈 등록(#43) → 저장소 측에서 빌드 필수 패키지를 `dependencies`로 이동해 수정, 병합 확인.
- `@sfood/ui`를 최신 `main`(`d8551796d9...`)으로 재설치.
- pnpm이 git 의존성의 `prepare` 빌드 결과(`dist/`)를 최종 링크 위치로 옮기지 못하는 별도 문제를 발견 — root `postinstall`(`scripts/ensure-sfood-ui-dist.mjs`)으로 dist 누락 시 그 자리에서 직접 빌드하도록 자가 치유 로직 추가, 클린 설치로 재현 검증 완료.
- `pnpm.onlyBuiltDependencies`에 `@sfood/ui` 추가(빌드 스크립트 실행 허용).

## Approach

1. **타이틀 아웃라인**: `.lesson-reader-scene-title`에 `outline: none;` 추가.
2. **`interaction` 통과**: `LessonScene` 타입에 `interaction?: { kind: string; steps: string[] }` 추가, `compileScene`에서 `scene.interaction`이 있으면 그대로 옮긴다.
3. **렌더링**: `SceneShell`에 `interaction` prop 추가. `interaction.steps`가 있으면 `@sfood/ui`의 `Stepper`(`steps`, `current`)로 표시한다. 모든 단계가 "완료된 전체 흐름 설명"이므로 `current={steps.length}`(전부 완료 표시)로 렌더링한다. 없으면 기존과 동일하게 블록만 렌더링.
4. **11개 Scene 래퍼 + `SceneRenderer` + `LessonReaderPage`**: `interaction` prop을 그대로 통과시키는 배관 작업.
5. **`@sfood/ui` 토큰을 Tailwind 유틸리티로 노출**: `apps/web/src/styles.css`의 `@theme inline` 블록에 `@sfood/ui/tailwind.config.js`가 정의하는 색상/반경/그림자 토큰(`--color-brand`, `--color-surface`, `--color-foreground`, `--color-muted`, `--color-border` 등, `--radius-btn/card/input/badge`, `--shadow-*`)을 동일한 이름으로 인라인 참조 추가 — 이미 import된 `@sfood/ui/tokens/semantic.css`의 값을 그대로 재사용(새 하드코딩 없음).
6. **다크 테마 대응**: `@sfood/ui/tokens/semantic.css`는 라이트 테마만 정의한다(디자인시스템 자체에 다크 토큰 없음 — 별도 gap). 앱은 이미 `:root[data-theme="dark"]`에서 자체 별칭 변수를 `--gray-*`/`--brand-*` 베이스 토큰으로 재정의하고 있으므로, 같은 `:root[data-theme="dark"]` 블록에 `--color-foreground`/`--color-surface`/`--color-muted`/`--color-border`/`--color-brand` 등도 **같은 베이스 토큰**(`--gray-50`, `--gray-900` 등, 이미 `@sfood/ui/tokens/base.css`에서 옴)으로 오버라이드해 `Stepper` 등이 다크 테마에서도 올바르게 보이게 한다. 새 색상 값을 만들지 않고 기존 베이스 스케일을 재사용한다는 점에서 "하드코딩 금지" 원칙을 지킨다.

## Validation Plan

- `pnpm typecheck`, `pnpm test` (wiki-core + web)
- 대상 씬(`sfood가-claude를-선택한-이유`, 전역 8/23)에서 Playwright로 라이트/다크 테마 확인 — steps 4개가 보이는지, 타이틀 아웃라인이 없는지.
- Codex 크리티컬 리뷰(6c).

## Risks

- `@sfood/ui`의 `Stepper`는 React 19 대비 peerDependency가 `^18`로 선언돼 있어 `unmet peer` 경고가 뜬다(설치는 성공, 런타임 동작에는 영향 없음으로 확인) — 별도 이슈로 남길지는 결과 보고 후 판단.
- `@sfood/ui` 빌드 시 `DataTable.tsx`/`PieChart.tsx` 등에서 비치명적 TS 타입 에러가 보이지만 `dist/index.js` 산출에는 영향 없음(빌드 종료 코드 정상) — 우리가 쓰는 `Stepper`엔 해당 없음.
