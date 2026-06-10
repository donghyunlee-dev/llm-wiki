# guide-doctype-page-candidates Test Result

## Commands
- Read `README.md`, `docs/ops/*`, and `docs/prd/*` to confirm workflow and source-of-truth documents.
- Read `packages/wiki-core/src/lib/confluenceClient.ts` and `docs/tasks/confluence-wiki-metadata-properties/confluence-metadata.mjs` to reuse the existing Confluence paging/property contract.
- Read all current Confluence pages in space `63111172` through the live Atlassian API and fetched `wiki.metadata` for each page.
- Updated the live Confluence `wiki.metadata` property for the selected guide-like pages.
- Re-read the same pages after the write to verify `docType=guide`.

## Outcome
- The space currently has 321 current pages.
- 153 pages were scored as `docType=page` with strong guide-like signals from title and body structure.
- The strongest candidates are guide-style documents whose metadata is still `page`, so they are excluded from guide recommendation surfaces.
- A second pass for `docType=page` pages without `Guide` in the title produced no additional guide candidates; the only non-guide-title hit was a FAQ page, which is expected.
- The selected guide-like pages were updated in Confluence and verified as `docType=guide`.

## Coverage
- AC1: Pass.
- AC2: Pass.
- AC3: Pass.

## Notes
- Confluence metadata was updated for the selected pages. No application code was changed.
