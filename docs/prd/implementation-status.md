# Implementation Status

## Purpose
This document is the session-to-session progress ledger for the project. It must be updated every time implementation moves forward so a new session can resume in the correct order without depending on memory.

## Current Phase Map
| Phase | Name | Status | Notes |
| --- | --- | --- | --- |
| 0 | Project Setup | Completed | `pnpm` workspace, root config, web app, shared package created |
| 1 | Home Screen Prototype | Completed | Home page implemented from `Development Prompt` and realigned to the prototype-style compact layout |
| 2 | Read-only Wiki Core | In Progress | Remote source contract and validation are in place; actual endpoint value and CORS verification are still pending |
| 3 | Section and Article Pages | In Progress | Category/article pages now read through the shared async wiki source; upstream data wiring is still pending |
| 4 | Search Flow | In Progress | Search now uses the shared async wiki source and can swap snapshot/remote backends; upstream search data wiring is still pending |
| 5 | Metadata and Graph | In Progress | First article graph block now renders prerequisites, next, and related links from metadata |
| 6 | Read-only AI Ask | In Progress | Local dev endpoint, article Ask panel, and policy-aware prompt context return structured AI answer plus Confluence evidence and suggested documents |
| 7 | Operator Workflow | Not Started | No review workflow yet |

## Latest Completed Work
### 2026-07-22 — 익스텐션 검색/가이드 오동작 수정 (A안: 서버 정리 HTML)
- 대상: `apps/edge-sidebar` 3대 오동작 — (1) 가이드 본문 이중 노출 + 다크모드 불가시, (2) 추천/참고 페이지 중복, (3) 추천 링크 오동작.
- 근본 원인: 익스텐션이 웹 정규화 모델을 재사용하지 않고 원본 Confluence `bodyHtml`을 raw로 렌더 + 제목 기준 dedup + `/guides/`만 우선하는 href 선택.
- 해결(A안, 서버 정리): 매크로 정리를 서버에서 수행하고 익스텐션은 정리된 HTML 렌더만. 익스텐션 0-의존 격리 유지.
  - `packages/wiki-core/src/lib/confluenceCleanHtml.ts` 신규: DOM-비의존 `renderConfluenceContentToCleanHtml(html, documents)` — code/callout/ac:link 매크로 → 시맨틱 HTML, 잔여 `ac:`/`ri:`·`wiki.metadata` 제거.
  - `apps/web/vite.config.ts`: `GET /api/wiki/documents` 신규(정리된 contentHtml + related). 기존 `/api/wiki-pages` 불변.
  - `apps/edge-sidebar/src/sidepanel/wikiClient.ts`: 검색 소스 dedup을 제목 → 페이지 ID로 변경, `isSpecificDocumentHref`를 guides/faq/library로 확장, 가이드 본문을 새 엔드포인트에서 `findCleanDocumentByHref`로 로드, storage-format 죽은 코드 제거.
  - `apps/edge-sidebar/src/sidepanel/styles.css`: `.wiki-callout`/코드에 테마 변수 스타일(다크모드 가시성).
  - Codex High(XSS) 반영: `sanitizeConfluenceHtml`이 따옴표 없는 이벤트 핸들러도 제거.
- 검증: `pnpm test` 279개 통과, `pnpm typecheck` 전체 통과, 익스텐션 build 통과. 서브에이전트 2단계 리뷰 + Codex 비판 리뷰(Critical 0). 라이브 엔드포인트·익스텐션 실사용은 사용자 브라우저 수동 확인 필요(MCP Playwright에 unpacked 익스텐션 미로드).
- 태스크 문서: `docs/tasks/edge-sidebar-fixes/`, 계획: `docs/superpowers/plans/2026-07-22-edge-sidebar-fixes.md`.

### 2026-06-18 — 위키 MCP 서버 (`apps/mcp-server`) 신규 구현 (격리)
- 사내 Confluence 위키를 읽기 전용 MCP(Model Context Protocol) 서버로 노출하는 독립 앱 `apps/mcp-server` 추가.
- **격리 제약(사용자 핵심 요구)**: `apps/edge-sidebar`와 동일 레벨의 별도 앱. `@sfood/wiki-core` 등 워크스페이스 패키지를 import하지 않고 Confluence 클라이언트를 자체 보유. 기존 패키지(web/edge-sidebar/wiki-core/serverless) 소스 무수정. 환경만 공유, 배포 독립. 런타임 의존성 0개(Node 22 글로벌 `fetch`).
- MCP Tools 5개: `search_wiki`, `get_page`(plain text 8000자 트림), `get_page_by_title`, `get_page_children`, `get_space_list`.
- MCP Streamable HTTP transport를 JSON-RPC 2.0(protocolVersion `2024-11-05`)로 직접 구현 (외부 SDK 미사용). `initialize`/`ping`/`tools.list`/`tools.call`/`notifications` 지원.
- `x-api-key` 인증(401), Lambda Function URL 핸들러(`export const handler`), esbuild 단일 ESM 번들(18.5kb).
- Confluence 실패/404는 서버 크래시 없이 tool `isError`로 반환. CQL `space`는 숫자 Space ID 사용, 선택적 `space_key` 오버라이드.
- Codex 비판 리뷰 7건 중 6건 반영: id:null 응답, 빈 배치/malformed shape `-32600`, malformed base64 무크래시, 페이지네이션 상한, 동일 origin next 링크만 추적(SSRF 방지). 와일드카드 CORS는 서버사이드 클라이언트 전제로 수용.
- 문서: `apps/mcp-server/README.md`, `docs/tasks/wiki-mcp-server/aws-deployment-guide.md`.
- 검증: `pnpm --filter @sfood/mcp-server typecheck/test`(36건)/`build` 통과, 전체 `pnpm typecheck`/`pnpm test` 회귀 없음, 격리 grep 0건. 실제 AWS 배포·Confluence end-to-end는 가이드 기반 수동 단계로 분리.

### 2026-06-09 — 브라우저 사이드바 확장 MVP 추가
- 기존 위키 앱과 분리된 `apps/edge-sidebar` 워크스페이스 패키지를 추가.
- Manifest V3 기반 side panel extension으로 구성:
  - toolbar action 클릭 시 side panel 열기
  - 로컬 기본 위키 URL `http://localhost:5173`
  - multiline 질문 입력
  - `/api/wiki/ai/search` 호출
  - API 실패 시 `/search?q=` fallback 링크 제공
- 로컬 로드 피드백 반영:
  - 웹 favicon 기반 PNG 아이콘 4종 추가
  - 웹 공통 CSS 변수 톤으로 사이드바 UI 재정렬
  - 상단 URL/텍스트 제거
  - 우측 상단 홈 아이콘 추가
  - 답변 영역을 상단 full 영역으로 확장
  - 검색 composer를 하단 고정
  - 답변 markdown 링크와 참고 문서 링크를 새 탭으로 열도록 수정
  - 검색 후 입력값 초기화 및 제출 질문을 답변 상단에 표시
  - 참고 문서 링크 contrast 수정
  - composer 내부 우측 하단 전송 버튼으로 변경
  - `http://localhost:5173/*` 페이지에 draggable floating launcher 주입
- 전역 브라우저 사이트로 범위를 넓혀 `"<all_urls>"`에서 플로팅 launcher가 보이도록 변경.
- 플로팅 launcher는 hover 시 확장되며 wiki home 버튼과 환경 설정 popover를 제공.
- hover 시 제목 텍스트는 표시하지 않고, 위에는 home 아래에는 settings 버튼을 분리해서 보여줌.
- launcher 설정은 `chrome.storage.local`에 저장되어 사이트를 바꿔도 유지.
- 사이드 패널 헤더에 launcher 복구 버튼을 추가해 숨김 상태를 다시 해제할 수 있게 함.
- 가이드 결과를 선택하면 새 창 대신 side panel 내부의 오른쪽 슬라이드 영역으로 전환되며, 상단 뒤로 가기 버튼으로 검색 화면으로 복귀할 수 있게 함.
- 가이드 슬라이드 영역은 전체 페이지 URL iframe 대신 `/api/wiki-pages`에서 찾은 문서의 본문 HTML만 렌더링하도록 변경.
- 검색 답변과 가이드 본문 스크롤은 extension 전용 얇은 scrollbar 스타일로 조정.
- 검색 화면 복귀 화살표를 가이드 화면의 상단 왼쪽 끝으로 이동.
- 검색 답변은 단일 결과 교체가 아니라 side panel 세션 안에서 chat turn으로 누적되도록 변경. side panel을 닫거나 새로고침하면 초기화됨.
- 질문 말풍선과 답변/참고문서/입력 영역 typography를 더 작고 촘촘하게 조정해 좁은 side panel에서 줄바꿈을 줄임.
- 동일 제목 source 중 `/guides/...` 링크를 우선해 참고 문서 링크가 slide-in guide view로 열리도록 복구.
- launcher hover 액션 배치를 위는 home, 아래는 settings로 정렬.
- launcher를 Shadow DOM으로 전환해 일반 웹사이트 CSS가 버튼/아이콘/옵션 팝업 스타일을 깨지 않도록 격리.
- 메인 책 버튼 pointer drag를 복구하고, 세로 이동 위치를 `chrome.storage.local`에 저장하도록 변경.
- 옵션의 상단/하단 이동은 새로고침 없이 즉시 위치를 바꾸고 저장하도록 변경.
- 플로팅 launcher의 흰 배경 패널을 제거하고 아이콘만 투명하게 노출되도록 단순화.
- hover/expanded/drag 상태에서 home/settings와 메인 아이콘 투명도를 낮춰 페이지 콘텐츠를 덜 가리도록 조정.
- launcher 확장 모델을 수정해 메인 아이콘은 항상 100% opacity로 유지하고, hover 시 home/settings 아이콘만 뒤에서 위/아래로 slide-out되도록 변경.
- side panel 닫기 요청이 브라우저 API에서 실패하면 닫힘 상태를 storage에 저장하지 않도록 보정.
- 직전 launcher CSS 회귀를 수정:
  - settings popover가 초기 로드부터 떠 있던 문제 제거
  - popover 버튼에 launcher absolute positioning이 새는 문제 제거
  - 책 아이콘 크기를 다시 크게 표시
  - 숨김 상태에서도 새로고침 후 오른쪽 핸들이 보이도록 조정
