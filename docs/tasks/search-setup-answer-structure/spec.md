# search-setup-answer-structure Spec

## Problem Statement
- Some setup/install search questions still return a one-line summary even though the intended search UX requires a followable wiki-style answer.
- The issue appears in real execution for questions such as `윈도우에서 claude code cli 설치하는 방법`.

## Business Context
- Search is the primary product path. A one-line install answer looks incomplete and breaks trust quickly.
- Setup questions are expected to return a practical procedure, not a terse summary.

## Scope
- Reproduce the one-line setup answer.
- Tighten setup-question prompt constraints so the answer requires visible structure.
- Revalidate the same question through the running local service.

## Out Of Scope
- Broad retrieval retuning.
- Full search UI redesign.

## User Or Operator Scenarios
- A user asks how to install a CLI tool and gets steps, examples, checks, and cautions.
- A developer reruns the same question and confirms the answer is no longer one line.

## Acceptance Criteria
- AC1: The one-line answer is reproduced and the cause is identified.
- AC2: Setup-question prompts require a structured answer shape strongly enough to avoid one-line summaries in this case.
- AC3: The local search API returns a multi-section answer for the reproduced question after the fix.

## Edge Cases
- The exact target is only partially covered by the wiki corpus.
- The corpus contains the install command but not every Windows-specific detail.

## Assumptions
- The search intent classifier already recognizes this question as `setup`.

## Clarifications
- Question: Is this a rendering bug?
- Answer: No. The API itself returned a single-paragraph answer string.
