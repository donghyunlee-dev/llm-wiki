# lesson-scene-content-rendering Test Result

## Commands

- `pnpm --filter @sfood/wiki-core test -- --run lessonPresentation` — Pass (12 tests, incl. 신규 interaction 통과/미통과 테스트 2건)
- `pnpm test` (전체 워크스페이스) — Pass (apps/web 156 tests, wiki-core 231 tests)
- `pnpm typecheck` (전체 워크스페이스) — Pass
- `rm -rf node_modules apps/web/node_modules ... && pnpm install` (클린 설치 재현) — `dist/index.js` 자동 생성 확인(`scripts/ensure-sfood-ui-dist.mjs` postinstall 동작 검증)

## Playwright Review (6b)

대상: `/lesson/sfood가-claude를-선택한-이유` (전역 씬 8/23)

- 타이틀 포커스 아웃라인: 씬 진입 후 `getComputedStyle(title).outlineStyle === "none"` 확인.
- `interaction.steps` 4개("이해 단계 공개...", "연결 단계 공개...", "완성 단계 공개...", "확장 단계 공개...")가 `@sfood/ui`의 `Stepper`로 화면에 표시됨을 확인(이전엔 빈 공간이었음).
- 라이트 테마: 브랜드 레드 체크 원 + 연결선, 정상 대비.
- 다크 테마: 다크 팔레트로 올바르게 전환됨(체크 원/라벨 대비 확인).
- 모바일(390px): Stepper가 뷰포트 밖으로 그냥 잘려나가는 문제가 있어 `overflow-x-auto` 래퍼 추가 → 가로 스크롤로 접근 가능하게 수정 확인.

## Codex Critical Review (6c)

5개 지적 사항 접수, 조치 결과:

| # | 지적 | 심각도 | 조치 |
|---|---|---|---|
| 1 | `scripts/ensure-sfood-ui-dist.mjs`가 git에 커밋되지 않은 상태(`??`)로 `package.json`이 참조 중 — 스크립트 누락 채로 커밋되면 클린 설치가 깨짐 | High | 코드는 문제 없음. 커밋 시 반드시 함께 스테이징해야 함 — `result.md`에 명시 |
| 2 | `interaction.kind`를 검증 없이 아무 kind나 Stepper로 렌더 | Medium | `SceneShell.tsx`에서 `interaction.kind === "step-reveal"`일 때만 렌더하도록 가드 추가, 회귀 테스트 추가 |
| 3 | `Stepper`의 `current={steps.length}`가 "전부 완료된 위저드"로 보여 데이터 의미(진행 상태 없는 설명용 4단계)와 맞지 않음 | Medium | `Stepper` 대신 `List`+`Badge`(순번)로 교체 — "완료/진행 중" 의미 없이 순서 있는 설명 목록으로 표현 |
| 4 | `ensure-sfood-ui-dist.mjs`가 resolve 실패 시 조용히 exit(0) — 실제 CI 문제도 성공으로 위장할 수 있음 | Medium | `apps/web/node_modules` 존재 여부로 "설치 대상 아님"과 "실제 실패"를 구분 — 후자는 exit(1)로 실패시킴 |
| 5 | `@theme inline`의 `--color-brand: var(--color-brand)`류 자기 참조 이름이 cascade 순서에 의존해 취약해 보임 | Low | 현재 동작 확인됨(빌드로 검증), 앱이 이미 자체 토큰에 쓰던 것과 동일한 기존 패턴 — 유지, 주석으로 순서 의존성 명시 |
| — | 11개 Scene 래퍼가 반복적(안전성 문제는 아님) | Note | 이번 범위에서는 유지, 별도 리팩터링 태스크로 남김 |

수정 후 재검증: `pnpm typecheck`, `pnpm test`(157 tests 전부 통과), Playwright로 라이트/다크/모바일 재확인(List+Badge로 교체 후에도 동일하게 정상 렌더링, 모바일에서 `overflow-x-auto` 없이도 자연스럽게 줄바꿈되어 그 래퍼는 제거함).

## 사용자 재현 리포트 이후 추가 발견 및 수정 (2차)

**증상**: 사용자가 스크린샷으로 지적 — "도식이 나와야 할 자리에 컨플루언스 리스트가 하단에 나온다"는 취지. 확인해보니 `interaction.steps`가 있는 21개 씬을 원본 데이터로 전수 조사한 결과:

| 구분 | 씬 수 |
|---|---|
| `visual`(customHtml 도식) 블록을 **이미 가지고 있음** | 19 |
| `visual` 블록이 **없음**(원래 문제였던 씬 8 등) | 2 |

**원인**: `interaction.steps`는 대부분(19/21) 이미 존재하는 `visual` 도식이 표현하는 내용을 다시 설명하는 캡션 텍스트였다(예: "지침/대화/파일/NOW" 4카드 도식 + "지침 공개"/"대화 공개"... 캡션 4개). 1차 수정에서 `interaction.kind === "step-reveal"`이면 무조건 리스트를 렌더링하게 만들어서, 이미 도식이 있는 19개 씬 전부에 **같은 내용이 중복 표시**되는 회귀가 발생했다. 1차 Playwright 검증은 도식이 없는 씬 8 하나만 확인했고, 도식이 있는 다른 19개 씬을 확인하지 않아 이 회귀를 놓쳤다.

**수정**: `SceneShell.tsx`에서 `blocks`에 `customHtml`(=원본 `visual`) 블록이 있으면 `interaction.steps` 리스트를 렌더링하지 않도록 가드 추가. `visual` 블록이 없는 씬(콘텐츠 공백)에서만 폴백으로 표시.

**재검증(Playwright)**:
- `context-window-main`(visual 있음, 19개 중 하나): 중복 리스트 사라지고 원래 도식만 남음 확인.
- `token-main`(visual 있음): 동일하게 중복 없음 확인.
- `why-claude-main`(visual 없음, 원래 문제 씬): 폴백 리스트 여전히 정상 표시 확인.
- `work-modes-main`(visual 없음, 나머지 1개): 폴백 리스트 정상 표시 확인.

**회귀 테스트 추가**: `SceneRenderer.test.tsx`에 "does not repeat interaction.steps as a list when the scene already has a visual (customHtml) block" 테스트 추가. 전체 158 tests 통과.

## Acceptance Criteria Coverage

- AC1(타이틀 아웃라인 제거): Playwright로 확인.
- AC2(`interaction.steps` 표시): Playwright + `SceneRenderer.test.tsx` 신규 테스트로 확인.
- AC3(`interaction` 없는 씬 회귀 없음): `SceneRenderer.test.tsx` "does not render a stepper..." 테스트 + 기존 154/156개 테스트 전부 통과로 확인.
- AC4(`@sfood/ui` 컴포넌트/토큰만 사용): `List`+`Badge` 컴포넌트 사용(Codex 리뷰 후 `Stepper`에서 교체, 아래 참고), 새 하드코딩 색상값 없음(모두 기존 임포트된 CSS 변수 재참조).

## Skipped Checks

- 없음.