- unpacked extension을 새로고침한 뒤 기존 탭에 남아 있던 stale content script가 `Extension context invalidated`를 던지는 문제를 완화:
  - content script startup과 launcher action에서 invalidated context 예외를 잡아 uncaught rejection으로 남지 않도록 보정
  - stale launcher는 자동 teardown 처리
  - 다만 브라우저 탭 자체는 새 확장 context를 쓰기 위해 한 번 새로고침이 필요
- 숨김 기능 추가 후 메인 런처 아이콘까지 화면 밖으로 밀려 기능이 죽은 것처럼 보이던 회귀를 수정:
  - hidden 상태에서도 메인 책 아이콘은 그대로 보이고 클릭 가능
  - hidden 상태는 home/settings 보조 아이콘만 막도록 단순화
- 런처 열기/닫기 토글이 extension storage의 `sfoodWikiSidebar.panelOpen` 값에 종속되던 문제를 수정:
  - 메인 런처 클릭은 저장값을 읽지 않고 background에 `toggle` 요청만 보냄
  - background service worker가 탭 단위 메모리 상태로 open/close 방향을 결정
  - 기존 `panelOpen` 저장 키는 startup에서 제거되어 더 이상 동작을 좌우하지 않음
- side panel open/close 호환성 경로를 보강:
  - open 전 현재 탭을 `setOptions(... enabled: true)`로 다시 활성화
  - global side panel 닫기는 `windowId` 기준 `close()`를 우선 사용
  - `close()`가 없는 브라우저에서는 `setOptions({ tabId, enabled: false })`로 현재 탭 패널을 숨김
- 확장 표시 이름을 `SFOOD AI Wiki`로 변경.
- 로컬 unpacked 설치 및 패키징 가이드를 `apps/edge-sidebar/README.md`에 추가.
- 검증: `pnpm --filter @sfood/edge-sidebar test`, `pnpm --filter @sfood/edge-sidebar typecheck`, `pnpm --filter @sfood/edge-sidebar build`, `pnpm test`, `pnpm typecheck` 통과. MCP Playwright는 로컬 위키 페이지 접속은 확인했으나, MCP 브라우저 context에 unpacked extension이 로드되지 않아 설치 확장 UI의 직접 시각 검증은 사용자 브라우저에서 필요.

### 2026-06-08 — `/guides` 검색 박스 중복 테두리 및 다크모드 버튼 가시성 수정
- `/guides` 리스트에서 검색 입력을 감싸던 바깥 래퍼를 제거해 이중 테두리를 해소.
- 공유 `PromptComposer` 버튼 스타일을 테마 변수 기반으로 바꿔 다크모드에서도 검색 버튼이 사라지지 않도록 수정.
- 검색 입력 영역의 세로 여백을 소폭 조정해 리스트 상단 밀도를 유지.
- 검증: `pnpm --filter @sfood/web test`, `pnpm --filter @sfood/web typecheck` 통과.

### 2026-06-08 — `/guides` 헤더를 아이콘 홈 링크로 정리
- `/guides` 페이지에서 `[추천 가이드]` 괄호 타이틀을 일반 `추천 가이드`로 교체.
- 상단 `홈으로 돌아가기` 텍스트 링크를 오른쪽 정렬 아이콘 링크로 교체하고, 접근성용 `aria-label`/`title`을 유지.
- `CategoryPage` 테스트를 새 레이아웃과 아이콘 링크 기준으로 갱신.
- 검증: `pnpm --filter @sfood/web test -- --run src/ui/pages/CategoryPage.test.tsx`, `pnpm --filter @sfood/web typecheck` 통과.

### 2026-06-08 — guide-like `page` 후보 메타데이터를 `guide`로 재분류
- 조사에서 확인한 강한 guide-like `page` 후보 10개를 Confluence에서 직접 `wiki.metadata.docType=guide`로 변경.
- 대상: `119930898`, `95846431`, `95715380`, `95748126`, `97124360`, `107708613`, `107675805`, `114294785`, `114163769`, `114294946`
- 변경 후 동일 페이지들을 다시 읽어 `docType=guide`로 반영되었음을 확인.
- 이 작업은 Confluence 메타데이터만 수정했고 본문은 변경하지 않음.

### 2026-06-08 — guide-like `page` docType 후보 조사
- Confluence space `63111172`의 current pages 321개를 읽고 `wiki.metadata.docType = page` 문서 중 guide-like 신호를 가진 후보를 조사.
- 제목/본문 구조 기준으로 153개 후보를 추려냈고, 그중 `[Guide]` 접두사와 단계형 본문 구조를 가진 문서들이 추천 가이드/`/guides` 표면에서 누락될 가능성이 높음을 확인.
- 대표 후보로 `119930898` `[Guide] Claude Code vs Codex 도구 비교 및 선택 가이드`, `95846431` `[Guide] Claude Code Checkpointing`, `95715380` `[Guide] Claude Code Sessions`, `107708613` `[Guide] Claude 모델 선택 가이드: Opus, Sonnet, Haiku 비교` 등을 확인.
- 이 작업은 분석-only로 수행했으며 Confluence 메타데이터나 앱 코드는 변경하지 않음.

### 2026-06-08 — 가이드 목차 계층 표시 및 HTML 엔티티 렌더 보정
- 가이드/문서 우측 목차에서 하위 heading이 공백만 보이던 문제를 수정.
  - level 2: `•`
  - level 3: `—`
  - level 4: `·`
  marker와 단계별 padding을 추가해 구조가 한눈에 드러나도록 조정
- Confluence read model에서 HTML entity 처리 보강:
  - `contentHtml`: `&amp;entity;`를 `&entity;`로 한 단계 unescape
  - `summary`, `headings.text`: `&mdash;`, `&nbsp;`, numeric entity 등을 실제 문자로 디코딩
- 검증: `pnpm --filter @sfood/wiki-core test`, `pnpm --filter @sfood/web test`, `pnpm typecheck`, Playwright MCP 시작 가이드 목차 확인 통과.

### 2026-06-08 — 검색 composer 멀티라인 UX 및 홈 밀도 조정
- 홈 검색, 검색 결과 검색, 가이드 목록 검색, 문서 상세 Ask 패널을 공통 `PromptComposer` 기반 multiline textarea로 통일.
- 입력 규칙 통일:
  - plain `Enter` 제출/검색
  - `Shift+Enter` 줄바꿈
  - IME 조합 중 `Enter` submit 방지
- 홈 화면 조정:
  - 검색 폭을 추천 가이드 프레임과 동일한 `max-w-4xl`로 확장
  - 검색 박스 라디우스를 추천 가이드 카드와 동일한 `8px`로 정렬
  - hero 상하 여백과 검색-가이드 간격을 줄여 첫 화면에서 스크롤 없이 함께 보이도록 압축
- 가이드 목록 검색은 `Enter` 확정형으로 바꾸고, 검색 textarea 높이를 키워 긴 질의 입력 가독성을 개선.
- 검증: `pnpm --filter @sfood/web test`, `pnpm typecheck`, Playwright MCP 홈/검색/가이드/문서 상세 확인 통과.

### 2026-06-08 — Rovo 수준 검색 답변 품질을 위한 retrieval 보강
- `claude worktree를 설명하세요.` 같은 페이지-기반 개념 질문에서 broad Claude guide가 직접 대상 페이지를 이기는 문제를 수정.
- 검색 스코어링 보강:
  - 질문어 노이즈 토큰 제거 (`설명하세요`, `알려줘` 등)
  - 영문 단복수 변형 보정 (`worktree` / `worktrees`)
  - 다중 토큰 커버리지 및 title/slug 2-token 매치 보너스 추가
  - concept 질문에서 direct subject coverage가 강한 `page` 문서가 broad guide보다 밀리지 않도록 보정
- Stage 1 query-understanding이 usable keyword를 돌려주지 못할 때, raw 질문 대신 정제된 fallback 검색 쿼리를 사용하도록 수정.
- AI가 보이는 답변에서 "현재 위키에 해당 주제에 대한 페이지가 없습니다"라고 말하면서 `unsupportedClaims`를 비워 두는 경우를 서버/클라이언트가 완전 미지원 응답으로 정규화하도록 수정.
- 검증: `pnpm --filter @sfood/wiki-core test`, `pnpm --filter @sfood/web test`, `pnpm typecheck` 통과. 로컬 dev API 재현에서 `claude worktree를 설명하세요.`가 page `95780877`을 `confluenceData`와 `recommendedDocuments`에 포함해 답변함을 확인.

