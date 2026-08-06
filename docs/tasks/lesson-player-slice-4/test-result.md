# lesson-player-slice-4 Test Result

## Commands Run

| Command | Result |
|---|---|
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS — wiki-core 231, apps/web 134, 나머지 회귀 없음 |

## New/Updated Tests

- `ContextWindowVisual.test.tsx`(신규): 4개 고정 항목 렌더링, 기본 상태에서 밀려남 표시 없음, `emphasis="overflow"` 시 첫 항목에 밀려남 표시, 모든 항목에 hover/focus 설명 텍스트 존재.
- `lessonScenes.test.ts`: `presentation.scenes[].visual`이 `LessonScene.visual`로 전달되는지, 선언이 없으면 `undefined`인지 확인.

## Playwright 실브라우저 검증 (snapshot 모드, 임시 서버 5199)

- "컨텍스트 창이 가득 차면" 장면(process 타입, `visual: { kind: "context-window", emphasis: "overflow" }` 선언)에서 4개 항목(지침/이전 대화/파일/새 요청)이 표시되고, "지침" 항목에 "밀려남" 배지 + 점선 테두리 + 낮은 불투명도가 적용됨을 스크린샷으로 확인.
- "새 요청" 항목에 마우스를 올리면 300ms 이내 설명 텍스트("가장 최근 요청이라 항상 우선적으로 유지됩니다.")의 `opacity`가 0→1로 전환됨을 computed style로 확인.

## Codex 비판적 리뷰

`ContextWindowVisual.tsx`/`.test.tsx`와 `visual` 필드 관련 코드를 Codex(read-only sandbox)에 전달해 리뷰받음. 2건 발견, 전부 수정.

| # | 지적 사항 | 조치 |
|---|---|---|
| 1 | `readSceneVisual`이 `emphasis`가 `"overflow"`가 아닌 다른 값(오타 등)이어도 `{ kind: "context-window" }`로 조용히 통과시켜, 잘못된 값이 유효한 visual로 둔갑함 | `emphasis` 키가 있는데 `"overflow"`가 아니면 전체 `visual`을 `undefined`로 거부하도록 수정(엄격 검증) |
| 2 | `emphasis="overflow"`일 때 밀려나는 항목에 CSS `opacity-50`을 적용했는데, 이 opacity가 자식인 tooltip에도 곱해져서 정작 hover/focus로 확인해야 할 그 항목의 설명 텍스트가 흐릿하게(대비 낮게) 보임 | `opacity` 대신 테두리/배경/텍스트 색상 변경으로 "밀려남" 느낌을 표현하도록 변경 — tooltip은 더 이상 부모의 opacity에 영향받지 않음 |

수정 후 Playwright로 재확인: "지침" 항목(overflow 대상)에 hover 시 tooltip의 `opacity`가 정상적으로 `1`로 확인됨(수정 전에는 부모 opacity와 곱해져 약 0.5였을 것). `pnpm typecheck`/`pnpm test` 재실행 — 전부 통과.

Codex가 타입 흐름(`SceneVisual → LessonPresentationMetadata → LessonScene.visual → UI`)과 React key 안정성, Tab 순서는 별도 문제 없다고 확인함.

## Skipped Checks

- 모바일/터치 환경에서의 hover 대체 인터랙션은 이번 범위 밖(스펙의 Risks에 기록).
- `readSceneVisual`의 잘못된 `emphasis` 거부 로직에 대한 전용 단위 테스트는 추가하지 않음 — 이 함수가 `confluenceClient.ts`의 비공개(private) 함수이고, 기존 테스트 인프라가 HTTP mock 기반 통합 테스트뿐이라 이 한 줄짜리 검증을 위해 통합 테스트를 새로 구성하는 비용이 지나치게 크다고 판단(Playwright/코드 리뷰로 대체 확인).
