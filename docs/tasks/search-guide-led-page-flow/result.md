# Search Guide-Led Page Flow Result

## Summary
- Search answers now present a representative guide page under `추천 페이지` and move secondary pages into `관련 페이지`.
- Search cards no longer render summaries; they behave as clean page-entry cards.
- The search result screen no longer exposes evidence quotes directly.
- Article pages now show cleaner code frames with only a top-right copy button, styled callout blocks, and bottom page-link sections based on metadata graph links.
- Guide/article pages no longer show a separate related-page section under the article body; the guide view stays focused on the page content and the side TOC.
- Follow-up refinement removed label-style answer prefixes such as `짧답:` and `가장 짧게:` from the visible search answer.
- The representative guide section is labeled `추천 페이지`, secondary cards are labeled `관련 페이지`, and article pages now convert Confluence internal links to local wiki detail routes.
- Article pages no longer repeat the summary under the title, skip duplicated top `h1`, and highlight the active heading in the sticky table of contents.
- Guide-page link badges and page-open labels were removed so the visible cards stay compact and the link target is implied by the title itself.
- Shared `WikiCodeBlock` and `WikiCallout` components now back both the search answer surface and guide/article content, so code and callout styling stays consistent.
- Guide-page callouts now render nested content recursively so code blocks and links inside panels are preserved instead of flattening back into raw HTML.
- Guide-page command-style inline code now promotes to a shared code frame when it is the only code fragment in a paragraph, so the visible page shows an explicit code component instead of only inline code styling.
- Confluence link resolution now checks `data-linked-resource-id`, `data-linked-resource-title`, title text, and slug/title normalization before falling back to a local wiki search route for unresolved internal links, instead of exposing the raw Confluence URL.
- The guide-page table of contents now updates the active highlight on click and hash changes, not only on scroll intersection updates.
- The guide-page table of contents no longer shows a selected/active visual state; it now behaves as a plain navigation list that only scrolls to the chosen section.
- Example command rendering now uses one code frame per example section instead of splitting each line into separate blocks.
- Callout rendering no longer shows the old icon rail or duplicated `[주의]`-style title treatment.
- Confluence code macro rendering now extracts command text from the stored CDATA/comment payload so `bash` frames show real code instead of empty shells.
- Playwright MCP rechecked the guide page and confirmed `Guide Node.js Setup`, `Guide npm Setup`, and `Guide npx Setup` are local wiki links while the code frames contain `npm install -g @openai/codex`, `codex --version`, `codex --upgrade`, and `codex`.

## Changed Files
- `apps/web/src/ui/pages/SearchPage.tsx`
- `apps/web/src/ui/searchRecommendations.ts`
- `apps/web/src/ui/searchRecommendations.test.ts`
- `apps/web/src/ui/pages/ArticlePage.tsx`
- `apps/web/src/ui/pages/ArticleContentRenderer.tsx`
- `apps/web/src/styles.css`

## Remaining Gap
- The visible public Confluence candidate set still needs stronger retrieval/linking for prerequisite pages such as Node.js or npm setup guides.
