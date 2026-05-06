# UI Spec

## Primary Source
The first implementation step must follow the Confluence page `83623964` (`Development Prompt`) and its attached prototype file `sfood_wiki_home.jsx`.

## Home Screen Role
The Home screen is not a long landing page. It is a compact entry point that lets users:
- search or ask
- move into one of four main sections
- review featured guides
- review project examples
- optionally continue into project design

## Required Home Elements
- Header with `LLM Wiki`
- Top GNB with the four main section links
- Theme selector: `라이트`, `다크`, `시스템`
- Hero search area
- Four entry cards
- Featured guides list
- Featured project examples list
- Bottom CTA for project design

## Required Copy
Hero:
- `사내 지식 위키`
- `사내 지식을 쉽게 찾아보세요`
- `궁금한 내용을 입력하면 관련 문서와 사례, FAQ를 함께 확인할 수 있습니다.`

Search placeholder:
- `예: 업무 자동화는 어떻게 시작하나요?`

Search examples:
- `업무 자동화 시작 방법`
- `프로젝트 사례 찾기`
- `자주 묻는 질문 확인`

Entry cards:
- `시작 가이드`: `처음이라면 여기서 시작하세요.`
- `프로젝트 사례`: `완성된 결과를 참고하세요.`
- `자료실`: `기본 지침서와 템플릿입니다.`
- `FAQ`: `자주 묻는 질문을 확인하세요.`

Featured guides:
- `Agent 시작하기`
- `사내 위키 활용 방법`
- `프로젝트 설계 시작하기`

Featured projects:
- `업무 승인 요청 도구`
- `주간 보고서 자동화`
- `내부 문의 챗봇`

Bottom CTA:
- `만들고 싶은 방향이 정리되었나요?`
- `가이드와 사례를 확인한 뒤 만들고 싶은 내용을 설계로 정리하세요.`
- CTA button: `시작하기`

## UX Rules
- Keep the top area compact and GNB-like, not editorial.
- The header includes brand, the four main section links, and theme control.
- No filter-like buttons below the search input.
- Repeated navigation between the top GNB and the main cards is allowed by the latest approved UI direction.
- Keep project-design CTA secondary, visually lower than the main search and entry actions.
- On mobile, cards and lists can stack vertically.

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
- 4 entry cards
- 3 featured guides
- 3 project examples
- 3 search examples
- 3 theme options
- blocked-term detection in visible copy

Treat those constraints as acceptance checks for the first frontend step.
