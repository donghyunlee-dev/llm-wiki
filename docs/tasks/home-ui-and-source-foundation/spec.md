# home-ui-and-source-foundation Spec

## Problem Statement
- The Home screen structure was functionally correct but visually drifted from the approved prototype.
- Category, article, and search pages still depended on a snapshot-only data path with no clean remote-source boundary.

## Business Context
- The first visible screen must match the approved prototype closely enough to use as the project baseline.
- The app also needs a shared read-only source contract so later Confluence wiring does not require a page-by-page refactor.

## Scope
- Realign Home CSS and layout to the prototype.
- Keep the top area as a GNB-style header.
- Remove the bottom policy-check section from the Home screen.
- Add a shared wiki data source layer with `snapshot` and `remote` modes.
- Switch category, article, and search pages to the shared async data source.

## Out Of Scope
- Live Confluence networking.
- Metadata graph rendering.
- AI ask flow.

## Acceptance Criteria
- Home matches the prototype structure more closely than the previous editorial version.
- Home no longer renders the policy-check block.
- Read-only browsing pages do not import snapshot data directly.
- The app builds and tests pass after the refactor.
