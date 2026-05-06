# home-header-refinement Spec

## Problem Statement
- The Home screen header currently reads like a large top section instead of a compact site header.
- Duplicate supporting text and oversized local typography make the first viewport feel heavier than the approved compact Home baseline.

## Business Context
- The Home screen should remain a fast entry point for search and the four main wiki sections.
- The next implementation work continues toward the read-only wiki core, so this UI adjustment must be narrow and preserve existing route and data contracts.

## Scope
- Refine the site header so it behaves visually as a header, not a separate top content section.
- Reduce duplicate descriptive text in the header area.
- Keep Home typography within the existing shared hero, section, and body scale.
- Preserve the current search-first Home composition and search position.

## Out Of Scope
- Moving the Home search area.
- Redesigning the Home page layout from scratch.
- Changing category, article, search, or data source contracts.
- Connecting the remote wiki source.

## User Or Operator Scenarios
- A user opens the Home page and sees a compact header above the search area.
- A user scans the Home page without repeated explanatory labels competing with the main search copy.

## Acceptance Criteria
- AC1: The site header is visually compact and no longer presents the user/environment block as a large content panel.
- AC2: The Home search area keeps its current position and role.
- AC3: Header and Home copy avoid redundant helper text where it does not create a clear action.
- AC4: Home typography continues to use the shared three-level page scale rather than ad hoc larger heading sizes.

## Edge Cases
- The header must wrap cleanly on narrow mobile widths.
- Theme controls must remain available after header compaction.

## Assumptions
- The approved Home baseline remains compact and search-led.
- A disabled environment settings control is not required for the current user-facing Home experience.

## Clarifications
- Question: Should search placement change during this pass?
- Answer: No. The search-focused position must stay unchanged.
