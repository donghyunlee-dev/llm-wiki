# edge-sidebar-fixes Spec

## Problem Statement
브라우저 익스텐션(`apps/edge-sidebar`)의 검색·가이드 표시가 다음 세 가지로 오동작한다.

1. **가이드 본문 이중 노출 + 글자 안 보임** — 가이드를 열면 같은 내용이 "평문 한 번 + 렌더링된 텍스트 한 번"으로 두 번 보이고, 일부 텍스트는 다크모드에서 반전이 안 되어 배경과 같은 색으로 보이지 않는다.
2. **추천/참고 페이지 중복** — 검색 답변 아래 "참고 문서" 리스트에 같은 페이지가 두 번 이상 나온다.
3. **추천 페이지 링크 오동작** — 일부 추천/참고 링크를 눌러도 본문이 열리지 않거나 "본문을 찾지 못했습니다" 오류가 난다.

## Business Context
익스텐션은 사내 임직원이 어느 웹페이지에서든 위키 검색·가이드를 바로 열람하는 진입점이다. 검색 결과와 링크가 신뢰 있게 동작하지 않으면 익스텐션 사용을 포기하게 되어, 위키의 접근성 개선 효과가 사라진다.

## Root Cause (분석 결과)
공통 근본 원인: 익스텐션이 웹앱의 정규화된 읽기 모델을 재사용하지 않고, 자체 축소 버전을 재구현한다.

- 익스텐션은 `/api/wiki-pages`가 돌려주는 **원본 Confluence 레코드**의 가공되지 않은 `page.bodyHtml`을 읽어 `dangerouslySetInnerHTML`로 그대로 렌더링한다(`main.tsx:227`).
- 익스텐션의 `rewriteConfluenceStorageLinks`는 `ac:link`만 변환하고, `note`/`info`/`panel`/`code` 등 구조화 매크로는 처리하지 않는다. 이 매크로는 CDATA plain-text body와 rich-text-body를 모두 가질 수 있어 **평문 1회 + 서식 1회 이중 노출**되고, 알 수 없는 `ac:*` 태그로 렌더된 텍스트는 `.guide-body`의 테마 전경색 규칙 밖에 있어 **다크모드에서 보이지 않는다**. → 문제 1(본문 이중 노출/불가시)
- 검색 응답의 3개 배열(`confluenceData`·`recommendedDocuments`·`relatedDocuments`)을 익스텐션이 하나의 "참고 문서" 리스트로 병합하고, dedup 기준이 **제목 완전 일치**뿐이다(`wikiClient.ts:131`). `confluenceData`의 제목은 AI 생성값이라 원본과 미세하게 달라 dedup을 통과 → 중복. → 문제 2(추천/참고 페이지 중복)
- 링크 해석에서 slug 경로(`/guides/{slug}`)는 정상이나, `confluenceData`의 `/wiki/{pageId}` 경로는 AI가 넣은 pageId가 공개 레코드와 어긋나면 실패한다. dedup의 `isSpecificDocumentHref`가 `/guides/`만 우선 인정하여(`wikiClient.ts:370`), `/faq/`·`/library/` 페이지는 slug 링크가 있어도 불안정한 `/wiki/{pageId}` 버전이 살아남아 깨진다. → 문제 3(추천 페이지 링크 오동작)

## 채택 방향
A안(서버 정리 HTML): 매크로 정리를 서버(웹 dev 미들웨어)에서 한 번 수행하고, 익스텐션은 정리 완료된 HTML을 받아 렌더링만 한다. 익스텐션의 0-의존 격리는 유지한다.

## Scope
1. `@sfood/wiki-core`에 **DOM-비의존 정리 함수** `renderConfluenceContentToCleanHtml(contentHtml, documents)` 추가.
   - `ac:link` → `<a href="/{section}/{slug}">` (documents로 제목/ID 매칭, 못 찾으면 링크 텍스트만 남김)
   - `structured-macro` note/info/tip/warning/panel → `<div class="wiki-callout wiki-callout--{kind}">…</div>`
   - code macro(CDATA) → `<pre><code>…</code></pre>`
   - `wiki.metadata` 블록, 잔여 `ac:*`/`ri:*` 태그, 매크로의 중복 plain-text body 제거
   - 순수 문자열 입출력(Node에서 실행 가능)
2. 웹 dev 서버(`apps/web/vite.config.ts`)에 **정리된 문서 엔드포인트** `GET /api/wiki/documents` 추가.
   - 반환: `{ pages: [{ id, slug, title, summary, href, docType, contentHtml, related: [{ title, href }] }] }`
   - `contentHtml`은 (1)의 함수로 정리, `href`/`related[].href`는 `getWikiDocumentHref` 규칙(`/{section}/{slug}`).
