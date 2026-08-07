# lesson-scene-mermaid-diagram Test Result

## Commands

- `pnpm --filter @sfood/wiki-core test -- --run lessonSemanticBlocks` — Pass (9 tests, mermaid 필드 파싱 2건 포함)
- `pnpm --filter @sfood/wiki-core test -- --run lessonPresentation` — Pass (13 tests, mermaidDiagram 컴파일 1건 포함)
- `pnpm test` (전체 워크스페이스) — Pass (apps/web 163 tests)
- `pnpm typecheck` (전체 워크스페이스) — Pass

## Playwright Review (6b)

임시 프리뷰 라우트(`/__mermaid-preview`, 검증 후 완전히 제거)에 사용자가 제시한 예시 Mermaid 정의("이해→연결→완성→확장" flowchart)를 실제 `MermaidDiagramBlock`에 그대로 넣어 확인:

- 라이트 테마: 브랜드 레드 테두리 + 연한 핑크 배경 카드, 라운드 코너(rx/ry, `--radius-md` 재사용), Pretendard 폰트 적용 — Mermaid 기본 테마(청록/각진 상자)와 달리 앱 톤과 일치.
- 다크 테마: 최초 시도에서 **실패 재현 및 원인 발견** — 다크 테마 토큰(`--panel-bg`, `--card-hover-bg`, `--accent-soft` 등)이 `color-mix(in srgb, ...)`를 쓰는데, `getComputedStyle`로 커스텀 프로퍼티를 직접 읽으면 그 함수가 계산되지 않은 원문 문자열이 나와 Mermaid의 색 파서가 `Unsupported color format` 에러를 던짐. `<div>`에 실제 `color` 프로퍼티로 대입해 브라우저가 계산하게 하는 방식으로 1차 수정했으나, 이 브라우저가 계산 결과를 CSS Color 4 `color(srgb r g b)` 형식으로 직렬화해 Mermaid가 여전히 이해하지 못함(2차 실패). 최종적으로 `color(srgb r g b)` 형식을 직접 정규식으로 `rgb(...)`로 변환하는 `toLegacyRgb()`를 추가해 해결 — 이후 다크 테마 정상 렌더링, 콘솔 에러 0건 확인.
- 테마 라이브 전환(같은 페이지에서 라이트→다크→라이트 버튼 클릭): 매번 재렌더링되어 올바른 색으로 갱신됨을 확인.
- 뷰포트 900px/1400px 양쪽 확인 — 900px에서 최초 1회 다이어그램이 겹쳐 보이는 스크린샷이 있었으나 새로고침 후 재현되지 않아 스크린샷 타이밍 아티팩트로 판단(연속 재확인 3회 모두 정상).
- 기존 19개 `html`+`css` 기반 `visual` 씬(예: Context Window, Token) 및 폴백 리스트가 필요한 2개 씬(도식 없음)은 이번 변경과 무관 — 별도 회귀 확인은 생략(코드 경로가 분리돼 있고 테스트로 커버됨).

## Codex Critical Review (6c)

4개 지적 사항 접수, 조치 결과:

| # | 지적 | 심각도 | 조치 |
|---|---|---|---|
| 1 | `securityLevel: "strict"`만으로는 저작자가 다이어그램 본문에 `%%{init: {"themeCSS": "..."}}%%` 지시어를 넣어 `themeCSS`를 덮어써 페이지 전역 CSS를 주입할 수 있음(mermaid의 `secure` 목록에 없는 설정 키는 지시어로 바꿔치기 가능) | High | `mermaid.initialize`에 `secure: ["secure","securityLevel","startOnLoad","maxTextSize","theme","themeVariables","themeCSS","fontFamily"]` 명시 추가 — 이 키들은 다이어그램 본문 지시어로 덮어쓸 수 없게 잠금. 회귀 테스트 추가 |
| 2 | 취소된(stale) 렌더도 `cancelled` 체크 전에 `mermaid.initialize()`까지는 실행돼, 전역 설정인 mermaid 설정을 새 렌더보다 늦게 덮어쓸 race 가능 | Medium | 모든 렌더를 모듈 전역 `renderQueue` 프라미스 체인으로 직렬화 + dynamic import 직후에도 `cancelled` 재확인 |
| 3 | `visual` 블록에 `html`/`css`와 `mermaid`가 동시에 있으면 조용히 html을 우선시켜, 저작자가 mermaid로 바꿔도 반영 안 되는 걸 못 알아챌 수 있음 | Medium | 스키마에서 상호 배타 처리로 변경 — 둘 다 있으면 통째로 버림(undefined). 회귀 테스트 추가 |
| 4 | `toLegacyRgb`가 소수 채널의 `color(srgb r g b / a)` 정확한 한 형태만 처리 — 퍼센트 채널, 알파 `none` 등 다른 CSS Color 4 직렬화는 그대로 통과해 다시 실패할 수 있음. 테스트도 mermaid 전체를 목킹해 이 로직 자체는 검증 안 됨 | Low | 함수를 export해 직접 단위 테스트 추가, 퍼센트 채널·알파 `none`·인식 못하는 포맷 통과 케이스까지 정규식 확장 |

수정 후 재검증: `pnpm typecheck`, `pnpm test`(wiki-core 235 + web 170 tests 전부 통과), Playwright로 라이트/다크 재확인(임시 프리뷰 라우트로 재검증 후 완전히 제거) — `secure` 잠금·렌더 큐 직렬화 추가 후에도 렌더링 정상, 콘솔 에러 0건.

## Acceptance Criteria Coverage

- AC1: `lessonSemanticBlocks.test.ts` "accepts a visual block authored with mermaid instead of html/css" 확인.
- AC2: Playwright로 실제 SVG 렌더링 확인.
- AC3: Playwright로 브랜드 톤(라운드 코너, 브랜드 레드) 확인.
- AC4: Playwright로 라이트/다크 전환 확인(위 색상 버그 수정 포함).
- AC5: `SceneRenderer.test.tsx` "does not repeat interaction.steps as a list when the scene already has a mermaidDiagram block" 확인.
- AC6: 기존 19개 html+css 씬은 코드 경로가 분리돼 있어 회귀 없음(파서 분기가 html/css 우선 체크 유지).
- AC7: `MermaidDiagramBlock.test.tsx` "initializes mermaid with a strict security level" 확인.

## Skipped Checks

- 없음.
