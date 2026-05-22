# Search Answer Page Linking Spec

## Scope
- Make actionable search answers point back to concrete wiki pages instead of staying as standalone prose.
- Keep the linkage dynamic from Confluence-backed search results and document graph context.
- Expose answer evidence in the result screen so the user can move from an answer step to the supporting page immediately.

## Problem
- Search answers were becoming more detailed, but the answer body still behaved like detached chat text.
- Bottom recommendation cards were too far from the actual step they supported.
- Users could not tell which page backed a specific instruction such as a prerequisite check or installation step.

## Acceptance Criteria
- Search answer items under `immediateActions`, `verificationChecks`, and `cautions` support per-item page linkage.
- The search result screen renders related wiki page links directly under each actionable item.
- The search result screen shows a visible evidence section sourced from `confluenceData`.
- The feature does not depend on hardcoded topic keywords such as `node`, `npm`, or `pnpm`.
- Web typecheck and targeted web tests pass.