### 2026-06-04 — 완전 미지원 검색 답변의 페이지 카드 숨김
- AI가 `confluenceData`를 비우고 `unsupportedClaims`를 반환한 완전 미지원 검색 답변에서는 FAQ·추천 페이지·관련 페이지를 모두 숨기도록 수정.
- 서버가 lexical fallback 추천/관련 문서를 붙이지 않도록 했고, 클라이언트도 직접 FAQ 랭킹과 fallback 추천을 추가하지 않도록 이중 방어 적용.
- 부분 지원 답변은 기존 페이지 노출을 유지하도록 회귀 테스트 추가.
- 검증: `pnpm test`, `pnpm typecheck`, Playwright MCP 동일 질의 재현 통과. `claude worktree 에 대해 설명해줘` 결과에서 무관한 페이지 카드가 더 이상 노출되지 않음.

### 2026-05-28 (7) — 자가 개선 프롬프트 시스템
- **자가 개선 루프 구축**: Playbook 누적 데이터 → AI 프롬프트 자동 개선 → 서비스 재배포 없이 반영
  - `promptRulesLoader.ts` 신규: Confluence "Prompt Rules" 페이지 파싱 (`parsePromptRulesFromHtml`, `loadPromptRulesFromConfluence`, `buildInitialPromptRulesPageHtml`)
  - `playbookAnalyzer.ts` 신규: Playbook 일별 테이블에서 "부족" 패턴 집계 (`analyzeRecentPlaybookFailures`, `parsePlaybookRows`, `extractFailurePatterns`)
  - `aiAsk.ts` 수정: `AiSearchPromptContext.dynamicRules` 필드 추가, `buildAiSearchInstructionsForIntent`에 동적 규칙 주입 (`buildDynamicRuleLines` 내부 헬퍼)
  - `vite.config.ts` 수정: `promptRulesCache` + `loadDevPromptRulesCache()` 추가, 검색 핸들러에서 TTL 캐시 기반 동적 규칙 로드
  - Claude schedule 루틴 등록: 매일 20:00 KST, Playbook 7일치 분석 → "Prompt Rules - Search" Confluence 페이지 자동 갱신 (ID: `trig_018dn6jkaABXrxrkHpKhcriL`)
  - 환경 변수 `CONFLUENCE_PROMPT_RULES_PAGE_ID` 추가 (미설정 시 기존 프롬프트로 폴백)
- 검증: `pnpm test` 전체 202개 통과 (신규 20개 포함), `pnpm typecheck` 통과

### 2026-05-22 (6)
- **검색 추천/관련 페이지 랭킹 쿼리 불일치 버그 수정**: `vite.config.ts`에서 `rankingRecommendedDocuments` 계산 시 원래 한국어 질문(`searchQuestion`) 대신 Stage 1 이중언어 키워드(`searchQuery`)를 사용하도록 수정.
  - 원인: Stage 2 컨텍스트 문서 검색은 `searchQuery`를 쓰는데, 추천/관련 페이지 랭킹은 `searchQuestion`을 사용 → "스킬" 토큰이 "skill"로 확장되지 않아 "Claude Code Skills" 같은 영어 제목 페이지가 누락됨
  - 추가 수정: `searchKeywords` 빈 문자열 포함 배열에서 fallback이 누락되는 결함 제거 (Codex Medium 지적)
  - 수정 후: "Claude Code 스킬과 Codex 스킬 차이점" 검색 시 "Claude Code Skills", "Claude Code Jira Skill Setup" 등이 추천/관련 페이지에 포함됨 ✅
- 검증: `pnpm test` 전체 182개 통과, `pnpm typecheck` 통과, Playwright 추천 페이지 확인

### 2026-05-21 (5)
- **docType 노출 규칙 동결 및 `/guides` 목록 복원**: `/guides` 목록에서 `page` docType 문서를 제외하도록 `CategoryPage.tsx` 필터 복원. 이전 세션(2026-05-21 (2))의 "guide + page 모두 표시" 수정은 사용자 의도와 달랐음을 확인하고 되돌림.
  - Surface별 docType 노출 규칙을 `CLAUDE.md`, `ui-spec.md`, `development-rules.md`, `development-prompt-reference.md`에 FROZEN으로 명시
  - 규칙 요약: 홈 추천/`/guides` 목록은 `guide` only. 검색 답변(추천·관련·인라인 링크)은 `guide` + `page` 모두.
  - `CategoryPage.test.tsx` 테스트명 및 검증 항목 복원
- 검증: `pnpm test` 전체 통과, Playwright `/guides` 스냅샷 2개(guide only) 확인

> **NOTE**: 2026-05-21 (2) 항목 "guide + page 모두 표시" 수정은 위에서 superseded됨. 현재 규칙은 guide only.

### 2026-05-21 (4)
- **playbook docType 검증 누락 버그 수정**: `wikiDataSource.ts`의 `readDocType`에 `"playbook"` 추가.
  - 원인: `confluenceClient.ts`에는 `playbook`이 있었으나 `wikiDataSource.ts`에는 누락되어, Confluence API 응답에 playbook 페이지가 포함되면 전체 데이터 로딩 실패
  - 결과: 5173 홈 추천 가이드 4개, /guides 129개, 검색 정상 동작 복구
  - Codex 리뷰 반영: `wikiDataSource.test.ts`에 playbook 파싱/제외 회귀 테스트 추가
- 검증: `pnpm test` 전체 182개 통과, `pnpm typecheck` 통과, Playwright 홈·가이드·검색 확인

### 2026-05-21 (3)
- **홈 추천 가이드 스펙 문서화**: `ui-spec.md`와 `development-prompt-reference.md`에 홈 추천 가이드 정의 추가 및 기존 잘못된 기술 수정.
  - "추가 추천 가이드 5개" → "최대 4개 (guide 부족 시 있는 만큼)"로 수정
  - **Home Recommended Guides Rules** 섹션 신규 추가: 소스(공개 corpus `guide` docType), 필터(온보딩 제외), 정렬(`updatedAt` 내림차순), 개수(최대 4개), 시작 가이드 중복 제거, 총 최대 5개 명시
  - 시작 가이드 매핑 규칙: slug → title 패턴 2가지 → id 순 fallback, `nav` docType 허용, 홈+agent-start 라우트 한정 노출
  - Guide List Rules: `/guides`가 `guide` + `page` docType 모두 표시, `page` 기준 public read model 조건 명시
  - `development-prompt-reference.md`: "5개" → "최대 4개 (동적 선택)", "guide only" → "guide or page" 수정
- 코드 변경 없음; 문서가 실제 코드(`buildFeaturedGuides`, `CategoryPage`)와 일치함을 확인
- Codex 비판 리뷰 반영: 4가지 불일치 항목 모두 수정

### 2026-05-21 (2)
- **`page` docType 가이드 목록 노출 수정**: `/guides` 카테고리가 `guide` docType만 표시하고 `page` docType을 숨기던 버그 수정.
  - `CategoryPage.tsx`: `guide`에게만 intro 필터 적용, `page`는 모두 통과하도록 조건 역전
  - 스냅샷 모드 Playwright 확인: guide 2 + page 3 = 5개 정상 노출, intro 문서 숨김 유지
  - Codex 비판 리뷰 반영: `isIntroGuideDocument`가 `page` 타입에 의도치 않게 적용되는 부작용 제거
- **개발 프로세스 강제화 문서 추가**: 수정 지시 시 항상 ① 태스크 문서 → ② 구현 → ③ 단위 테스트 → ④ Playwright 리뷰 → ⑤ Codex 비판 리뷰 → ⑥ 완료 보고 순서를 `docs/ops/spec-driven-workflow.md`와 `CLAUDE.md`에 명시
- 검증: `pnpm test` 전체 181개 통과 (134 wiki-core + 42 web + 5 serverless), Playwright guides 페이지 확인

### 2026-05-21
- **AI 검색 관련성 판단 개선**: SUBJECT COVERAGE GATE(단일 페이지 필수 텍스트 매칭)를 제거하고 AI 프롬프트 수준의 RELEVANCE CHECK로 교체.
  - Case 1(비교 질문): A 페이지 + B 페이지 조합 허용 — "코덱스와 클로드의 skill 차이" 같은 질문이 두 페이지를 올바르게 조합해 답변 가능
  - Case 2(복합 주제어): 특정 도구+기능은 단일 페이지 커버 요구 — "claude webhook" 질문에 무관한 Jira Setup 페이지 사용 금지
- **intent 분류 개선** (`intentClassifier.ts`):
  - 비교 패턴에 `다르|달라|달리` 추가 — "뭐가 다르지?" 같은 질문이 comparison으로 올바르게 분류
  - 목표 지향적 how-to 패턴 `읽으려면|활용하려면|쓰려면|하려면` 추가 — "Jira 이슈를 읽으려면?" 같은 질문이 setup으로 분류
- **운영 지침 강화** (`CLAUDE.md`, `ai-ask-prompt-guide.md`, `search-flow-contract.md`): AI 동작 수정 시 docs 먼저 확인 의무화, Gate/수동 매핑 금지 패턴 명시, 관련성 판단 위임 원칙 문서화
- 검증: `pnpm test` 전체 171개 통과 (129 wiki-core + 37 web + 5 serverless), Codex 최종 리뷰 합격, 10개 질문 검증 8/10 PASS (나머지 2개는 실제 페이지 존재 여부 확인 필요)

