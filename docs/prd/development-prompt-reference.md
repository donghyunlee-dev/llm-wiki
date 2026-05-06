# Development Prompt Reference

## Source
- Confluence page: `83623964` `Development Prompt`
- Attachment metadata confirmed: `sfood_wiki_home.jsx` (`att83820556`)

## Attachment Access Note
- The attachment record was confirmed in Confluence.
- Direct raw download from CLI redirected to Atlassian login, so this local reference is reconstructed from the Confluence page body and the attachment-linked requirements embedded in that page.
- Use this file as the implementation baseline unless the raw attachment is later fetched through an authenticated browser export path.

## Home Prototype Baseline
- Original prompt guidance described the header as `LLM Wiki` plus the theme selector.
- Current implementation baseline is user-approved to use a compact top GNB with the four main section links.
- Hero contains:
  - `사내 지식 위키`
  - `사내 지식을 쉽게 찾아보세요`
  - `궁금한 내용을 입력하면 관련 문서와 사례, FAQ를 함께 확인할 수 있습니다.`
- Search placeholder:
  - `예: 업무 자동화는 어떻게 시작하나요?`
- Search examples:
  - `업무 자동화 시작 방법`
  - `프로젝트 사례 찾기`
  - `자주 묻는 질문 확인`
- Main action area contains exactly four entry cards:
  - `시작 가이드`
  - `프로젝트 사례`
  - `자료실`
  - `FAQ`
- Featured guide list contains exactly three items.
- Featured project example list contains exactly three items.
- Bottom CTA remains secondary and uses:
  - `만들고 싶은 방향이 정리되었나요?`
  - `가이드와 사례를 확인한 뒤 만들고 싶은 내용을 설계로 정리하세요.`
  - `시작하기`

## Explicit UX Constraints
- Original prompt said no top navigation menu links, but the current approved direction overrides this with a compact GNB.
- No filter-like buttons below the search input.
- Do not repeat the same navigation role in both header and main content.
- Keep the Home screen short and focused.
- Keep project-design CTA below the main search and entry actions.

## Visibility And Copy Constraints
- Do not expose `Confluence`, `컨플루언스`, `DB`, `데이터베이스`.
- Avoid `AI Wiki`, bare `AI`, `대시보드`, `로그`, `개인`, `진행률`.
- `LLM Wiki` is allowed as the product name.

## Test Constraints
- 4 entry cards
- 3 featured guides
- 3 featured projects
- 3 search examples
- 3 theme options
- No blocked user-facing terms
