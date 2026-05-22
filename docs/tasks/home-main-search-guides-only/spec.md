# Home Main Search Guides Only Spec

## Problem Statement
- The Home screen still shows project examples, FAQ, library, and a separate project design CTA.
- The search support text and search examples are positioned awkwardly.
- The starting guide link was recently changed to a route that does not match the real guide target.

## Business Context
- The Home screen should be a compact entry point focused on search and the most useful guide path.
- Users should see the search action first and the recommended guide path second.
- The starting guide must link to a real guide page so the first recommendation is reliable.

## Scope
- Keep only the search area and the recommended guide section on the Home screen.
- Move the help sentence below the search control and remove the visible search examples text.
- Keep the search control visually rounded.
- Pin the starting guide as the first item in the recommended guide list.
- Fix the starting guide link to point to a real guide document route.
- Restore the blueprint CTA below the recommended guide section.
- Move the `사내 지식 위키` label from the hero body into the centered site header.

## Out Of Scope
- Search ranking changes.
- Category page, article page, or search page behavior.
- Confluence data changes or new content creation.
- Project, FAQ, and library page redesigns.

## User Or Operator Scenarios
- A user opens Home and immediately sees search.
- A user reads the recommended guides and the starting guide appears first.
- A user clicks the starting guide and reaches a valid guide document.

## Acceptance Criteria
- Home shows search first and recommended guides below it.
- The help sentence `궁금한 내용을 입력하면...` style copy appears below the search control.
- Visible search example text is removed from the Home screen.
- Project examples, FAQ, library, and project design sections are not visible on Home.
- The starting guide item links to an actual guide route rather than a synthetic path.
- The blueprint CTA appears below the recommended guide section.
- The `사내 지식 위키` label appears in the center of the top header instead of inside the hero block.

## Edge Cases
- If the preferred starting guide document is unavailable, Home still renders the rest of the guide list.
- If the wiki data is still loading or fails, the existing loading and error states still render.

## Assumptions
- The intended starting guide document is the existing `Agent 시작하기` guide path in the current wiki corpus.
- Home can keep using the shared wiki data source and derive the recommendation list client-side.

## Clarifications
- Question: Should the starting guide be a separate section or part of the recommended guide list?
- Answer: Part of the recommended guide list, pinned to the top.