### 2026-05-20
- Increased and separated search typography: search input text now renders at 15px, user questions at 14px, AI answer body/list text at 15px, and markdown answer headings at 17-19px with bold weight.
- Verified the updated computed styles in Playwright and rechecked the web package test/typecheck.
- 검증: `pnpm --filter @sfood/web typecheck` 통과, `pnpm --filter @sfood/web test` 통과, Playwright computed style 확인.

### 2026-05-20
- Fixed policy notice visibility so search and article Ask responses show the policy source links whenever a policy-related response includes sources, even if the model leaves the notice message empty.
- Added a default policy notice message for source-only policy notices and shared the same visibility helper across search and article Ask UI.
- 검증: `pnpm --filter @sfood/web test` 통과, `pnpm --filter @sfood/web typecheck` 통과, `pnpm typecheck` 통과.

### 2026-05-19
- Added a `page-lookup` search answer intent so questions like `mcp 설정페이지가 있지 않아?` answer with whether a matching page was found and link the best/closest page before any topic explanation.
- Updated the AI prompt guide and search flow contract so page/document/guide/link existence questions are treated as lookup/navigation questions, not generic concept or setup explanations.
- 검증: `pnpm --filter @sfood/wiki-core test` 통과, `pnpm --filter @sfood/wiki-core typecheck` 통과, `pnpm typecheck` 통과, `pnpm test` 통과.

### 2026-05-19
- Added source policy links to `policyNotice`: the dev API now enriches policy-related search and page Ask responses with the selected policy context sources, and the UI renders those source pages inside the policy notice box.
- 검증: `pnpm --filter @sfood/web test` 통과, `pnpm --filter @sfood/web typecheck` 통과, `pnpm typecheck` 통과, `pnpm test` 통과.

### 2026-05-19
- Updated inline page links inside structured search/article answers so they render as visible accent-colored badge links by default instead of only becoming obvious on hover.
- 검증: `pnpm --filter @sfood/web typecheck` 통과, `pnpm --filter @sfood/web test` 통과.

### 2026-05-19
- Corrected the previous search-answer simplification that made answers too thin: structured supplemental details are now preserved as same-style natural follow-up paragraphs/lists instead of being dropped.
- Relaxed the search prompt from "empty arrays by default" to "answer must be useful on its own, with supplemental arrays only when they add detail", and explicitly prevents three-line teaser answers.
- 검증: `pnpm --filter @sfood/web test` 통과, `pnpm --filter @sfood/web typecheck` 통과, `pnpm --filter @sfood/wiki-core test` 통과, `pnpm --filter @sfood/wiki-core typecheck` 통과, `pnpm typecheck` 통과, `pnpm test` 통과.

### 2026-05-19
- Removed separately styled search answer support sections from the search page: `immediateActions`, `exampleCommands`, `verificationChecks`, and `cautions` are no longer rendered under the answer.
- Strengthened search prompt rules so the answer body must not create fixed headings such as `바로 할 일`, `예시`, `확인`, `확인 포인트`, `주의`, or `확인 필요`; the answer should stay as short natural paragraphs or a very short list when necessary.
- 검증: `pnpm --filter @sfood/web test` 통과, `pnpm --filter @sfood/web typecheck` 통과, `pnpm --filter @sfood/wiki-core test` 통과, `pnpm --filter @sfood/wiki-core typecheck` 통과, `pnpm typecheck` 통과, `pnpm test` 통과.

### 2026-05-19
- Fixed duplicate search answer support sections: when the answer body already contains visible `바로 할 일`, `확인/확인 포인트`, or `주의` sections, the separately styled structured `immediateActions`, `verificationChecks`, and `cautions` blocks are suppressed.
- Added web regression coverage so ordinary prose mentioning 확인/주의 is not mistaken for a duplicate section.
- 검증: `pnpm --filter @sfood/web test` 통과(10 files / 35 tests), `pnpm --filter @sfood/web typecheck` 통과.

### 2026-05-19
- Adjusted search answer tone/readability rules so explanatory prose uses short vertical paragraphs with blank lines and avoids parenthetical side explanations.
- Updated the AI answer guide and search-flow contract, strengthened `aiAsk.ts` search prompt requirements, and added UI-side paragraph splitting for long single-block chat answers.
- 검증: `pnpm --filter @sfood/wiki-core test` 통과, `pnpm --filter @sfood/web test` 통과, `pnpm --filter @sfood/wiki-core typecheck` 통과, `pnpm --filter @sfood/web typecheck` 통과, `pnpm typecheck` 통과, `pnpm test` 통과.

### 2026-05-19
- Widened the Home recommendation and blueprint support frame from `max-w-3xl` to `max-w-4xl` so those secondary sections have less visible desktop side whitespace while the search box remains unchanged.
- 검증: `pnpm --filter @sfood/web typecheck` 통과, `pnpm --filter @sfood/web test` 통과, Playwright `1280x800`에서 search `672px`, recommendation/blueprint `896px` 확인.

### 2026-05-19
- Changed Playbook search logging from monthly child pages to KST daily child pages named `Playbook - YYYY-MM-DD`.
- Reworked Playbook page content so each daily page keeps a single log table and appends each search as one row instead of creating one table per entry.
- Added regression coverage for daily title creation, new-page table creation, and existing-page row append behavior.
- 검증: `pnpm --filter @sfood/wiki-core test` 통과, `pnpm --filter @sfood/wiki-core typecheck` 통과, `pnpm typecheck` 통과, `pnpm test` 통과.

### 2026-05-19
- Re-centered the Home search hero with wider top/bottom breathing room, narrowed the search box to `max-w-2xl`, kept recommendation/blueprint as `max-w-3xl` support frames, and converted recommendation guides into one `시작 가이드` featured card plus four regular cards.
- 검증: Playwright confirmed `1280x800` search `672px` vs support frames `768px`, a balanced four-card regular guide grid, widened card area `734px`, and no mobile horizontal overflow at `390x844`; `pnpm --filter @sfood/web typecheck` 통과, `pnpm --filter @sfood/web test` 통과(9 files / 31 tests), `pnpm typecheck` 통과.

### 2026-05-19
- Restored the Home search box width to `max-w-3xl` after the guide list compression pass.
- 검증: `pnpm --filter @sfood/web typecheck` 통과.

### 2026-05-19
- Reduced only the Home recommended guide block height so the search block stays untouched while the guide list becomes denser.
- 검증: `pnpm --filter @sfood/web typecheck` 통과, `pnpm --filter @sfood/web test` 통과(9 files / 31 tests).

### 2026-05-19
- Renamed the `/guides` page title to `추천 가이드`, removed the extra guide filters, kept only the integrated search box, hid the guide index map button, and kept the list paginated.
- Centered the Home search block more vertically, tightened the recommended guide block spacing, added icon-led rows, and turned the pinned recommendation into a stronger `추천 가이드` card.
- 검증: `pnpm --filter @sfood/web typecheck` 통과, `pnpm --filter @sfood/web test` 통과(9 files / 31 tests), `pnpm typecheck` 통과.

### 2026-05-19
- Updated `/guides` so it now shows only `metadata.docType === "guide"` documents, excludes intro-style guide pages, paginates long lists, and moves the guide index map to the bottom.
- Added a focused render test to keep the guide-only filter and pagination behavior stable.
- 검증: `pnpm --filter @sfood/web typecheck` 통과, `pnpm --filter @sfood/web test` 통과(9 files / 31 tests), `pnpm typecheck` 통과.

### 2026-05-19
- Increased the Home recommended guide list so it now shows the pinned starting guide plus five additional guides.
- Updated the Home render test to cover the six-item guide list and keep the starting guide at the top.
- 검증: `pnpm --filter @sfood/web typecheck` 통과, `pnpm --filter @sfood/web test` 통과(8 files / 30 tests), `pnpm typecheck` 통과.

### 2026-05-19
- Restored the blueprint CTA below the Home guide list.
- Moved the `사내 지식 위키` label from the Home hero into the centered site header.
- Updated the starting guide link to use the actual dedicated `guides/agent-start` route, with `/guides/start` kept as a compatibility alias.
- 검증: `pnpm --filter @sfood/web typecheck` 통과, `pnpm --filter @sfood/web test` 통과(8 files / 30 tests), `pnpm typecheck` 통과.

### 2026-05-19
- Simplified the Home screen so it now shows the search block first and a single recommended guide section second.
- Removed the visible project examples, FAQ, library, and project design blocks from the Home screen.
- Pinned the starting guide to the top of the recommended guide list and kept the dedicated start route resilient by resolving the guide document through slug/title/id fallback.
- 검증: `pnpm --filter @sfood/web typecheck` 통과, `pnpm --filter @sfood/web test` 통과(7 files / 29 tests), `pnpm typecheck` 통과.

### 2026-05-19
- Fixed the Home guides tab "전체 보기" route so `/guides` renders the full guide category list again instead of the fixed starting guide document.
- Moved the fixed starting guide article view to `/guides/start` and updated the Home starting guide card to use that dedicated route.
- 검증: `pnpm --filter @sfood/web typecheck` 통과, `pnpm --filter @sfood/web test` 통과(6 files / 28 tests), `pnpm typecheck` 통과.

