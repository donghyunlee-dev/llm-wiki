# Test Result

## 실행 명령 및 결과

| 명령 | 결과 |
|---|---|
| `pnpm --filter @sfood/wiki-core test` (ADF 실패 테스트 선작성) | FAIL (의도된 red) → 구현 후 PASS |
| `pnpm test` (전체) | PASS — apps/web 52, wiki-core 168 포함 전체 통과 |
| `pnpm typecheck` (전체) | PASS — 5개 프로젝트 모두 Done |

## 추가한 단위 테스트 (`confluenceCleanHtml.test.ts`)

- ADF 패널 확장 → 단일 콜아웃, fallback/`adf-` 잔재 제거, 본문 dedup(1회).
- 중첩 `ac:adf-node`가 있는 `adf-content`에서 본문 절단 없이 유지 (Codex 지적 #2 회귀 방지).
- 신뢰할 수 없는 `panel-type`("note\" onclick=...")은 안전한 `info`로 정규화, `onclick` 미노출 (Codex 지적 #1 회귀 방지).

## Playwright 브라우저 검증 (6b)

대상: `/guides/guide-confluence-동시-편집-충돌-해결-및-버전-관리-전략`

수정 전:
- note 컨테이너에 `<ac:adf-extension>`가 그대로 남아 content + `.panel` fallback 이중 렌더, "note" 라벨 텍스트 누출.
- 목차: `•`/`—` 마커가 세로 중앙 배치 → 여러 줄 항목에서 어긋남, `py-1.5`+`space-y-1`로 세로 길이 과다.

수정 후 (DOM 측정):
- `noteTextCount = 1`, `.panel/.panelContent` 없음, `ac:adf-extension` 없음.
- note가 `wiki-callout wiki-callout-note`(aria-label "참고") 단일 콜아웃으로 렌더.
- 목차 마커 `::before` content = `none` (전 레벨), `py` 6px→4px, `space-y` 축소, 레벨별 들여쓰기 유지.

## 스킵/한계

- 웹 아티클 렌더러(`ArticleContentRenderer`)의 DOM 변환 로직은 테스트 환경에 jsdom이
  없어(`renderToStaticMarkup` 기반) 단위테스트 대신 Playwright로 검증함.

## Codex 크리티컬 리뷰 (6c)

- 지적 1: 문자열 클리너의 `panel-type` 속성 인젝션 → 화이트리스트(`resolveAdfPanelType`)로 수정, 테스트 추가.
- 지적 2: lazy 정규식의 중첩 `ac:adf-node` 절단 → `inner`에서 직접 추출하도록 변경, 테스트 추가.
- DOM 렌더러에도 동일 화이트리스트 적용.
