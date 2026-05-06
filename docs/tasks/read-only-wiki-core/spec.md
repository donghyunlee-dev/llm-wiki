# read-only-wiki-core Spec

## Problem Statement
- The app has a Home MVP and route shells, but category/article/search flows still rely on placeholder text rather than a shared read-only wiki model.

## Business Context
- The next approved step is Phase 2: build the read-only wiki core that later connects to Confluence without adding a separate database.

## Scope
- Add normalized wiki document models in shared modules.
- Add Confluence normalization helpers and sanitization utilities.
- Replace placeholder category and article views with shared read-only data.
- Improve search to use shared document models.

## Out Of Scope
- Live Confluence API calls in production routes
- Metadata validation enforcement against real upstream pages
- AI Ask integration
- Operator workflows

## User Or Operator Scenarios
- A user can open guide, project, library, and FAQ pages backed by a shared read-only document model.
- A developer can continue from this session and know that the next step is wiring real Confluence fetches into the normalization layer.

## Acceptance Criteria
- AC1: Shared wiki document models exist in `packages/wiki-core`.
- AC2: Confluence HTML normalization helpers exist in shared modules.
- AC3: Category and article pages render from shared read-only data instead of static placeholder strings.
- AC4: Search route uses shared document search instead of hard-coded result text.

## Edge Cases
- Missing article slugs should show a not-found state.
- Sanitization should strip obvious unsafe script content and inline handlers.

## Assumptions
- Real upstream credentials remain out of the browser path for now.
- A fixture-backed read model is acceptable as the immediate bridge to real Confluence integration.

## Clarifications
- Question
- Continue with Phase 2 implementation before introducing Lambda or live upstream fetch wiring.
