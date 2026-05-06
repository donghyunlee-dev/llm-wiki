# Confluence Wiki Metadata Properties Plan

## Summary
- Use the existing `.env.local` Atlassian settings to inspect Confluence pages in space `63111172`.
- Determine public versus internal metadata from current page titles and existing metadata.
- Write `wiki.metadata` through Confluence content property APIs using create-or-update logic for every current page.
- Validate coverage through Confluence property reads.

## Impacted Modules
- Confluence space `63111172` page content properties
- `docs/tasks/confluence-wiki-metadata-properties/*`
- `docs/prd/implementation-status.md`
- `docs/prd/development-plan.md`

## Architecture Approach
- Keep Confluence as the canonical content and metadata source.
- Do not add repository code unless validation exposes a bug in the existing adapter.
- Use content properties rather than page body edits.

## Data And API Impact
- Adds or updates content property key `wiki.metadata` on every current Confluence page in the space.
- Property value shape:
  - `docType`
  - `visibility`
  - `audience`
  - `status`
  - `prerequisites`
  - `next`
  - `related`
- No local persistence or app API contract changes.

## Validation Plan
- Verify environment contains required Atlassian keys without printing secret values.
- Fetch Confluence space metadata and page list scoped to `63111172`.
- Fetch page properties before and after writes.
- Summarize metadata coverage and confirm zero missing properties.
- Defer local app endpoint validation to the separate development/API session.

## Risks
- Misclassifying internal pages as public could expose unintended content in the app.
- Incomplete relationship metadata means graph panels may start sparse.
- Confluence property writes require correct API versioning for existing properties.

## Rollback Considerations
- Each changed page property can be updated to `visibility=internal` or removed if needed.
- Because page body content is untouched, rollback is limited to content property changes.
