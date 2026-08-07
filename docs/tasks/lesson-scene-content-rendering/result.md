# lesson-scene-content-rendering Result

## Delivered Scope

1. `.lesson-reader-scene-title`의 브라우저 기본 포커스 아웃라인 제거(`outline-none`).
2. `lesson.presentation`의 `scenes[].interaction.steps`가 `compileScene`에서 조용히 버려지던 문제 수정 — `LessonScene`에 통과시키고, `interaction.kind === "step-reveal"`일 때만 `@sfood/ui`의 `List`+`Badge`로 순서 있는 설명 목록을 렌더링.
3. `@sfood/ui`의 React 컴포넌트를 이 저장소에서 처음으로 실제 사용 가능하게 만듦 — 디자인시스템 저장소의 git-의존성 dist 빌드 문제(이슈 #43, 수정 병합됨)를 확인·재설치했고, 그 과정에서 발견한 pnpm의 별도 문제(빌드된 dist가 최종 링크 위치로 옮겨지지 않음)를 `postinstall` 자가 치유 스크립트로 우회.
4. `@sfood/ui`의 시맨틱 Tailwind 토큰(`brand`/`surface`/`foreground`/`muted`/`border` 등)을 이 앱의 Tailwind 빌드에서 실제 유틸리티로 쓸 수 있게 노출(라이트+다크 양쪽).

## Changed Files

- `packages/wiki-core/src/lib/lessonPresentation.ts` / `.test.ts`
- `apps/web/src/ui/pages/lessonScenes/SceneShell.tsx`, `SceneRenderer.tsx` / `.test.tsx`, 11개 `*Scene.tsx` 래퍼
- `apps/web/src/ui/pages/LessonReaderPage.tsx`
- `apps/web/src/styles.css`
- `apps/web/package.json`, `pnpm-lock.yaml`(`@sfood/ui` 최신 main으로 갱신)
- `package.json`(root) — `postinstall`, `pnpm.onlyBuiltDependencies`
- `scripts/ensure-sfood-ui-dist.mjs`(신규)

## Key Decisions

- **`Stepper` 대신 `List`+`Badge`**: 원본 데이터(`interaction.steps`)는 사용자가 진행 중인 위저드가 아니라 "이해→연결→완성→확장" 4단계를 한 번에 모두 보여주는 설명이다(레퍼런스 사이트 실측: `reveal:"manual"`이어도 클릭 게이팅 없음). `Stepper`의 `current` prop은 "완료/진행 중" 상태를 표현하는 컴포넌트라 이 의미와 맞지 않아(Codex 리뷰에서 지적) `List`의 각 항목에 순번 `Badge`를 붙이는 방식으로 교체했다.
- **`interaction.kind` 화이트리스트**: 현재 관측된 kind는 `"step-reveal"` 하나뿐이라, 이 값일 때만 렌더링하고 다른 kind(미래에 추가될 수 있는)는 안전하게 무시한다 — 알 수 없는 표현 방식을 잘못된 UI로 렌더링하는 것보다 안전.
- **`@sfood/ui` 토큰을 `@theme inline`으로 노출**: 새 색상/치수 값을 만들지 않고, 이미 import된 `@sfood/ui/tokens/semantic.css`의 `--color-*` 변수를 그대로 참조만 추가했다. 다크 테마는 디자인시스템 자체에 다크 토큰이 없어(라이트 전용), 이 앱이 이미 쓰던 것과 동일한 `--gray-*`/`--brand-*` 베이스 스케일로 오버라이드했다.
- **`@sfood/ui` git 의존성 dist 빌드 문제**: 별도 저장소 이슈(#43)로 등록 → 그쪽에서 수정 병합. 이 저장소에서 추가로 발견한 pnpm 자체의 "빌드는 되는데 링크 위치로 안 옮겨짐" 문제는 root `postinstall` 스크립트로 자가 치유하게 했다(클린 설치로 재현·검증).

## Codex Review 대응

5개 지적 중 4개를 코드로 반영(kind 가드, Stepper→List/Badge 교체, install 스크립트 실패 처리 강화)했다. 나머지 1개(`@theme inline` 자기 참조 이름의 cascade 의존성)는 기존 코드베이스가 이미 쓰던 동일 패턴이라 유지하고 주석으로 명시했다. 자세한 내용은 `test-result.md`.

## 사용자 재현 리포트로 발견한 회귀 (2차 수정)

배포 전 사용자가 스크린샷으로 지적: `interaction.steps`가 있는 21개 씬 중 19개는 이미 `visual`(customHtml) 도식 블록을 갖고 있었고, steps는 그 도식을 다시 설명하는 캡션이었다. 1차 구현이 "step-reveal이면 무조건 렌더링"했기 때문에 이 19개 씬 전부에 도식과 중복되는 텍스트 리스트가 나타나는 회귀가 생겼다 — 1차 Playwright 검증이 도식 없는 씬 1개만 확인하고 나머지 19개를 확인하지 않아 놓친 것. `SceneShell.tsx`에 `blocks`에 `customHtml`이 있으면 리스트를 억제하는 가드를 추가해 수정했고, 도식이 있는 씬/없는 씬 양쪽을 모두 Playwright로 재확인했다.

## Open Gaps

- **`scripts/ensure-sfood-ui-dist.mjs`는 아직 커밋되지 않았다(untracked)** — 이 파일 없이 `root package.json`의 `postinstall` 참조만 커밋되면 클린 설치가 깨진다. 커밋 시 반드시 함께 스테이징해야 한다.
- 11개 `*Scene.tsx` 래퍼가 거의 동일한 코드를 반복한다(Codex 리뷰에서도 언급, 안전성 문제는 아님) — 이번 범위에서는 손대지 않았다. 필요하면 별도 리팩터링 태스크로 진행.
- `@sfood/ui`는 여전히 React 19에 대해 `unmet peer` 경고가 뜬다(설치는 정상 동작, 런타임 영향 없음으로 확인) — 디자인시스템 쪽에 peerDependencies 갱신을 요청할지는 별도 판단 필요.

## Next Steps

- 사용자 확인 후 커밋(어떤 파일을 포함할지는 위 "Open Gaps" 첫 항목 참고).
