# guides-page-header-home-icon Spec

## Problem Statement
- The `/guides` page header shows a text link "홈으로 돌아가기" on the left.
- The title also uses bracket notation `[추천 가이드]`, which is visually inconsistent with the rest of the app.

## Business Context
- The guides list is a primary navigation surface.
- The header should read cleanly and keep the return-home affordance visually compact.

## Scope
- Remove the brackets from the guides page title.
- Replace the left-aligned text link with a right-aligned icon-style home link.
- Keep the navigation target as `/`.

## Out Of Scope
- Do not change `/guides` filtering or search behavior.
- Do not change other page shells unless they share the same exact pattern later.

## User Or Operator Scenarios
- A user opens `/guides` and sees a compact header with the title on the left and home icon on the right.
- A user activates the icon and returns to the home page.

## Acceptance Criteria
- AC1: The guides page title renders without brackets.
- AC2: The home navigation is icon-only, right-aligned, and still links to `/`.
- AC3: Existing list and search behavior is unchanged.

## Edge Cases
- The icon must remain accessible to screen readers.

## Assumptions
- The change is limited to the guides list page and does not need to be mirrored in every static page shell.

## Clarifications
- Question: Should the icon replace the text only on the guides page?
- Answer: Yes, on the guides page only.

