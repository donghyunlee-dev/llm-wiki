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
- The `사내 지식 위키` label now lives in the centered site header instead of the hero body.
- Hero contains:
  - `사내 지식을 쉽게 찾아보세요`
  - `궁금한 내용을 입력하면 관련 문서와 사례, FAQ를 함께 확인할 수 있습니다.`
- Search placeholder:
  - `예: 업무 자동화는 어떻게 시작하나요?`
- Search help copy sits below the search box and the visible search examples were removed from the Home screen.
- Featured guide list contains the pinned starting guide plus up to four additional guides (dynamically selected from the most recently updated `docType === "guide"` pages in the corpus, excluding the starting guide itself). Fewer than four is acceptable if not enough guide pages exist.
- The starting guide is pinned as the first featured guide item.
- The blueprint CTA returns as a secondary action below the guide list.
- `/guides` uses the `추천 가이드` page title, shows only `metadata.docType === "guide"` documents, excludes intro-style guide pages, paginates long results, and keeps the guide index map at the bottom. `page` docType documents are excluded from this list and appear only in search answer surfaces (추천 페이지, 관련 페이지, 인라인 링크).

## Explicit UX Constraints
- Original prompt said no top navigation menu links, but the current approved direction overrides this with a compact GNB.
- No filter-like buttons below the search input.
- Keep the Home screen short and focused.
- Keep the Home screen centered on search first and featured guides second.
- Keep the blueprint CTA below the guide list rather than beside the search box.
- Keep the `/guides` page title as `추천 가이드` rather than `시작 가이드`.

## Visibility And Copy Constraints
- Do not expose `Confluence`, `컨플루언스`, `DB`, `데이터베이스`.
- Avoid `대시보드`, `로그`, `개인`, `진행률`.
- `LLM Wiki` is allowed as the product name.
- `AI Wiki`, bare `AI` are allowed since `home-hero-ai-copy` — the wiki's identity is AI/AI Agent utilization guides, so hiding "AI" caused users to mistake it for a general company-wide knowledge base.

## Test Constraints
- 4 entry cards
- 3 featured guides
- 3 featured projects
- 3 search examples
- 3 theme options
- No blocked user-facing terms
