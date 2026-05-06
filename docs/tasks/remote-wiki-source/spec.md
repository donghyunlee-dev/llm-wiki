# remote-wiki-source Spec

## Problem Statement
- The app has a `snapshot|remote` source switch, but the remote path trusts JSON payload shape too early.
- A real read-only upstream endpoint needs a fixed response contract and boundary validation before normalization.

## Business Context
- Phase 2 requires live read-only wiki content to flow through the same normalization path as local snapshots.
- The app must keep Confluence as the source of truth without adding a separate database.

## Scope
- Define and validate the remote wiki payload contract.
- Enforce the fixed public space boundary before normalizing remote records.
- Keep the existing route/page contracts unchanged.
- Add tests for valid remote payloads, invalid payloads, hidden records, and fetch failures.
- Update web provider error handling so user-facing errors avoid implementation vocabulary.

## Out Of Scope
- Providing a real endpoint URL or credentials.
- Adding serverless functions.
- Changing Home UX.
- Implementing metadata graph validation beyond the fields already present in the read model.

## User Or Operator Scenarios
- An operator sets `VITE_WIKI_DATA_SOURCE=remote` and `VITE_WIKI_REMOTE_ENDPOINT` to a public read-only JSON endpoint.
- The app fetches remote records, validates them, normalizes visible public documents, and feeds existing category/article/search pages.
- If the endpoint fails or returns invalid data, the app shows a generic Korean failure message instead of leaking implementation details.

## Acceptance Criteria
- AC1: Remote source accepts only the documented payload shape.
- AC2: Remote source rejects records outside fixed space `63111172`.
- AC3: Remote source filters out non-public or non-current records before UI documents are built.
- AC4: Remote source preserves the existing `WikiDocument[]` contract for category, article, and search pages.
- AC5: Tests cover remote success, filtering, invalid payload, wrong space, and HTTP failure.

## Edge Cases
- Endpoint returns `{ pages: [...] }` or a raw array of records.
- Endpoint returns malformed JSON shape.
- Endpoint returns records with internal visibility.
- Endpoint returns a successful HTTP status but no valid public records.

## Assumptions
- Browser-safe public read endpoint returns Confluence-shaped page records already compatible with `RawConfluencePage`.
- Secret-bearing upstream access will be handled later through a serverless boundary if required.

## Clarifications
- Question: Is the real production endpoint available in this repository?
- Answer: No. This task wires the remote source contract and validation; runtime endpoint value remains environment-provided.
