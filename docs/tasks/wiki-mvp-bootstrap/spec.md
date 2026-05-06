# wiki-mvp-bootstrap Spec

## Problem Statement
- The repository has product and architecture documents but no runnable project skeleton.

## Business Context
- Development should start from the approved Home experience and lightweight monorepo structure.

## Scope
- Create the monorepo scaffold.
- Create the React/Vite web app.
- Implement the Home screen from the Development Prompt.
- Add placeholder routes for the first information architecture.

## Out Of Scope
- Real Confluence API integration
- Search engine implementation
- Lambda deployment code
- AI write-back workflow

## User Or Operator Scenarios
- A developer can open the repo and see a clear monorepo structure.
- A developer can start implementing the product from a concrete Home screen instead of a blank project.

## Acceptance Criteria
- AC1: The repo contains a `pnpm` workspace monorepo skeleton.
- AC2: `apps/web` contains a React/Vite SPA configured for the selected stack.
- AC3: The Home screen reflects the approved content and blocked-term rules.
- AC4: The core UI fixture data is centralized in shared wiki modules.

## Edge Cases
- Theme defaults to system when no user preference exists.
- Search route should still render when no keyword is provided.

## Assumptions
- Dependency installation can happen in a later step.
- Initial implementation can use fixture data before Confluence integration.

## Clarifications
- Question
- Start with frontend and monorepo bootstrap first.
