# AI Wiki Portal Platform Docs

## Purpose
This folder is the local product document set for the `AI Wiki Portal Platform` project. It consolidates the Confluence root page `63242286`, the product blueprint, the analysis hub, and the `Development Prompt` prototype into implementation-ready Markdown.

## Read Order
1. `product-prd.md`
2. `implementation-status.md`
3. `development-prompt-reference.md`
4. `architecture.md`
5. `data-spec.md`
6. `api-spec.md`
7. `ui-spec.md`
8. `search-flow-contract.md`
9. `ai-ask-prompt-guide.md`
10. `development-plan.md`
11. `source-index.md`

## Product Constraint
The core concept must not drift:
- Confluence is the canonical content source.
- Confluence documents are also the primary LLM context.
- The application does not introduce a separate DBMS or RDS-style product database for MVP.
- Any cache is non-authoritative and replaceable.

## Development Start Rule
Implementation starts from the `Development Prompt` home screen concept. The attached prototype file `sfood_wiki_home.jsx` is treated as the primary visual reference for the first UI step.

## Session Continuity Rule
- Every implementation step must update `implementation-status.md`.
- If scope, ordering, or completion state changes, update `development-plan.md` in the same turn.
- AI prompt changes must compare against `ai-ask-prompt-guide.md` before editing `aiAsk.ts`.
- Search and guide-page changes must also compare against `search-flow-contract.md` before code is touched.
- New sessions should read `implementation-status.md` before starting work.
- Do not rely only on task workspace docs for project progress; PRD docs must carry the latest step state too.

## Selected Delivery Shape
- Monorepo: `pnpm` workspace
- Web app: React + Vite SPA
- Primary deployment: AWS `S3 + CloudFront`
- Optional backend: `API Gateway + Lambda` only when browser-only execution is insufficient
