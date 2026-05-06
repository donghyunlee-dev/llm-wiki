# Architecture

## Architecture Summary
The product is a lightweight web-based monorepo built around a React + Vite single-page application. Confluence remains the canonical content source. The application fetches documents, normalizes them, filters visibility, builds view models and graph relationships, and serves a focused UX.

The MVP must not add a separate DBMS or RDS-style persistence layer. Any temporary cache or review state is non-authoritative.

## Selected Stack
This stack is fixed for the initial implementation unless a later approval changes it.

- Runtime: Node.js `22 LTS`
- Package manager and workspace: `pnpm 10` workspaces
- Frontend app: `React 19.2`
- Build tool: `Vite 7`
- Language: `TypeScript 5.9`
- Router: `React Router 7`
- Styling: `Tailwind CSS 4`
- Test baseline: `Vitest 3.2+` with `Testing Library`

## Why This Stack
- React 19.x is stable and aligns with the current React ecosystem direction.
- Vite 7 is modern, fast, and already aligned with current React and TypeScript tooling.
- React Router 7 bridges React 18 to 19 cleanly and still supports static SPA hosting.
- Tailwind CSS 4 reduces configuration overhead and fits Vite directly.
- Node 22 LTS is compatible with Vite 7 requirements and is a safer long-lived base for CI and AWS tooling.
- `pnpm` is the lightest practical monorepo choice here because workspaces are built in and no extra task orchestrator is required to start.

## System Boundary
- Confluence: source of page body, hierarchy, labels, attachments, version, and metadata properties
- Wiki web app: Home, category, article, search, and project-design entry flows
- Shared wiki modules: content fetch, normalization, visibility, graph, AI request orchestration
- Optional serverless edge/API layer: only when browser-only access to upstream services is not acceptable
- AI layer: read-only answer generation and suggestion generation with approval gates

## Monorepo Structure
The repository should stay monorepo-shaped even if MVP starts with one deployable app.

```text
/
├─ apps/
│  └─ web/                 # React + Vite SPA
├─ packages/
│  ├─ wiki-core/           # domain and application logic
│  ├─ ui/                  # shared presentational components if needed
│  ├─ config/              # shared tsconfig, eslint, build config
│  └─ serverless/          # optional Lambda handlers added only if needed
├─ docs/
│  ├─ ops/
│  ├─ prd/
│  └─ tasks/
├─ pnpm-workspace.yaml
└─ package.json
```

For the first implementation step, only `apps/web` and `packages/wiki-core` are required. `packages/ui` and `packages/serverless` should be added only when justified by actual code reuse or deployment needs.

## Recommended Logical Layers Inside The Monorepo
- Domain: `WikiPage`, `WikiMetadata`, `GraphEdge`, `CategoryView`, `SearchResult`, `AskAnswer`
- Application: get home, get category, get page, search, build graph, validate metadata, ask AI
- Adapters: route loaders, DTO mappers, route presenters, optional HTTP boundary modules
- Infrastructure: Confluence client, HTML sanitizer, attachment resolver, optional memory cache, AI provider adapter

## Required Components
- `ConfluenceClient`: fetch page, body, children, ancestors, labels, attachments, and content properties
- `PageNormalizer`: normalize Confluence responses into application models
- `VisibilityPolicy`: enforce public visibility rules before any UI/API response
- `MetadataService`: parse and validate `wiki.metadata`
- `DocumentGraphService`: derive prerequisites, next, related, and parent relationships
- `WikiQueryService`: build Home, category, article, and search read models
- `AiAskService`: answer with page-scoped accessible context only

## Current Runtime Shape
- `apps/web` renders the user-facing SPA and owns route-level state only.
- `packages/wiki-core` owns normalized wiki models, search helpers, and source adapters.
- The app currently ships with a `snapshot` source for local development and a `remote` source contract for live read-only Confluence delivery.
- Route/page components must read through the shared source boundary instead of importing fixture arrays directly.
- This keeps the browser build lightweight now and preserves the option to move the same source logic into Lambda later if upstream auth or policy requires it.

## Deployment Shape
Default deployment target is AWS serverless-friendly static hosting:

- `apps/web` build output deployed to `Amazon S3`
- CDN and HTTPS served through `Amazon CloudFront`
- SPA routing handled through CloudFront fallback to `index.html`
- Optional API layer added later with `Amazon API Gateway + AWS Lambda`

This means the MVP should be designed to run without a dedicated always-on backend. If the browser can safely call a controlled read endpoint, keep logic in the web app. If secrets, upstream auth, or policy enforcement require server execution, isolate only that logic into serverless functions.

## Frontend-First Runtime Policy
- Prefer route loaders and in-app modules over a custom backend for MVP.
- Keep fetch/normalize/visibility logic in shared modules that can run in either the SPA or a future Lambda function.
- Treat `packages/serverless` as an escape hatch, not the default starting point.
- Avoid server-only coupling in domain/application code so the same logic can be reused later in Lambda if needed.
- Prefer an environment-switched `snapshot|remote` source contract over duplicating page queries in UI components.

## Hard Constraints
- Do not move canonical content into a separate app database.
- Do not make UI visibility filtering the only protection for internal docs.
- Do not render Confluence HTML without sanitization and link rewriting.
- Do not allow AI write-back in the user-facing path.

## MVP Runtime Policy
- Canonical storage: Confluence only
- Cache: optional in-memory cache keyed by page ID and version
- Search index: derived in memory from visible documents for MVP
- Review queue: deferred until post-MVP or stored outside a DBMS if later required
- Primary delivery: static SPA on AWS
- Optional server execution: Lambda only for secrets, upstream auth, or policy-bound transformations

## Migration Guidance
Confluence normalization logic, route patterns, and wiki page layout ideas from the source analysis can be reused, but the new implementation should centralize section config, visibility filtering, and sanitization in shared application modules rather than scattering them across UI-only code.
