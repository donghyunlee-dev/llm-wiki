# UI Spec

## Primary Source
The first implementation step must follow the Confluence page `83623964` (`Development Prompt`) and its attached prototype file `sfood_wiki_home.jsx`.
The current approved baseline keeps the prototype's compact shell, but the Home header now uses a compact top GNB with the four main section links inside the app surface.

## Home Screen Role
The Home screen is not a long landing page. It is a compact entry point that lets users:
- search or ask
- review featured guides

## Required Home Elements
- Header with `LLM Wiki`
- Centered `사내 지식 위키` label in the header
- Top GNB with the four main section links
- Theme selector: `라이트`, `다크`, `시스템`
- Hero search area
- Featured guides list
- Bottom blueprint CTA

## Required Copy
Hero:
- `사내 지식을 쉽게 찾아보세요`
- `궁금한 내용을 입력하면 관련 문서와 사례, FAQ를 함께 확인할 수 있습니다.`

Search placeholder:
- `예: 업무 자동화는 어떻게 시작하나요?`

Featured guides:
- `추천 가이드`
- 시작 가이드 (고정): `/guides/agent-start`로 연결되는 고정 첫 번째 카드
- 추가 추천 가이드 최대 4개: corpus에서 `docType === "guide"` 중 최근 업데이트 순 상위 (동적, guide가 4개 미만이면 있는 만큼만 표시)

Blueprint CTA:
- `만들고 싶은 방향이 정리되었나요?`
- `가이드와 사례를 확인한 뒤 만들고 싶은 내용을 설계로 정리하세요.`
- CTA button: `시작하기`

## UX Rules
- Keep the top area compact and GNB-like, not editorial.
- The header includes brand, the four main section links, and theme control.
- The header center contains the `사내 지식 위키` label.
- No filter-like buttons below the search input.
- Keep the Home screen centered on search first and featured guides second.
- Pin the starting guide to the top of the featured guide list.
- Show up to four additional recommended guides below the starting guide, dynamically selected from the most recently updated `docType === "guide"` pages in the public corpus (excluding the starting guide itself). Fewer than four is acceptable if not enough `guide` pages exist.
- Keep the blueprint CTA below the guide list as a secondary action.
- On mobile, cards and lists can stack vertically.
- The search and guide/article reading flow must follow `search-flow-contract.md`: answer first, support details next, `추천 페이지` before `관련 페이지`, and no visible evidence quote section.

## Home Recommended Guides Rules — FROZEN

> **이 섹션의 동작은 동결되어 있습니다.**  
> 수정을 계획하기 전에 반드시 사용자 승인을 받아야 합니다. (`CLAUDE.md` "Frozen Behaviors" 참고)  
> `/guides` 목록 규칙(아래 "Guide List Rules")과 **혼동하지 마십시오** — 홈 추천과 /guides 목록은 docType 필터가 다릅니다.

| 항목 | 규칙 |
|---|---|
| 시작 가이드 (고정) | `slug === "agent-start"`, title 패턴 `/agent 시작하기/i` 또는 `/시작 가이드/i`, `id === "63668231"` 순으로 매핑. docType 무관이지만 홈 고정 카드와 `/guides/agent-start` 전용 라우트에서만 노출 (`nav` docType도 허용). |
| 추천 가이드 개수 | 최대 4개 |
| 소스 | 공개 corpus (`docType === "guide"`, 온보딩 페이지 제외) |
| 정렬 | `updatedAt` 내림차순 (최신순) |
| 시작 가이드 중복 제거 | 시작 가이드 문서는 고정 카드로만 표시; 추천 4개 목록에서 제외 |
| 총 표시 개수 | 고정 1개 + 추천 최대 4개 = 최대 5개 |

## Guide List Rules — FROZEN

> **이 섹션의 동작은 동결되어 있습니다.** 수정 전 사용자 승인 필수. (`CLAUDE.md` "Frozen Behaviors" 참고)

- `/guides` shows only `metadata.docType === "guide"` documents.
- Intro-style guide pages are excluded from the visible list.
- `page` docType documents are **not shown** on `/guides`. `page` documents appear only in search answer surfaces (추천 페이지, 관련 페이지, 인라인 링크).

## docType Visibility by Surface — FROZEN

> **전체 surface별 규칙입니다. 한 면을 수정할 때 다른 면을 유추하여 변경하지 마십시오.**

| Surface | guide | page | 비고 |
|---|---|---|---|
| 홈 추천 가이드 | ✅ | ❌ | guide only |
| `/guides` 목록 | ✅ | ❌ | guide only, intro 제외 |
| 검색 답변 내 추천 페이지 | ✅ | ✅ | AI 선정 추천 문서 |
| 검색 답변 내 관련 페이지 | ✅ | ✅ | 랭킹 기반 관련 문서 |
| 답변 본문 내 인라인 링크 | ✅ | ✅ | 답변 중 연결 페이지 |
- The guide index map appears at the bottom of the guide page instead of above the list.
- Long guide lists are paginated client-side.
- The `/guides` page title is `추천 가이드`.

## Typography And Spacing Rules
- Keep page-facing font sizes constrained to three levels:
  - hero title
  - section title
  - body copy
- Reuse shared page shell, panel, and section spacing classes instead of per-page ad hoc spacing.
- Keep section rhythm visually even across Home, category, article, search, and project-design pages.

## Forbidden User-facing Terms
- `Confluence`
- `컨플루언스`
- `DB`
- `데이터베이스`
- `대시보드`
- `로그`
- `개인`
- `진행률`
- `AI Wiki`
- bare `AI`

Allowed exception:
- `LLM Wiki`

## Prototype Notes
The attached JSX prototype also embeds policy-style UI tests:
- 3 featured guides
- 3 theme options
- blocked-term detection in visible copy
- The prototype constraints are acceptance checks for the Home step, not a reason to reintroduce the old stacked editorial shell.

Treat those constraints as acceptance checks for the first frontend step.
