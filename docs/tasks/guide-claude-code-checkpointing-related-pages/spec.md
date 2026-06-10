# guide-claude-code-checkpointing-related-pages Spec

## Problem Statement
- The related-pages block on `/guides/guide-claude-code-checkpointing` renders literal HTML tags and broken anchor markup in the browser.
- We need to determine whether the defect is introduced when the page is generated in Confluence or when the wiki app converts Confluence HTML into the rendered page.

## Business Context
- Users rely on related pages to navigate to adjacent documentation.
- Broken literal tags in a visible section make the page look corrupted and can hide the intended links.

## Scope
- Reproduce the issue on the local running app.
- Inspect the live wiki payload for the checkpointing guide.
- Inspect the rendered browser DOM and compare it with the source HTML.
- Identify the layer where the malformed markup already exists.

## Out Of Scope
- Do not change the page content in Confluence.
- Do not modify rendering code unless the investigation proves a code defect and a fix is explicitly requested.
- Do not expand to other guide pages.

## User Or Operator Scenarios
- An operator opens the checkpointing guide and sees whether related pages are rendered as usable links or as literal HTML text.
- An operator checks whether the source payload already contains the malformed markup before the browser renderer touches it.

## Acceptance Criteria
- AC1: The local page is verified in a browser-like runtime.
- AC2: The source payload and rendered DOM are compared.
- AC3: The investigation result clearly states whether the issue starts in page generation or in the wiki conversion/rendering layer.

## Edge Cases
- The page title may be normalized differently in the browser than in the raw payload.
- The page may load correctly while the related-pages block alone is malformed.

## Assumptions
- The local dev server can be started with the current environment values in `apps/web/.env.local`.

## Clarifications
- Question: Is this a page-generation issue or a wiki conversion issue?
- Answer: To be determined from the live payload and browser DOM comparison.
