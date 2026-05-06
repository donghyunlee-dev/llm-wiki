# confluence-snapshot-read-model Spec

## Problem Statement
- The shared wiki model exists, but its data still comes from hand-authored document fixtures instead of Confluence-like raw page snapshots passed through the normalization layer.

## Business Context
- The next continuity-safe step is to make the shared read model depend on Confluence snapshot shapes so the later live fetch integration becomes a source replacement, not a model rewrite.

## Scope
- Add raw Confluence snapshot fixtures in shared modules.
- Build wiki documents from the normalization pipeline instead of direct hard-coded read models.
- Expose source snapshot links in article pages.

## Out Of Scope
- Live Confluence API fetch
- Visibility filtering against real upstream metadata
- Operator review flows

## User Or Operator Scenarios
- A developer can see that the app already consumes normalized Confluence-shaped data.
- A later session can replace snapshot fixtures with real fetch results without rebuilding category/article rendering from scratch.

## Acceptance Criteria
- AC1: Snapshot fixtures exist in Confluence-shaped raw page format.
- AC2: Shared wiki documents are derived from normalization functions.
- AC3: Article pages expose source snapshot information when available.

## Edge Cases
- Snapshot source URLs may exist before live fetch wiring is added.
- Sanitization must still apply to snapshot HTML.

## Assumptions
- Snapshot fixtures are an acceptable bridge before live upstream calls.

## Clarifications
- Question
- Keep the no-backend default and move only the data source shape closer to Confluence.