### 2026-05-12
- docType 분류 체계를 12개 타입에서 5개 타입(`nav`, `guide`, `page`, `policy`, `ops`)으로 교체.
- 타입 정의: `RawConfluencePage`, `WikiDocument` 모두 5-type union으로 변경.
- 검색 스코어링: `isIndexWikiDocument`(nav 단일 체크), `getSearchDocTypeAffinity`(guide/page 모드별 가중치) 재작성, `rankSearchDocumentsIn`에 ops 사전 필터 추가.
- UI 필터: `CategoryPage`의 `HIDDEN_DOC_TYPES`, `searchRecommendations` policy 필터, `ArticleAskPanel` nav/ops 조기 반환, `vite.config` API 핸들러 slug 패턴 제거 → docType 기반 필터.
- 데이터 소스: `confluenceClient.ts`(`readDocType`, `resolveCategory`, `inferMetadataFromTitle`), `wikiDataSource.ts`(`readDocType`) 업데이트.
- `confluenceSnapshots.ts` 스냅샷 픽스처 전체 신규 타입으로 매핑.
- `WikiDocumentListItem.DOC_TYPE_LABELS` 5개 타입 레이블 업데이트.
- 모든 테스트 파일의 mock/fixture docType 값 갱신(confluenceClient, wikiDataSource, wikiDocuments, guideIndexGraph, GuideIndexGraphPage, wikiPagesHandler).
- 검증: `pnpm typecheck` 전체 통과, `pnpm test` 전체 통과(81/81: wiki-core 48, web 28, serverless 5).

### 2026-05-12
- GitHub 프로젝트 README 상세 페이지 구현.
- `GitHubProject`에 `readmeMarkdown` 필드 추가 (10,000자 cap), `fetchRepoReadme`로 통합.
- `ProjectDetailPage` 신규 생성: README 마크다운 렌더링 + GitHub 원본 링크.
- `projects/:slug` 라우트를 `ProjectDetailPage`로 교체.
- `ProjectsPage` 목록 카드를 GitHub 외부 링크 → 내부 `/projects/:slug`로 변경.
- `HomePage` 추천 프로젝트도 내부 링크로 통일.
- 검증: `pnpm typecheck` 통과, `pnpm test` 전체 통과(48/28/5).

### 2026-05-11
- Confluence 메타데이터 fetch 병렬화: `fetchConfluencePageRecords`의 순차 `for...await` 루프를 배치 크기 20의 청크 기반 `Promise.all()`로 교체.
- 130페이지 기준 직렬 130+ API 호출 → 7라운드 병렬로 압축, 초기화 시간 수십 초 → 수 초 수준으로 단축 예상.
- 검증: `pnpm test` 전체 통과(48/28/5), `pnpm typecheck`, `pnpm build` 성공.

### 2026-05-11
- 비개발자 사내 직원 대상 AI 답변 톤 강화: 기술 용어(MCP, CLI, npm 등) 첫 등장 시 괄호 설명 요구 지시, "친구에게 설명하듯" 비개발자 프로필을 검색·아티클 Ask 프롬프트 양쪽에 추가.
- `docs/prd/ai-ask-prompt-guide.md`에 사용자 프로필 섹션 신설.
- 추천/관련 페이지 분리 개선: 서버에서 AI 직접 선택 페이지를 `recommendedDocuments`(max 4), 랭킹 기반 나머지를 `relatedDocuments`(max 4)로 분리 반환.
- `resolveSearchDocumentSections` 업데이트: server-provided `relatedDocuments` 우선 사용, 없으면 기존 방식 하위 호환.
- 빈 검색어 UX 추가: `/search` 직접 접근 시 입력 안내 힌트, 빈 폼 제출 시 2.5초 시각적 힌트 표시.
- 관련 테스트(aiAsk, searchRecommendations) 업데이트 및 신규 추가.
- 검증: `pnpm test` 전체 통과(48/28/5), `pnpm typecheck`, `pnpm build` 성공.

### 2026-05-11
- Softened the search answer structure so `바로 할 일`, `예시`, `확인`, `주의`, and `확인 필요` are now optional helpers instead of a mandatory template.
- Updated the search prompt and PRD guidance so natural prose is the default and section headings only appear when they materially help the reader.
- Revalidated the prompt helper tests and workspace typecheck after updating the tone contract.

### 2026-05-11
- Rewrote the search and AI Ask prompt instructions so answers now speak in a friendlier, blog-like explanatory tone for 초·중급 AI 바이브코딩 users.
- Kept the recommendation ordering and answer structure intact while making the opening explanation more teaching-oriented.
- Added prompt-level regression coverage for the new tone language and fixed the web document type label map that typecheck exposed.

### 2026-05-07
- Reworked the search recommendation section so multiple strong pages can stay in `추천 페이지` in strongest-first order instead of forcing everything except the first card into `관련 페이지`.
- Updated the search prompt guide and contract to treat index/overview family pages as a multi-card recommendation path, with the family entry page first and strong follow-up pages next.
- Verified in Playwright that the cached `mcp가 뭐지?` result now renders three recommendation cards and three related cards, while the mobile overflow fix stays in place and the search/recommendation tests plus workspace typecheck still pass.

### 2026-05-07
- Fixed the search result page overflow regression by constraining answer sections and code-frame components with `min-width: 0` / `max-width: 100%`.
- Confirmed the mobile `/search?q=mcp가 뭐지?` viewport no longer grows wider than the screen after the code example is rendered.

### 2026-05-07
- Verified the live `/search?q=mcp가 뭐지?` browser path and confirmed the visible answer starts cleanly without raw JSON or prefix labels.
- Confirmed the recommendation sections render after the answer while keeping the visible schema keys hidden.

### 2026-05-07
- Reworked search recommendation selection so AI-recommended pages now stay first and generic fallback pages only fill the list when the model omits page links.
- Removed evidence-page mixing from the visible recommendation list and revalidated the search recommendation tests plus full workspace typecheck.

### 2026-05-07
- Removed the concept-question shortcut from `getIndexFirstSearchWikiDocumentsIn` so search candidate selection now keeps the documented index-first expansion path active for every question family.
- Added regression coverage for index-seeded concept searches and revalidated the wiki-core ranking suite plus typecheck.

### 2026-05-07
- Reconciled the search answer cleanup path so visible prefixes like `짧답:` and embedded JSON wrappers are stripped before rendering.
- Centralized answer normalization across the search parser and structured answer renderer so the visible surface no longer depends on a single UI-only cleanup pass.

### 2026-05-07
- Reworked the guide index map from stacked cards into an Obsidian-style graph board with node circles, connecting lines, and a filterable network view.
- Centered the graph board inside a bounded width and moved page labels below the circles so the graph itself is easier to read.
- Replaced the large support sections with a compact numeric dashboard below the board so the page stays graph-first.

### 2026-05-07
- Added a guide index graph view route that reuses the cached guide corpus to inspect index, child, prerequisite, next, related, orphan, and broken-link structure from a single page.
- Added a guides-category entry link to the new graph view so the structure map is reachable from the app.
- Added helper and page tests for graph grouping and empty-state rendering, then revalidated the web test suite and workspace typecheck.

### 2026-05-07
- Updated the search contract to make index-first candidate selection, guide keyword hints, score tuning, and memory cache invalidation rules explicit.
- Updated the AI prompt guide so search answers now explicitly follow the index-page expansion path before reading detailed pages.

### 2026-05-07
- Removed `ops` document input from AI prompt construction so AI answer generation now uses policy documents only.
- Removed the `ops` prompt payload from the Vite dev API and kept the policy context smaller for faster prompt assembly.

### 2026-05-07
- Strengthened the search contract so it now states the search candidate exclusion rules, including onboarding Q&A pages and the public-only corpus boundary.

### 2026-05-07
- Made the onboarding exclusion explicit in the data spec and AI prompt guide so the read model and prompt rules both state that `s*-***` Q&A pages are not fetched.

### 2026-05-07
- Added a Korean AI answer guideline document so prompt edits now start from a markdown reference instead of only the source file.
- Added a code breadcrumb in `aiAsk.ts` so future prompt changes are nudged to check the guideline first.
- Updated the PRD reading order to include the new AI prompt guide alongside the search-flow contract.

### 2026-05-07
- Reconciled the PRD definition docs with the current implementation so the stable Home, API, data, and search contracts are now reflected outside the progress ledger.
- Locked the current search-flow contract to the answer-first, no-evidence-quote, representative-page-above-related-page behavior used by the app.
- Updated the API and data specs to match the current runtime endpoints, hidden policy targets, and visible-public-page filters.

### 2026-05-06
- Added a query-profile-aware search ranking layer that distinguishes concept, setup, troubleshooting, comparison, planning, and general questions instead of treating `mcp` as a single setup trigger.
- Added doc-type-aware ranking boosts and penalties so broad overview pages can outrank tool-specific setup pages on conceptual questions.
- Tightened index-page expansion so generic guide index tokens no longer leak unrelated pages into the same search family.
- Added regression coverage showing that `mcp가 뭐지?` should prefer a broad overview page over tool-specific setup pages and that planning questions should not be misclassified as setup.
- Revalidated the wiki-core and web test suites after the ranking change.
- Confirmed the live dev API still needs a fresh server/cached-response check before shipping because the running local search endpoint can keep returning earlier cached answers until the process is restarted.

