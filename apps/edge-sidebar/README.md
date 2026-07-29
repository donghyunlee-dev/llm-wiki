# SFOOD Wiki Sidebar Extension

A Manifest V3 browser side panel extension that talks to the deployed SFOOD AI Wiki (`https://ax-wiki.s-food.ai`) by default.

## Production Build (real wiki)

The extension calls two Lambda Function URLs directly (not relative `/api/...` paths — those only exist via Vite's local dev middleware, never on the deployed static site). Build with the real endpoints baked in:

```bash
VITE_AI_SEARCH_ENDPOINT="<ai-search Lambda Function URL>" \
VITE_WIKI_DOCUMENTS_ENDPOINT="<wiki-documents Lambda Function URL>" \
pnpm --filter @sfood/edge-sidebar build
```

Get both URLs from `docs/tasks/aws-static-site-and-ai-api-deployment/aws-setup-guide.md` (or `aws lambda get-function-url-config --function-name <name>`). Without these env vars, the build falls back to relative `{baseUrl}/api/...` paths, which only work against a local `pnpm dev` server (see below).

Load the extension:

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked**.
4. Select `apps/edge-sidebar/dist`.
5. Click the SFOOD Wiki toolbar action to open the side panel.

The side panel's Wiki URL setting defaults to `https://ax-wiki.s-food.ai` and can be changed per-user from the launcher's gear icon (stored in `chrome.storage.local`).

## Local Dev Build (against `pnpm dev`)

1. Run the wiki web app locally: `pnpm dev` (serves on `http://localhost:5173` with Vite's dev-only `/api/wiki/ai/search` and `/api/wiki/documents` middleware).
2. Build the extension without the endpoint env vars:

```bash
pnpm --filter @sfood/edge-sidebar build
```

3. Set the side panel's Wiki URL to `http://localhost:5173` via the launcher's gear icon.
4. Load unpacked as above.

## Permission Scope

`public/manifest.json` grants `host_permissions: ["<all_urls>"]` so the launcher can be injected on any page and the side panel can call whichever Wiki URL the user configures.

## Packaging

```bash
VITE_AI_SEARCH_ENDPOINT="<...>" VITE_WIKI_DOCUMENTS_ENDPOINT="<...>" pnpm --filter @sfood/edge-sidebar build
```

Package the generated `apps/edge-sidebar/dist` directory as the extension artifact. Store or enterprise deployment can be evaluated later after the target browser and distribution channel are decided.
