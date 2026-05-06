# confluence-env-source Spec

## Problem Statement
- `apps/web/.env.example` defines Atlassian and Confluence settings, but the app still expects a prebuilt public JSON endpoint.
- Secret-bearing Confluence settings must not be exposed to browser code.

## Business Context
- Phase 2 requires read-only content loading from Confluence while keeping Confluence as the source of truth.
- Local development should work from the provided env file shape without requiring a separate manual endpoint first.

## Scope
- Add a server-side Confluence fetch adapter that uses the env keys from `apps/web/.env.example`.
- Add a Vite dev endpoint that returns the existing remote payload shape.
- Keep browser code reading same-origin JSON only.
- Preserve snapshot mode when Confluence env values are not configured.

## Out Of Scope
- Production Lambda/API Gateway deployment.
- Write-back to Confluence.
- AI Ask integration.
- Metadata graph validation beyond visibility and normalization inputs.

## User Or Operator Scenarios
- A developer fills `apps/web/.env.local` using `.env.example`, runs `pnpm dev`, and the app reads live Confluence content through `/api/wiki-pages`.
- If required Atlassian settings are missing, the app stays in snapshot mode.

## Acceptance Criteria
- AC1: `ATLASSIAN_SITE_NAME`, `ATLASSIAN_USER_EMAIL`, `ATLASSIAN_API_TOKEN`, and `CONFLUENCE_SPACE_ID` are used only server-side.
- AC2: Browser code reads from `/api/wiki-pages` in development when Confluence env is configured.
- AC3: The dev endpoint returns the same `{ pages: [...] }` contract already validated by `wikiDataSource`.
- AC4: Tests cover the Confluence adapter mapping and metadata filtering.
- AC5: Build, typecheck, and tests pass.

## Edge Cases
- Pages without `wiki.metadata` are omitted.
- Pages outside the configured space are rejected by downstream source validation.
- Metadata property list responses may include the value directly or require a follow-up property fetch.

## Assumptions
- `ATLASSIAN_SITE_NAME` is either a site slug or full Atlassian site URL.
- `wiki.metadata` is stored as a Confluence page content property.
- Confluence Cloud REST API v2 is the target API.

## Clarifications
- Question: Should Atlassian API tokens be exposed through `VITE_` env values?
- Answer: No. They must remain server-side only.
