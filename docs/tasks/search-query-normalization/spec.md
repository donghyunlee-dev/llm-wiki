# search-query-normalization Spec

## Problem Statement
- Natural-language searches such as `gmail을 설정하는 방법이 있을까?` are missing clearly relevant setup pages.
- Current tokenization keeps Korean particles attached to mixed-language words, which prevents obvious matches.

## Business Context
- Users expect MCP setup guides to surface from common wording, including Korean particles and mixed English/Korean terms.
- Search should better reflect document intent and document type, not just exact token equality.

## Scope
- Normalize search tokens so Korean particles do not block English or Korean term matches.
- Add limited synonym expansion for email/M365 setup search terms.
- Improve search scoring with slug and docType hints.

## Out Of Scope
- Full linguistic stemming or large semantic search indexes.
- Search UI redesign.
- Document write paths.

## User Or Operator Scenarios
- A user searches for Gmail setup using a Korean sentence and gets the Gmail guide.
- A user searches for mail/Microsoft 365 setup and gets the most relevant guide pages.

## Acceptance Criteria
- `gmail을` matches Gmail setup pages.
- `mail을` and `outlook` related queries surface the appropriate setup guides.
- Search remains deterministic and local, without adding a persistent index.

## Edge Cases
- Mixed Latin/Korean tokens with attached particles.
- Queries that only contain generic terms like `setup` or `설정`.

## Assumptions
- Small, domain-specific synonym expansion is sufficient for this release.
- Guide/setup pages should receive a mild relevance boost when queries imply setup/help wording.

## Clarifications
- Question: How much language processing is needed?
- Answer: Only lightweight normalization and a small synonym map, not full NLP.
