# serverless-wiki-pages-endpoint Spec

## Problem Statement
- Local development can serve Confluence-backed wiki records through Vite `/api/wiki-pages`.
- Production deployment still needs an equivalent serverless endpoint so browser builds do not require secret-bearing Confluence settings.

## Business Context
- The static web app is intended for S3 + CloudFront.
- Confluence API credentials must stay server-side.
- The browser should continue consuming the same remote JSON contract used locally.

## Scope
- Add a minimal serverless package with a Lambda-compatible `GET /api/wiki-pages` handler.
- Reuse `wiki-core` Confluence fetching and remote payload shape.
- Return JSON and CORS headers suitable for API Gateway/CloudFront integration.
- Add unit tests for success, method rejection, missing env, and upstream failure.

## Out Of Scope
- Terraform, AWS deployment, or CI packaging.
- Changing the web UI route contracts.
- Adding a database or cache.
- AI Ask or write-back APIs.

## User Or Operator Scenarios
- API Gateway invokes the handler with Confluence env values configured and receives `{ "pages": [...] }`.
- The SPA points `VITE_WIKI_REMOTE_ENDPOINT` at the deployed endpoint and renders category/article/search routes.
- If env is missing or Confluence is unavailable, the handler returns a structured error response.

## Acceptance Criteria
- AC1: Handler uses only server-side env values for Atlassian credentials.
- AC2: Success response uses the existing `{ pages }` remote source contract.
- AC3: Non-GET requests return `405`.
- AC4: Missing env returns `500` without leaking secrets.
- AC5: Tests, typecheck, and build pass.

## Edge Cases
- API Gateway preflight `OPTIONS` should return a CORS OK response.
- Upstream Confluence failures should map to `502`.

## Assumptions
- Deployment tooling will bundle TypeScript later.
- Runtime is Node.js 22 or compatible.
