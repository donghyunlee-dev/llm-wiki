# Search Unsupported Page Visibility Spec

## Problem Statement
- Search answers can state that the wiki has no page for the requested topic while still showing unrelated FAQ, recommended, and related page cards.
- The visible page cards contradict the AI relevance decision and imply unsupported evidence.

## Scope
- Suppress FAQ, recommended, and related page cards when the AI search result has no supporting Confluence data and reports unsupported claims.
- Keep the existing `guide` and `page` docType eligibility rules for supported search answers.
- Add regression coverage for the unsupported-answer path.

## Out Of Scope
- Do not change the lexical ranking algorithm.
- Do not change Home or `/guides` document exposure rules.
- Do not change supported or partially supported answer behavior.

## Acceptance Criteria
- AC1: A fully unsupported AI response returns empty `recommendedDocuments` and `relatedDocuments`.
- AC2: A fully unsupported AI response does not receive client-side FAQ or fallback recommendation cards.
- AC3: Supported answers continue to show eligible FAQ, recommended, and related pages.
- AC4: The search-flow contract documents the unsupported-answer page visibility rule.

## Unsupported Answer Definition
- `confluenceData` is empty.
- `unsupportedClaims` contains one or more items.

## Assumptions
- A partially supported answer includes at least one `confluenceData` item and may still contain `unsupportedClaims`.