### 2026-05-06
- Verified the `guide-codex-cli-setup` page with Playwright MCP: the guide now shows one visible code frame for the command line, no separate related-page section under the article body, and TOC active highlighting stays in sync on click and at the bottom of the page.
- Fixed Confluence code macro rendering so the guide page now extracts command text from the stored CDATA/comment payload and no longer renders empty `bash` code frames.
- Rechecked the guide page with Playwright MCP and confirmed the `Guide Node.js Setup`, `Guide npm Setup`, and `Guide npx Setup` entries resolve to local wiki links.
- Removed the visible active-selection highlight from the guide-page table of contents so the list behaves as plain navigation without a confusing selected state.
- Removed the separate related-page block from guide/article pages, tightened TOC click behavior so the active heading updates immediately, and made guide callouts recurse through nested content so internal links and code blocks inside panels stay structured.
- Changed guide-page anchor handling so internal Confluence links resolve to local wiki detail routes when possible and otherwise stay inside the wiki app through a local search route rather than exposing raw external URLs.
- Simplified the shared wiki callout component to a Confluence-style bordered panel without the previous icon rail, and unified example commands into one combined shell code frame.
- Extended guide-link resolution and collection to use the same anchor-matching fallback path for local wiki navigation, and moved guide TOC highlighting to a scroll-plus-hash sync model.
- Consolidated code and callout rendering into shared `WikiCodeBlock` and `WikiCallout` components so the search answer surface and guide/article pages use one visual system.
- Strengthened guide-page link resolution with `data-linked-resource-id`, `data-linked-resource-title`, anchor-text, and slug/title fallback matching.
- Fixed the sticky guide TOC so clicking a heading updates the active highlight immediately and hash changes remain in sync.
- Added a unit test for the guide-link resolution path using the `Guide Node.js Setup` example and revalidated the web package plus the workspace.
- Reworked the search and guide rendering surfaces so code blocks now use a plain frame with only a top-right copy button, guide/recommendation cards no longer show `페이지 열기`, and the article link-badge pseudo-label was removed.
- Hardened Confluence-to-wiki link conversion with title/slug fallback matching so embedded guide links are more likely to resolve to local detail routes.
- Converted the search `주의` section into a visible warning callout so caution text does not disappear into a plain list item.
- Revalidated the updated search and guide pages with the web typecheck, workspace typecheck, targeted tests, and a repo-wide scan for removed UI labels.
- Reordered the search result surface so the representative guide card now comes after the support detail sections and before the related-page grid, matching the frozen contract.
- Fixed the article page hook placement so the guide view always evaluates hooks unconditionally before early returns.
- Froze the search and guide-page behavior into a canonical PRD contract so future changes must align with a stable source of truth before code is touched.
- Added the contract review gate to the development plan and recorded that no future search or guide-page change should be coded before the contract is checked.

### 2026-05-06
- Started Phase 1 search completion work for policy-targeting and response-contract cleanup.
- Made policy participation explicit in both AI answer schemas with a visible `policyNotice` field for search and page `AI Ask`.
- Kept policy pages hidden from visible search results while recording that they are part of the hidden Confluence answer-generation target set.
- Removed the duplicated search response field `guideDocuments` and kept `recommendedDocuments` as the single visible recommendation list.
- Verified targeted tests and workspace typecheck after the contract and UI updates.
- Hardened search response parsing so leaked schema-like sections can still recover `policyNotice`, evidence, and recommendations from malformed mixed-format model output.
- Confirmed that parser recovery is now stronger, but the Claude CLI install query can still return a one-line answer, which leaves a separate generation-quality gap open.
- Reworked the search AI contract so actionable results return structured fields for immediate actions, example commands, verification checks, and cautions.
- Confirmed the reproduced Claude CLI install query now returns a detailed actionable result plus bottom guide links instead of relying on a single freeform paragraph.
- Extended actionable search answer items with per-item related page ids and rendered answer evidence plus item-level wiki links directly in the search result surface.
- Confirmed the same live local query now returns structured `relatedPageIds`, but prerequisite environment guides are still missing from the retrieved public Confluence candidate set.
- Reworked the user-facing search flow again so the representative guide card appears after the support detail sections and before the related-page grid, with page-entry cards shown without summaries.
- Removed visible evidence-quote rendering from the search screen and added clearer article code/callout rendering plus bottom related-page navigation on article pages.
- Refined the visible wording and document rendering again: `추천 페이지` / `관련 페이지` labels now match the intended meaning, prefix-like lead-ins such as `짧답:` and `가장 짧게:` are stripped from the visible answer, Confluence internal links now rewrite to wiki detail routes, article summary/title duplication was reduced, and the sticky TOC now highlights the active section.

### 2026-05-06
- Added a dedicated analysis task workspace for the main search, page `AI Ask`, hidden policy context, and Home-page page-linking roadmap.
- Confirmed the current search retrieval path is deterministic lexical scoring with heuristic index expansion, not a verified semantic retrieval stack.
- Confirmed hidden `policy` pages are injected into both AI answer flows, but policy impact is not yet proven with dedicated benchmark cases.
- Confirmed the Home screen still uses static `HOME_CONTENT` lists and does not yet resolve featured sections to concrete wiki pages.
- Defined the next staged roadmap: baseline/contract cleanup, retrieval hardening, policy-grounding verification, wiki-like result UI, then Home-page data wiring.

### 2026-04-28
- Created monorepo scaffold with `apps/web` and `packages/wiki-core`.
- Added React/Vite/Tailwind/TypeScript/React Router stack.
- Implemented Home MVP screen with:
  - theme selector
  - hero search block
  - four main entry cards
  - featured guides list
  - featured projects list
  - project design CTA