3. 익스텐션 `wikiClient.ts` 수정.
   - `requestWikiDocumentByHref` → 새 엔드포인트 사용, id 또는 slug로 매칭, **정리된 contentHtml 그대로 반환**. 익스텐션 내 `rewriteConfluenceStorageLinks`/원본 파싱 로직 제거.
   - `normalizeWikiSearchResponse` dedup 기준을 **제목 → 정규화된 페이지 식별자(href/pageId 기반)** 로 변경.
   - `isSpecificDocumentHref`가 `/guides/`·`/faq/`·`/library/` 등 **slug 기반 href 전체**를 "구체적"으로 인정하여 `/wiki/{pageId}`보다 우선하도록 수정.
4. 익스텐션 `styles.css`에 `.wiki-callout`·code 블록 **테마 변수 기반 스타일** 추가(다크모드 전경색 포함).

## Out Of Scope
- 웹앱 본체 렌더러 `ArticleContentRenderer.tsx` 및 `wikiRichBlocks.tsx` — 기존 React 렌더러 유지, 변경하지 않는다.
- `/api/wiki-pages` 응답 계약 — 웹 원격 소스 계약 유지 위해 불변.
- Surface별 docType 노출 규칙(FROZEN) — 변경하지 않는다.
- 플로팅 런처 UX(`contentScript.ts`), 배경 서비스 워커(`background.ts`).
- 프로덕션 serverless 엔드포인트(`packages/serverless`) — 익스텐션은 dev(`localhost:5173`) 기준이므로 이번 범위 밖. 필요 시 후속 태스크로 분리.

## User Or Operator Scenarios
- 임직원이 익스텐션 검색 후 "참고 문서"에서 각 페이지가 **한 번만** 노출되는 것을 본다.
- 참고/추천 링크를 누르면 사이드 패널 가이드 영역에서 **정상적으로 본문이 열린다**.
- 가이드 본문이 **중복 없이 한 벌만** 보이고, note/코드/콜아웃이 서식 있게 표시되며, 다크모드에서도 글자가 보인다.

## Acceptance Criteria
- **AC1**: note/info/tip/warning/panel/code/ac:link를 포함한 storage-format 입력에 대해 `renderConfluenceContentToCleanHtml`이 매크로별 시맨틱 HTML을 생성하고, plain-text body와 rich body가 함께 있는 입력에서 **텍스트가 한 번만** 남는다. (단위 테스트)
- **AC2**: 정리 결과 HTML에 잔여 `ac:`/`ri:` 태그와 `wiki.metadata` 블록이 남지 않는다. (단위 테스트)
- **AC3**: `GET /api/wiki/documents`가 정리된 `contentHtml`과 `related` 링크를 포함한 문서 목록을 반환한다.
- **AC4**: 익스텐션 검색 응답에서 동일 페이지가 "참고 문서"에 **중복 노출되지 않는다** (제목이 미세하게 달라도 같은 페이지면 1건). (단위 테스트)
- **AC5**: `/guides/`·`/faq/`·`/library/` slug href가 있는 페이지는 링크 클릭 시 정상적으로 가이드 본문이 열린다.
- **AC6**: 가이드 본문의 콜아웃/코드 텍스트가 다크·라이트 양쪽 테마에서 전경색이 적용되어 보인다.
- **AC7**: `pnpm test`, `pnpm typecheck` 전체 통과(웹앱 가이드 렌더링 회귀 없음).

## Edge Cases
- 매크로 파라미터에 `title`이 있는 콜아웃 / 없는 콜아웃.
- `ac:link`가 존재하지 않는 페이지를 가리킬 때(→ 링크 대신 텍스트만).
- code macro의 language 파라미터 유무.
- 본문이 비어 있는 nav/index 문서(→ 가이드로 열리지 않거나 빈 본문 안내).
- `confluenceData`에만 있고 recommended/related에는 없는 페이지의 href(`/wiki/{pageId}`) 링크 동작.
- 정규식이 처리 못 하는 깊은 중첩 매크로(→ 텍스트 유실 없이 최소한 평문으로 노출, 이중 노출만 방지).

## Assumptions
- 익스텐션은 dev 웹 서버(`http://localhost:5173`)를 기본 대상으로 한다.
- `cache.documents`(정규화된 WikiDocument)가 서버에 이미 존재하며 재사용 가능하다.
- 사이드 패널은 브라우저 컨텍스트지만, A-1 채택에 따라 정리는 서버에서 수행하므로 익스텐션은 DOMParser에 의존하지 않는다.

## Clarifications
- Q: "페이지 내 note 표시 중복"의 의미는? / A: 가이드 본문이 평문으로 한 번, 렌더링 텍스트로 한 번 총 2번 보이고, 텍스트 반전이 안 돼 보이지 않는 현상.
- Q: 문제 3(본문 정리) 해결 방향은 A안/B안 중? / A: A안(웹 읽기 모델 재사용, 단일 진실공급원).
- Q: A안에서 매크로 정리 변환을 어디서 수행할까? / A: 서버가 정리된 HTML 반환(정리 로직은 wiki-core의 DOM-비의존 함수, 익스텐션 격리 유지).
