# guide-doctype-page-candidates Plan

## Summary
- Pull all current Confluence pages in space `63111172`.
- Read `wiki.metadata.docType` for each page.
- Score `docType=page` pages using guide-like signals from title and body structure.
- Manually confirm the strongest candidates before reporting them.

## Validation Plan
- Use a live Confluence API read against the current space.
- Compare page metadata with title/body cues.
- Record the candidate list and the heuristic used to select it.

## Risks
- Some pages may be instructional without using obvious guide keywords.
- Title-only heuristics can miss pages whose guidance is expressed only in body structure.

