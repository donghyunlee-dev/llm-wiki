# home-prototype-alignment Spec

## Problem Statement
- The implemented Home UX differs from `docs/prd/sfood_wiki_home.jsx`.
- Home currently renders as separate stacked panels, while the prototype uses one contained surface with compact internal sections.
- CSS primitives are not yet aligned closely enough with the prototype's shell, surface, card, section, list, and CTA patterns.

## Business Context
- The Home screen is the approved first entry point for the wiki.
- Matching the prototype reduces ambiguity before continuing remote wiki source work.

## Scope
- Align the Home page and shared header with the prototype's visual structure.
- Convert repeated Home styling into reusable CSS component classes.
- Preserve existing Home copy, data constants, routes, and search behavior.
- Keep theme controls available.

## Out Of Scope
- Changing wiki data source contracts.
- Connecting the remote source.
- Changing article/category/search content behavior.
- Adding new Home content beyond the prototype.

## User Or Operator Scenarios
- A user opens Home and sees one compact app-like surface matching the prototype.
- A user searches from the same hero search position and reaches `/search`.
- A user follows Home entry cards, list rows, and project-design CTA through existing routes.

## Acceptance Criteria
- AC1: Home uses a single rounded surface containing header and content sections.
- AC2: Header resembles the prototype header density with logo and theme control.
- AC3: Entry cards, list panels, and CTA use shared CSS classes instead of one-off long class strings.
- AC4: Search behavior and route destinations remain intact.
- AC5: Light and dark theme styling remains supported.

## Edge Cases
- Header and theme controls must wrap cleanly on small widths.
- Home links must remain keyboard-focusable because prototype buttons are implemented as routes in the app.

## Assumptions
- `docs/prd/sfood_wiki_home.jsx` is the target prototype for this pass.
- Header GNB links can be removed from the Home-facing header because the prototype header only shows brand and theme control.

## Clarifications
- Question: Should this pass connect the next remote wiki source work?
- Answer: No. This pass is UI alignment and CSS commonization only.
