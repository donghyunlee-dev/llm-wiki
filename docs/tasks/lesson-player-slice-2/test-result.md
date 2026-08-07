# lesson-player-slice-2 Test Result

## Commands Run

| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (전체 워크스페이스) |
| `pnpm test` | PASS — wiki-core 227, apps/web 126, 나머지 워크스페이스 회귀 없음 |

## New/Updated Automated Tests

- `lessonSemanticBlocks.test.ts`: `customHtml` 블록 변환(HTML 매크로 → 원문 보존), 빈 매크로 무시, 스크립트/이벤트 핸들러가 포함돼도 컴파일 단계에서는 원문 그대로 보존(실행 방지는 렌더링 단계 sandbox 책임), 같은 장면 내 여러 HTML 매크로 구분, `misconception`/`screenshot` 추론 규칙, `concept` 기본값 갱신.
- `SceneRenderer.test.tsx`: 11개 Scene Type 전체 분기 테스트(`it.each`) 추가.
- `CustomHtmlDiagramBlock.test.tsx`(신규): `sandbox` 속성이 `allow-same-origin`만 포함하고 `allow-scripts`는 절대 없음을 검증, `srcDoc`에 원문이 그대로 전달되는지 검증.

## Playwright 실브라우저 검증 (snapshot 모드, 임시 서버 5199)

- 별도 임시 dev 서버(`VITE_WIKI_DATA_SOURCE=snapshot`, 포트 5199, 작업 종료 후 중지)에서 `confluenceSnapshots.ts`의 "컨텍스트와 기억의 한계" 픽스처에 HTML 매크로 도식 장면을 추가해 확인.
- **렌더링 확인**: `<div style="display:flex">...</div>` 형태로 작성한 흐름도("지침 → 컨텍스트")가 지정한 색상·테두리·정렬 그대로 화면에 표시됨. iframe 높이가 내용에 맞춰 자동 조정되어 잘림/과도한 여백 없음.
- **보안 확인(핵심)**: 같은 매크로 내용에 `<script>window.__sandboxEscapeTest = "EXECUTED"; document.title = "HACKED";</script>`와 `<img src="x" onerror="window.__sandboxEscapeTest = '...'">`를 추가한 뒤 재확인 — `document.title`은 "SFOOD AI WIKI"로 그대로였고, 부모 페이지의 `window.__sandboxEscapeTest`는 `undefined`(둘 다 실행되지 않음). `iframe`의 `sandbox` 속성은 `allow-same-origin`만 포함됨을 직접 확인.
- 검증 후 테스트용 스크립트/이벤트 핸들러 페이로드는 픽스처에서 제거하고 안전한 다이어그램 예시만 남김.

## Codex 비판적 리뷰

`slice2.diff`를 Codex(read-only sandbox)에 전달해 비판적 리뷰를 받았다. 4건 발견, 3건 수정(1건은 알려진 한계로 문서화).

| # | 지적 사항 | 조치 |
|---|---|---|
| 1 | `sandbox="allow-same-origin"`은 스크립트 실행은 막지만 `<img src="https://...">`, `<style>background:url(...)</style>` 같은 수동 네트워크 요청(뷰어 IP·쿠키 유출 가능)은 막지 못함 | `srcDoc`에 `default-src 'none'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; base-uri 'none'; form-action 'none'` CSP를 메타 태그로 주입하고 iframe에 `referrerPolicy="no-referrer"` 추가 |
| 2 | `customHtml` sentinel이 표/목록/콜아웃 컨테이너 안에 중첩되면, 컨테이너가 통째로 하나의 블록으로 처리되면서 sentinel div가 소비되지 않고 조용히 사라짐(빈 div만 남음) | 소비된 인덱스를 추적해, 소비되지 않은 `customHtml` 항목은 장면 끝에 그대로 덧붙이는 안전장치 추가(원저작 위치와 다를 수 있으나 콘텐츠 유실은 없음) |
| 3 | `inferSceneTypeAndLayout`에서 comparison(표) 체크가 misconception(경고 콜아웃) 체크보다 먼저 실행돼, 경고+표가 함께 있는 오해 교정 장면이 `comparison`으로 잘못 분류됨 | 체크 순서를 misconception 우선으로 재배치 |
| 4 | HTML 매크로 추출 정규식이 `ac:name="html"`(쌍따옴표)만 매칭하고 CDATA 내부에 리터럴 `</ac:structured-macro>` 텍스트가 있으면 잘릴 수 있음 | 낮은 우선순위의 알려진 한계로 `result.md`에 기록(실제 사례 발견 시 대응) |

각 항목에 회귀 테스트 추가: `CustomHtmlDiagramBlock.test.tsx`(CSP·referrerPolicy 포함 여부), `lessonSemanticBlocks.test.ts`(표 셀 중첩 HTML 매크로 보존, misconception이 comparison보다 우선). 수정 후 재실행 — `pnpm typecheck`/`pnpm test` 전부 통과(wiki-core 229, apps/web 128).

Playwright로 CSP 적용 후에도 다이어그램이 동일하게 렌더링되는지 재확인(회귀 없음).

## Skipped Checks

- 나머지 6개 Scene Type의 실제 콘텐츠 기반(실 Confluence) 검증은 콘텐츠가 아직 없어 스냅샷/컴포넌트 테스트로만 커버.
- Screenshot Hotspot의 실제 인터랙션(확대, 미니맵)은 이번 Slice 범위 밖(레이아웃 셸만 구현).
