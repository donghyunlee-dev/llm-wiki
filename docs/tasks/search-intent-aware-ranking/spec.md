# search-intent-aware-ranking Spec

## Problem Statement
- Current search ranking still overfits single keywords such as `mcp` and can push users toward procedural setup pages even when they asked for a conceptual explanation.
- The search flow needs to pick different primary pages for different question shapes, not just different keywords.

## Business Context
- Search is the main entry point for wiki knowledge.
- Users expect the answer and the page recommendation to align with the question type:
  - concept/definition
  - setup/install
  - troubleshooting
  - comparison
  - planning/preparation
- If the ranking picks the wrong page family, the AI answer and the recommended page list feel disconnected.

## Scope
- Introduce intent-aware search ranking that combines:
  - query shape
  - document role signals
  - lexical matching
  - graph proximity
  - existing AI answer context
- Re-rank visible recommendation candidates so primary pages can differ by question family.
- Validate the behavior with multiple question families, not a single example.

## Out Of Scope
- Full vector database infrastructure.
- External embedding storage or a persistent semantic index.
- Search UI redesign.

## User Scenarios
- A user asks `mcp가 뭐지?` and sees an overview or concept page first, not a setup tutorial.
- A user asks `mcp 설치 방법` and sees setup pages first.
- A user asks `설정이 안 돼` and sees troubleshooting pages first.
- A user asks a planning question and gets a preparation/overview page plus supporting pages.

## Acceptance Criteria
- AC1: The ranking path distinguishes at least concept, setup, troubleshooting, comparison, and planning-oriented questions.
- AC2: The search flow no longer depends on one keyword like `mcp` to force a setup-only path.
- AC3: The same ranking path surfaces the most relevant wiki page family across several different question shapes.
- AC4: Existing AI answer generation continues to work, but the visible page recommendations are now aligned to the better-ranked candidate set.

## Edge Cases
- A question contains both concept and setup terms.
- The corpus contains a broad overview page plus many narrower procedure pages.
- A query is short enough that it has weak lexical signal but still has an obvious intent.
- The best page exists, but only as a parent or graph neighbor of a more specific document.

## Assumptions
- We can improve ranking with deterministic heuristics first and revisit embeddings later if needed.
- The corpus already contains enough role-shape variety to distinguish concept, setup, troubleshooting, and planning pages.
