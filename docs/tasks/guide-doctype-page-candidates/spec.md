# guide-doctype-page-candidates Spec

## Problem Statement
- Some Confluence pages are marked `wiki.metadata.docType = page` even though their content reads like a guide.
- Those pages are excluded from guide recommendation surfaces, so users cannot find them where they expect.

## Scope
- Identify candidate Confluence pages in space `63111172` that are tagged `page` but appear guide-like.
- Use title, structure, and body content to rank the strongest candidates.
- Confirm whether `119930898` is the only clear case or whether there are more pages with the same mismatch.

## Out Of Scope
- Do not change Confluence metadata yet.
- Do not change `/guides` filtering behavior.
- Do not edit page content.

## Acceptance Criteria
- AC1: The investigation returns a concrete list of candidate page IDs and titles.
- AC2: Each candidate includes a short reason why it appears guide-like.
- AC3: The result distinguishes high-confidence candidates from weak/ambiguous ones.

## Assumptions
- Live Confluence access is available through the existing credentials and space boundary.
- `guide`-like content can be inferred from titles, headings, and body structure even when the metadata is `page`.

