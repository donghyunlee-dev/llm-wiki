# SFOOD Wiki Sidebar Extension

This is an isolated Manifest V3 browser side panel extension for local Chrome or Edge testing.

## Local Test

1. Run the wiki web app.

```bash
pnpm dev
```

2. Build the extension.

```bash
pnpm --filter @sfood/edge-sidebar build
```

3. Open one of these browser pages.

```text
chrome://extensions
edge://extensions
```

4. Enable Developer mode.
5. Choose Load unpacked.
6. Select this folder:

```text
apps/edge-sidebar/dist
```

7. Click the SFOOD Wiki extension toolbar action to open the side panel.

## Current Permission Scope

The MVP manifest grants host access only to:

```text
http://localhost:5173/*
```

Before testing against an internal deployed wiki URL, add that origin to `public/manifest.json` under `host_permissions`, rebuild, and reload the unpacked extension.

## Packaging

For manual sharing after local validation:

```bash
pnpm --filter @sfood/edge-sidebar build
```

Then package the generated `apps/edge-sidebar/dist` directory as the extension artifact. Store or enterprise deployment can be evaluated later after the target browser and distribution channel are decided.