- Added placeholder routes for guides, projects, library, FAQ, search, and project design.
- Added shared Home content policy validation in `packages/wiki-core`.
- Verified `pnpm install`, `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-28
- Added shared `WikiDocument` read model in `packages/wiki-core`.
- Added lightweight Confluence normalization helpers for sanitization and heading extraction.
- Replaced placeholder category pages with document-backed category pages.
- Added article detail routes for guides, projects, library, and FAQ.
- Updated search to query shared read-only documents instead of hard-coded strings.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-28
- Replaced direct document fixtures with Confluence-shaped raw snapshot fixtures.
- Routed shared wiki documents through the normalization layer instead of hand-authored final models.
- Exposed source snapshot links in article pages to make the current data lineage visible.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-28
- Realigned the Home screen styling to match the `Development Prompt` prototype more closely.
- Replaced the editorial header with a compact brand-and-theme top area.
- Removed the bottom policy-check block from the user-facing Home screen.
- Added a shared wiki data source layer that can load from either local snapshots or a remote endpoint.
- Switched category, article, and search pages to read through the shared async wiki source provider.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-28
- Reduced the main UI typography into a shared three-level scale for hero, section, and body text.
- Standardized page, panel, and section spacing through shared CSS component classes.
- Applied the same visual rhythm to Home, category, article, search, project-design, and loading/error states.
- Changed search results from static text rows to direct document links.
- Rechecked the `Development Prompt` source and removed the mistaken header navigation interpretation.
- Reworked the search page into grouped result sections for guides, projects, FAQ, and library.
- Corrected the Home lower-section typography, link-row interaction, and project-design CTA contrast.
- Added article-level relation panels for prerequisites, next documents, and related documents.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-29
- Promoted the Home top area into a shared site-wide GNB with active section links and theme control.
- Applied the same GNB to internal pages through `AppLayout`.
- Improved category list cards with guide order cues and lightweight metadata chips.
- Reworked the shared GNB into a normal in-flow site header with site name, user info, utility area, and theme control.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-29
- Refined the shared site header so the Home top area reads as a compact header rather than a large top section.
- Removed duplicate/non-actionable header elements: user/environment block, disabled settings control, and secondary brand helper text.
- Kept the Home search area in its existing position while reducing competing card and CTA typography.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-29
- Realigned the Home page to `docs/prd/sfood_wiki_home.jsx`.
- Replaced the separate stacked panel layout with a prototype-style shell and single rounded surface containing header and Home content.
- Rebuilt Home hero, entry cards, list panels, and project-design CTA with shared CSS component classes.
- Simplified the shared header to the prototype density with brand and theme control, while keeping Home route entry through the four cards.
- Verified `pnpm typecheck`, `pnpm test`, and `pnpm build`.

### 2026-04-29
- Hardened the remote wiki source boundary with payload shape validation, fixed space guard `63111172`, and public/current filtering.
- Kept the existing category, article, and search page contracts unchanged by normalizing remote records into the shared `WikiDocument[]` model.
- Updated the web provider to prefer `VITE_WIKI_REMOTE_ENDPOINT` and use generic user-facing load errors.
- Documented remote source runtime env usage in `README.md`.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-29
- Added a Confluence Cloud REST v2 read adapter backed by the env shape in `apps/web/.env.example`.
- Added Vite dev endpoint `GET /api/wiki-pages` so Atlassian credentials stay server-side during local development.
- Local dev now auto-selects `/api/wiki-pages` when `ATLASSIAN_SITE_NAME`, `ATLASSIAN_USER_EMAIL`, `ATLASSIAN_API_TOKEN`, and `CONFLUENCE_SPACE_ID` are configured.
- Verified live Confluence authentication and page listing for space `63111172`.
- Found that the sampled Confluence page properties are empty, so visible remote records remain blocked until `wiki.metadata` content properties are added.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-29
- Verified `.env.local` Confluence settings against space `63111172` (`AI Agent Wiki`) without exposing secret values.
- Inspected current Confluence pages and confirmed no existing `wiki.metadata` content properties were present before the update.
- Added or reconciled `wiki.metadata` content properties across all 130 current Confluence pages, using valid `docType`, `visibility`, `audience`, `status`, `prerequisites`, `next`, and `related` fields.
- Final Confluence metadata coverage: 130 with metadata, 0 missing, 96 public, 34 internal, 19 ops.
- Kept Ops, PRD, analysis, API spec, data model, architecture, migration, and development prompt pages non-public unless separately classified as public content.
- Deferred `/api/wiki-pages` and app read-path validation to a separate development/API session.

### 2026-04-29
- Verified `/api/wiki-pages` returning 130 live Confluence-backed records.
- Confirmed live remote data renders in category, article, and search routes.
- Allowed empty Confluence body HTML for valid index/navigation pages.
- Tightened remote visibility to `current`, `public`, `published`, and non-`ops` records.
- Removed user-facing implementation labels from search and article source UI and added a favicon data URL.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-29
- Added `packages/serverless` with a Lambda-compatible `wikiPagesHandler` for the production equivalent of the local Vite `/api/wiki-pages` endpoint.
- Reused the shared Confluence adapter and `{ pages }` remote source contract from `wiki-core`.
- Added CORS/preflight handling, method rejection, missing-env errors, and upstream failure mapping.
- Documented production endpoint env and `VITE_WIKI_REMOTE_ENDPOINT` wiring in `README.md`.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-29
- Stopped AWS/deployment work and continued with local-only browsing UX improvements.
- Added a shared document list item component for category and search result cards.
- Added category page list search, audience filter, document type filter, sort control, and result counts.
- Updated search results to show grouped counts and suppress empty groups before useful results.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-29
- Reworked the shared visual density toward a conventional wiki/documentation surface.
- Reduced page and Home typography scale, section padding, card padding, and oversized rounded corners.
- Replaced pill-like metadata treatment with compact rectangular chips.
- Kept the Home search position intact while making surrounding sections less landing-page-like.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-29
- Replaced the text-based theme segmented control with compact icon buttons.
- Further reduced shared title and Home card typography for a denser wiki reading surface.
- Added article HTML block rendering for headings, paragraphs, lists, code blocks, tables, quotes, and fallback fragments.
- Removed direct article body `dangerouslySetInnerHTML` usage from `ArticlePage` in favor of the block renderer boundary.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-29
- Converted the article table of contents into a sticky side navigation so it remains useful while reading long documents.
- Reworked article relation links into a single `문서 흐름` graph block for prerequisites, next documents, and related documents.
- Moved Phase 5 Metadata and Graph to In Progress with the first visible graph UX pass.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-30
- Unified form/control typography so search inputs and select controls inherit the same body font scale.
- Limited remote-readable Confluence pages to guides, FAQ, and the `Playbook` page.
- Propagated Confluence `parentId` into the read model and added graph reference validation helpers.
- Added a local read-only AI Ask endpoint using OpenAI Responses API structured output.
- Added an article Ask panel that renders AI answer, Confluence evidence, unsupported claims, and suggested documents.
- Verified actual Confluence `/api/wiki-pages`: 78 records, only `faq` and `guides`, `Playbook` included, 0 records outside allowed scope.
- Verified actual Confluence `Playbook` AI Ask call returned the required structured response shape.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-30
- Fixed natural-language search misses by scoring title, summary, headings, and body HTML tokens instead of requiring an exact full-query substring.
- Added a search follow-up Ask panel so users can continue the query against the most relevant matched document.
- Verified the query `윈도우에서 gpt에 파일 시스템 mcp 어떻게 설정해?` against actual Confluence data and confirmed top matches are returned.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-30
- Reworked the search page into a chatbot-style result screen with only the shared top navigation above the content.
- Added `/api/wiki/ai/search` to analyze the top Confluence search results with OpenAI structured output.
- Changed search UI to show the user question, a natural-language AI answer, a compact guide-document summary, Confluence evidence, and unsupported claims.
- Removed the previous grouped result sections and follow-up wording from the search page.
- Verified the same real Confluence query returned an AI answer, 6 guide links, 3 evidence items, and structured unsupported claims.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-30
- Added in-memory caching for visible Confluence records/documents in the local dev API.
- Added in-memory caching for repeated AI search answers by normalized question.
- Reduced AI search latency by limiting top search context, trimming document text, setting an output token cap, and lowering reasoning effort.
- Added chatbot loading feedback with spinner, progress bar, and status text.
- Improved AI answer readability by rendering paragraphs and bullet/numbered lists as structured UI blocks.
- Cleared the floating search input after submit and replaced the text submit button with an icon button.
- Verified repeated actual AI search calls returned cached responses faster in the active dev session.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-30
- Expanded the remote readable/searchable policy to guides, projects, FAQ, and the `Playbook` page.
- Excluded onboarding pages from the remote page cache before search and AI answer generation.
- Changed search recommendations so the answer can show project and FAQ matches as well as guide matches.
- Verified actual Confluence `/api/wiki-pages`: 82 records, categories `faq`, `guides`, and `projects`, `Playbook` included, 0 records outside allowed scope, and 0 onboarding records.
- Verified actual category counts: `faq: 7`, `guides: 69`, and `projects: 6`.
- Verified actual AI search repeated-call cache: first call 42ms and second call 3ms in the active dev session.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-30
- Found that onboarding Q&A pages such as `s3-003` were still entering search because they were categorized as `guides` and did not include `onboarding` in title or slug.
- Excluded onboarding Q&A pages matching the `s*-***` title/slug pattern from the remote page cache.
- Restarted the local dev server to clear in-memory Confluence and AI search caches.
- Verified actual Confluence `/api/wiki-pages`: 67 records, `s3-003` count 0, onboarding Q&A count 0, and onboarding title/slug count 0.
- Verified actual AI search for `윈도우에서 gpt에 파일 시스템 mcp 어떻게 설정해?` no longer returns `s3-003` or onboarding references.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-30
- Changed search result recommendation links to internal wiki detail routes instead of Confluence source URLs.
- Removed the visible search evidence section from the chatbot-style search result screen.
- Removed the article page source-document link from the wiki detail header.
- Added AI-selected `recommendedPages` to the search response so displayed recommendations are chosen from the AI-grounded result set rather than raw token rank alone.
- Tightened AI search answer instructions so prose is the default, lists are used only for list-shaped content, and missing exact-target coverage is stated before related setup guidance.
- Verified actual AI search for `윈도우에서 gpt에 파일 시스템 mcp 어떻게 설정해?`: no `s3-003`, no onboarding references, internal-only recommendation hrefs, no source URLs, prose-first answer, and exact-target gap stated first.
- Verified `pnpm typecheck` and `pnpm build`.

### 2026-04-30
- Changed search candidate selection to score matching Confluence index pages first, then expand into detailed documents for AI search context and recommendations.
- Kept index pages out of recommended search results by using them as routing candidates rather than answer documents.
- Added a hidden `ops` policy cache path for Confluence `docType: ops` pages; these pages remain excluded from `/api/wiki-pages`, search results, and recommendations.
- Added AI search prompt context for hidden ops policy documents with instructions not to cite, summarize, recommend, or expose them.
- Verified actual local API search: 67 visible pages, 0 exposed `ops` pages, and no index/ops/sourceUrl values in recommended AI search documents.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-30
- Changed search result document links to open internal wiki detail pages in a new tab so the active search page does not disappear.
- Removed the secondary explanatory copy below the search loading progress bar.
- Changed the search page to keep previous question/answer turns in the current session when the user submits another search.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-30
- Normalized search input placeholder, user question, assistant answer, loading text, and search summary typography to the compact shared `13px` UI scale.
- Added explicit spacing between each search question and answer turn so chatbot results stay readable.
- Restarted the local dev server on `http://127.0.0.1:5173/`.
- Verified `pnpm typecheck` and `pnpm build`.

### 2026-04-30
- Reworked article AI Ask into a fixed bottom conversation dock so document content and generated answers remain visible together.
- Changed article AI Ask submit to an icon-only control and kept previous question/answer turns in the current document session.
- Rendered article AI Ask answers as structured paragraphs/lists and opened recommended internal wiki documents in a new tab.
- Fixed article table-of-contents anchors by applying normalized heading ids to rendered Confluence heading blocks.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-04-30
- Removed explanatory helper copy from the search empty state, search loading state, article AI Ask header, article AI Ask loading state, and document graph header.
- Verified the removed helper phrases no longer appear in app source.

