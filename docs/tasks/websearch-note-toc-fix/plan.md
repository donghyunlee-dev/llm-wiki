# Plan

## 영향 범위

| 파일 | 변경 |
|---|---|
| `packages/wiki-core/src/lib/confluenceCleanHtml.ts` | `ac:adf-extension` 패널 → `<div class="wiki-callout wiki-callout--{type}">` 변환 (ac:link 변환 이전 단계에 추가) |
| `apps/web/src/ui/pages/ArticleContentRenderer.tsx` | `rewriteConfluenceRichNodes`에 `ac:adf-extension` 패널 처리 추가 → blockquote 콜아웃 (기존 `resolveConfluenceCalloutElement` 패턴 재사용) |
| `apps/web/src/styles.css` | `.article-toc-*` 마커 `::before` 제거, 레벨 들여쓰기 재조정, 간격 축소 |

## 접근

### Bug 1 — ADF 패널
- 공통 원인: 두 렌더러 모두 `ac:adf-extension`을 미처리 → content + fallback 이중 출력.
- clean HTML(문자열): 정규식으로 `ac:adf-node[type=panel]`에서 `panel-type`과
  `ac:adf-content`를 추출, 단일 콜아웃 div로 치환. fallback은 통째로 제거됨.
- 웹 아티클(DOM): `ac:adf-extension` 노드를 찾아 panel-type/content로 blockquote를
  만들어 `replaceWith`. 기존 blockquote→WikiCallout 렌더 경로 재사용.

### Bug 2 — 목차
- `.article-toc-level-*::before` 규칙 및 결합 위치 규칙 제거.
- 레벨 구분은 padding-left 들여쓰기만 사용 (마커용 여백 축소).
- `.article-toc` `space-y-1` → 축소, `.article-toc-link` `py-1.5` → 축소.

## 검증 계획

- `confluenceCleanHtml.test.ts`: ADF 패널 → 단일 콜아웃, dedup, fallback 제거 단위테스트 (TDD).
- `pnpm test`, `pnpm typecheck` 전체 통과.
- Playwright: 실제 가이드 문서에서 note 단일 렌더 + 목차 마커 제거/간격 확인.
- Codex 크리티컬 리뷰.

## 리스크

- ADF 이외의 `ac:adf-extension`(비패널)은 이번 범위 밖 — 기존 동작 유지.
- 정규식 기반 clean HTML 변환은 중첩 패널을 가정하지 않음 (현 데이터에 없음).
