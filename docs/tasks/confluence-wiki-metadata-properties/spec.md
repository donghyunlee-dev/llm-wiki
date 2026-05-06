# Confluence Wiki Metadata Properties Spec

## Problem Statement
- The local Confluence-backed wiki endpoint can authenticate and list pages, but it omits all pages that do not expose the `wiki.metadata` content property.
- The current development session cannot recognize intended public pages until those Confluence properties exist.

## Business Context
- Confluence is the source of truth for wiki content.
- The web app must use Confluence metadata to decide which pages are public, how they are categorized, and how article relationships are displayed.

## Scope
- Read the configured Confluence connection from `apps/web/.env.local` without exposing secrets.
- Inspect current pages in Confluence space `63111172`.
- Add or update `wiki.metadata` content properties on every current page in the space.
- Keep public wiki pages visible with `visibility=public`, and mark operational/control pages as `visibility=internal`.
- Verify metadata coverage through Confluence reads.
- Record commands, results, and remaining gaps.

## Out Of Scope
- Changing the metadata schema.
- Changing app UI behavior.
- Creating a separate content database or local content shadow store.
- Marking operator, PRD, source, or development-control pages as public app content unless explicitly selected as target wiki pages.
- Running `/api/wiki-pages` validation in this session.

## User Or Operator Scenarios
- A developer starts `pnpm dev` with Atlassian env values and `/api/wiki-pages` returns public Confluence records.
- Every current Confluence page has `wiki.metadata`, while internal/control pages remain hidden from the public app because their metadata is not public.

## Acceptance Criteria
- AC1: Confluence connectivity is verified against space `63111172` using `.env.local` values.
- AC2: Every current page has a valid `wiki.metadata` property matching `docs/prd/data-spec.md`.
- AC3: Existing `wiki.metadata` properties are updated idempotently rather than duplicated.
- AC4: `/api/wiki-pages` returns a non-zero set of visible records after the property write.
- AC5: Task docs and PRD progress docs reflect what was changed and any remaining gaps.

## Edge Cases
- The property already exists on a target page and must be updated with the current property version.
- Some pages in the space are operational docs and must have metadata without being exposed as public app pages.
- Confluence API writes can fail because of missing permission, stale property versions, or network restrictions.

## Assumptions
- `CONFLUENCE_SPACE_ID` in `apps/web/.env.local` remains `63111172`.
- Metadata can initially use empty relationship arrays where the live graph has not been curated yet.
- Page categorization can be inferred from title and current page set when no existing property is available.

## Clarifications
- Question: Should every Confluence page in the space receive `wiki.metadata`?
- Answer: Yes. Every current page should receive the property; only intended public wiki pages should receive `visibility=public`.