### 2026-05-04
- Preserved search candidate relevance order instead of flattening by category.
- Removed prior AI answer prose from follow-up search query rewriting.
- Narrowed index-first expansion to linked or directly relevant detail pages instead of broad same-category fallbacks.
- Added richer wiki-style answer rendering for inline links, markdown tables, info/warning callouts, and collapsible code blocks.
- Added a visible document-based answer header to the search result screen.
- Verified `pnpm --filter @sfood/wiki-core test -- src/lib/wikiDocuments.test.ts src/lib/aiAsk.test.ts`, `pnpm --filter @sfood/web test -- src/ui/structuredAnswer.test.ts`, `pnpm typecheck`, `pnpm build`, and `pnpm test`.
- Started the local dev server successfully at `http://localhost:5173/`.
- Added staged loading text to the search flow so users can see the current search step instead of only a spinner.
- Strengthened setup/how-to answer prompts so search answers are pushed toward executable blocks rather than one-line summaries.
- Kept the shared markdown-style answer renderer in place so headings, lists, quotes, and code blocks remain readable when the model emits structured output.
- Surfaced the Confluence grounding snippets in search results so users can see which pages supported the answer.
- Renamed the follow-up document section to `추천 페이지` to better match the Confluence-search workflow.
- Removed the `관련 페이지별 요약` instruction from the search prompt so the answer stays focused on synthesis from the retrieved Confluence pages.
- Added a shared structured-answer renderer with copyable code blocks and heading-level styling.
- Changed recommendation ordering so answer-used pages appear ahead of generic fallback matches.
- Normalized JSON-shaped assistant answer payloads so the visible answer body no longer leaks raw schema text.
- Removed the synthetic `핵심` fallback heading and instead pushed the model toward fuller explanatory answers.
- Converted `recommendedPages` to visible `recommendedDocuments` on the search response and removed the raw page-id array from the user-facing payload.
- Normalized the search API cache and server-side answer extraction so stale JSON-shaped answer artifacts no longer leak into the rendered UI for repeated searches.
- Verified in-browser on `http://localhost:5173/search` that `Windows에서 Codex CLI를 설치하는 최소 절차는?` and `윈도우에 codex를 설치하는 방법은?` render without raw JSON leakage and show the structured answer header, warning callout, and recommendation links.
- Hid the visible `핵심 인용` and `지원되지 않는 항목` sections from the search answer surface so those details remain internal to answer generation.
- Adjusted the search answer guidance so relevant wiki page links can appear inline in the answer body when a document directly supports a step or detail, while the detailed page still opens in a new tab.
- Promoted standalone terminal commands in search answers into copyable code blocks so install steps like `npm install -g @openai/codex` are easier to reuse.
- Removed the extra answer explanation header section from the search result screen and tightened the code block component toward a compact GitHub/Notion-style card with improved line-number alignment.
- Removed the visible `문서 근거` section from search results so only the answer body and clickable recommendations remain on screen.
- Verified `pnpm typecheck` and `pnpm build`.

### 2026-04-30
- Renamed the article `AI Ask` panel to Korean `문서 질문`.
- Reduced article question dock width, max height, padding, and reserved bottom spacing so it aligns more closely with the article layout and no longer leaves excessive space below document flow.
- Verified `pnpm typecheck` and `pnpm build`.

### 2026-04-30
- Removed the article document-flow section because the feature identity was not yet defined.
- Moved the article question panel from viewport-fixed placement into the article panel as full-width sticky bottom content, eliminating the remaining gap below the article body and aligning it with the document width.
- Verified no article graph references remain in the web source.
- Verified `pnpm typecheck` and `pnpm build`.

### 2026-04-30
- Explicitly normalized search and article question placeholder font sizing to the shared `13px` input scale.
- Added a draggable top resize handle to the article question component so the answer area can be expanded upward.
- Verified `pnpm typecheck` and `pnpm build`.

### 2026-04-30
- Normalized remaining shared site typography away from broad Tailwind `text-sm`/`text-base`/`text-xl` defaults toward fixed compact pixel sizes.
- Added global form-control and placeholder font-size enforcement so search and article question inputs use the same `13px` UI scale.
- Verified no broad `text-sm`/`text-base`/`text-lg`/`text-xl` utilities remain in `apps/web/src/styles.css`.
- Verified `pnpm typecheck` and `pnpm build`.

### 2026-04-30
- Reworked the article question component back to bottom-fixed positioning.
- Kept the bottom edge anchored during resize so dragging the handle expands the question/answer area upward instead of pushing page content downward.
- Verified `pnpm typecheck` and `pnpm build`.

### 2026-04-30
- Adjusted article question panel width to match the article panel instead of the viewport.
- Verified with Playwright DOM measurement: article question width `698px`, article width `698px`, width delta `0px`, bottom fixed at `12px`, and input/placeholder font size `13px`.
- Deleted Playwright auto-generated snapshot/log artifacts after measurement.

### 2026-04-30
- Changed article question behavior so it starts as a compact 64px input bar and automatically expands to 280px when the user submits a question.
- Added auto-scroll-to-latest behavior for the article question conversation area.
- Verified `pnpm typecheck` and `pnpm build`.

### 2026-04-30
- Removed the separate article question resize handle element.
- Made the top border area of the article question panel itself act as the height resize handle so resizing does not consume layout height or push the input row down.
- Verified `pnpm typecheck` and `pnpm build`.

### 2026-05-04
- Added a hidden `policy` document path to the Confluence read model and kept it out of visible wiki results.
- Built compact policy summary documents with in-memory relevance scoring so Ask flows can reference policy without loading full page bodies into the prompt.
- Threaded selected policy context into both document Ask and search Ask prompt construction while preserving the separate hidden `ops` context path.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-05-04
- Normalized mixed-language search tokens by stripping common Korean particles from query terms.
- Added a small email/setup synonym expansion layer so `gmail`, `mail`, `outlook`, and `m365` style queries can surface the intended setup guides.
- Boosted slug and docType signals in search scoring and added regression tests for mixed-language queries.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-05-04
- Added a mail-intent ranking boost so Gmail and Microsoft 365 setup guides outrank generic MCP setup documents for mail-focused queries.
- Confirmed in-browser search now surfaces the mail setup guides instead of generic MCP docs for `mail을 보내는 mcp는 어떻게 설정해?`.
- Added a conservative metadata fallback so visible guide-style pages without `wiki.metadata` still enter the searchable corpus.
- Confirmed in-browser search now surfaces the Gmail setup page `84705630` and Microsoft 365 setup page `83919146` as recommendations.
- Verified `pnpm test`, `pnpm typecheck`, and `pnpm build`.

### 2026-05-04
- Removed the overly strict search-answer length cap and told the model to use Markdown-style structure for readable answers.
- Added a shared markdown-style answer-block parser so headings, quotes, code blocks, and real step-by-step lists render cleanly in both search and article Ask views.
- Forwarded recent conversation history through search and Ask requests so follow-up questions reuse the previous context.
- Tuned the answer prompt toward practical, action-first guidance so setup questions read like instructions instead of summaries.
- Verified `pnpm --filter @sfood/web test`, `pnpm --filter @sfood/wiki-core test`, `pnpm typecheck`, and `pnpm build`.

### 2026-05-04
- Added a repeatable generic-vs-wiki benchmark script for eight representative questions and recorded a `similarity` score against a 90-point completion target.
- Expanded search retrieval for broad planning questions so the answer context can combine top matches across the corpus instead of staying tied to a single narrow index path.
- Added a typo-aware Gmail/email intent boost so `gamil`-style queries can land on email-related setup guides instead of generic MCP pages.
- Latest benchmark result reached `79.5 / 100` average wiki similarity, which is improved but still below the requested `90 / 100` threshold.
- Verified `pnpm benchmark:search` after the prompt and retrieval tuning.

## Current Working State
- The project is inside Phase 2.
- `wiki.metadata` content properties have been added to every current Confluence page in space `63111172`.
- Public visibility is currently further narrowed by application policy to guide, project, FAQ, and `Playbook` pages, with onboarding pages excluded.
- `/api/wiki-pages` now returns live Confluence-backed guide/project/FAQ/Playbook records and category/article/search routes render from remote data.
- A production serverless handler equivalent to the Vite dev middleware exists in `packages/serverless`, but AWS/deployment work is paused by request.
- The latest local browsing UX pass is complete for category/search result scanning.
- The latest design pass reduces oversized fonts, spacing, and rounded section styling across Home, category, search, and article surfaces.
- Article body rendering now has a first block/component boundary for Confluence HTML.
- Article pages now have sticky table-of-contents navigation.
- Article pages now include a fixed bottom read-only AI Ask conversation panel backed by structured OpenAI responses.
- Search now checks matching index pages before expanding into detailed body-token matches.
- Search results now render as a chatbot-style answer page with recommended document links opening internal wiki detail routes.
- Search result links now open in a new tab and the current search session keeps previous turns while submitting follow-up searches.
- Confluence `ops` pages are cached as hidden policy context for AI search but are not exposed as visible wiki records.
- Confluence `policy` pages are cached as hidden policy context and are selected through compact prompt summaries before AI answer generation.
- Local search now caches Confluence and repeated AI search responses and shows progress while waiting.
- The next implementation target is policy-aware AI Ask quality tuning against actual Confluence pages and parent/ancestor breadcrumb refinement.
- The Home screen should follow `docs/prd/sfood_wiki_home.jsx` as the approved visual baseline unless explicitly redesigned.
- The shared header should match the prototype density: compact brand plus theme control inside the app surface.
- The app is buildable and viewable locally with `pnpm dev` or `pnpm preview`.
- Local Confluence env values are now supported through the Vite dev endpoint; production should use the serverless handler with server-side Atlassian env values.

## Resume Checklist For Next Session
1. Read `architecture.md`, `ui-spec.md`, and this file.
2. Keep the no-separate-DB rule intact.
3. Continue from the shared read-only wiki model rather than rebuilding page fixtures locally.
4. Use the existing snapshot/remote source boundary rather than bypassing it.
5. Keep using `/api/wiki-pages` for local remote-mode verification; use `packages/serverless` for the production endpoint path.
6. Do not break the current Home baseline while replacing fixture-backed category/article data.
7. Keep AWS/deployment work paused unless explicitly resumed.
8. Continue with local AI Ask quality tuning against actual Confluence pages before broader feature expansion.

## Rules For Updating This File
- Update the phase table whenever a phase starts or completes.
- Append a dated entry under `Latest Completed Work` after every meaningful implementation step.
- Keep `Current Working State` aligned with the real next step.
