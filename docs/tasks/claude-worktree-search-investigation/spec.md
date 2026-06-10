# claude-worktree-search-investigation Spec

## Problem Statement
- The wiki search flow returned no result for the query `claude worktree를 설명하세요.` even though Confluence page `95780877` exists as a guide page.
- The failure needs to be isolated to either page ingestion/property filtering or downstream search and ranking behavior.

## Business Context
- Search quality depends on distinguishing corpus-ingestion failures from retrieval failures.
- Operators need a concrete cause before changing page metadata or search logic.

## Scope
- Inspect whether page `95780877` is present in the Confluence-backed wiki corpus used by the local search flow.
- Verify whether the page has a valid `wiki.metadata` property and whether that metadata makes the page eligible for public search.
- Trace how the existing search pipeline handles the query `claude worktree를 설명하세요.` and determine where the page drops out.
- Record findings and validation evidence.

## Out Of Scope
- Changing search behavior, ranking rules, or page metadata unless a separate implementation decision is made.
- Broad search quality tuning outside this specific missing-page investigation.

## User Or Operator Scenarios
- An operator knows a guide page exists by Confluence page ID and wants to know why search does not return it.
- A developer needs evidence on whether to fix page properties or search code.

## Acceptance Criteria
- AC1: The investigation states whether page `95780877` is excluded before search because of property/data-source rules.
- AC2: The investigation states whether the current search pipeline receives the page but fails to retrieve or rank it for the given query.
- AC3: The task documents include reproducible commands or checks supporting the conclusion.

## Edge Cases
- The page may exist in Confluence but be excluded from the public corpus because `wiki.metadata` is missing or invalid.
- The page may be present in the corpus but lexical matching may fail because the query wording does not overlap the indexed terms.

## Assumptions
- Local repo tooling and environment are sufficient to inspect both the search implementation and the Confluence-backed page fetch path.

## Clarifications
- Question: Should this task change behavior if a defect is found?
- Answer: No. This task is limited to root-cause investigation and evidence gathering.
