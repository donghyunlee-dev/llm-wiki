# Development Plan

## Delivery Strategy
Development should proceed in small approval-based steps. The first approved implementation step starts from the `Development Prompt` Home screen design, not from backend complexity.

## Progress Tracking Rule
- After every implementation step, update `implementation-status.md`.
- If a phase changes status, reflect it both here and in `implementation-status.md`.
- PRD documents are the primary continuity source across sessions.

## Phase 0: Project Setup
Status: Completed on 2026-04-28.
- Create a `pnpm` workspace monorepo.
- Create `apps/web` with React 19.2, Vite 7, TypeScript 5.9, React Router 7, and Tailwind CSS 4.
- Create `packages/wiki-core` for shared wiki logic.
- Add environment loading only where required.
- Do not add relational DB setup.
- Do not create Lambda functions unless a concrete browser-side limitation appears.

## Phase 1: Home Screen Prototype
Status: Completed on 2026-04-28.
- Build the Home screen from `ui-spec.md`.
- Use fixed local fixture data from the prompt.
- Implement light, dark, and system themes.
- Enforce blocked-term checks in visible UI copy.
- Keep the top area as a compact GNB rather than an editorial hero header.

## Phase 2: Read-only Wiki Core
Status: In Progress.
- Implement Confluence client with fixed space guard `63111172` inside shared modules.
- Load visible documents from Confluence.
- Normalize body HTML, headings, breadcrumbs, and internal links.
- Add sanitizer before rendering.
- Keep the logic reusable so it can move into Lambda later without refactor if needed.
Current state: local Confluence-shaped snapshots already pass through the normalization layer, the app now reads through a shared `snapshot|remote` source boundary, remote payload validation enforces the fixed public space plus visible-current record rules, and local development can fetch Confluence through `/api/wiki-pages` using server-side Atlassian env values. Live Confluence access works, `wiki.metadata` content properties have been added to all 130 current pages in space `63111172`, category/article/search routes render from remote data, and `packages/serverless` provides the production handler equivalent of the Vite dev endpoint.

## Phase 3: Section and Article Pages
Status: In Progress with shared read-only fixtures.
- Add routes for guides, projects, library, FAQ, and article detail.
- Feed section pages from normalized Confluence-derived content.
- Keep Home compact; move exploration depth into internal pages.

## Phase 4: Search Flow
Status: In Progress with shared read-only fixtures.
- Implement `/search?q=` route and grouped result model:
  - guides
  - project examples
  - FAQ
  - library
- MVP can start with simple derived search from visible normalized content.
- Keep search bound to the same shared wiki source used by category and article pages.

## Phase 5: Metadata and Graph
Status: In Progress with first article graph block.
- Read and validate `wiki.metadata`.
- Enforce public visibility in the application layer.
- Build prerequisite, next, related, and parent graph blocks.

## Phase 6: Read-only AI Ask
Status: In Progress with local dev endpoint, article Ask panel, and policy-aware prompt context.
- Add page-scoped Q&A using current document plus visible graph context and policy context only.
- Return unsupported claims explicitly.
- Do not allow write-back.

## Phase 7: Operator Workflow
- Design metadata issue list and suggestion review APIs.
- Keep approval-first write paths out of the initial user-facing delivery.
- If write-back is added later, it must use Lambda/API Gateway style serverless functions, Confluence version checks, and auditable approval.

## Approval Gates
- Gate 1: Home screen complete and matches prompt/prototype
- Gate 2: Read-only Confluence article rendering works
- Gate 3: Search and section browsing work
- Gate 4: Metadata and graph work
- Gate 5: Read-only AI Ask works

## Completed Gates
- Gate 1 completed on 2026-04-28.

## Current Next Step
- AWS/deployment work is paused by request.
- Continue local development with policy-aware AI Ask quality tuning, search relevance refinement, parent/ancestor breadcrumb refinement, and repeatable search-vs-generic-answer evaluation against actual Confluence pages until the benchmark closes the remaining gap to the 90 similarity target.

## No-DB Rule
Throughout all phases:
- no relational DB
- no RDS-style persistence
- no local content shadow database
- Confluence remains the source of truth

## Infra Rule
- Default hosting is `S3 + CloudFront`.
- Add `API Gateway + Lambda` only for secret-bearing or policy-enforced operations.
- Keep the system deployable as a lightweight serverless web product.
