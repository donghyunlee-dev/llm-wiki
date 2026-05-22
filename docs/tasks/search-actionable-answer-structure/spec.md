# search-actionable-answer-structure Spec

## Problem Statement
- The search UI promises a fast, followable answer, but the current search response still depends too heavily on a freeform `answer` string.
- Even after prompt tuning, setup/install queries can regress into a one-line summary.

## Business Context
- The core product promise is that users can search and immediately follow the answer.
- The minimum acceptable result is:
  - a short direct answer
  - actionable steps
  - example commands or examples where available
  - verification checks
  - cautions
  - related guide page links at the bottom

## Scope
- Change the search AI contract so actionable sections are first-class structured fields.
- Render those structured sections directly in the search UI.
- Revalidate with the reproduced Claude CLI install query until the result is detailed enough to follow.

## Out Of Scope
- Full article `AI Ask` redesign.
- Search retrieval retuning.

## User Or Operator Scenarios
- A user asks how to install a CLI tool and can follow the result without reinterpreting a vague paragraph.
- A user sees the related guide pages at the bottom after the actionable answer blocks.

## Acceptance Criteria
- AC1: Search response includes structured actionable fields suitable for direct rendering.
- AC2: The search UI renders the structured actionable fields ahead of the guide links.
- AC3: The reproduced Claude CLI install query returns a detailed followable answer instead of a single-line summary.

## Edge Cases
- The corpus includes only part of the setup procedure.
- The answer has no exact commands, but still needs ordered steps and checks.

## Assumptions
- `recommendedDocuments` remains the bottom-of-answer guide link area.

## Clarifications
- Question: Is a better prompt alone enough?
- Answer: No. The response shape must encode actionable sections explicitly so the UI does not rely on prose quality alone.
