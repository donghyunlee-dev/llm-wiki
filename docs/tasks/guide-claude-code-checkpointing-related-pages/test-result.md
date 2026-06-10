# guide-claude-code-checkpointing-related-pages Test Result

## Scope
- Verify whether the checkpointing guide's related-pages corruption originates in source content or in wiki app rendering.

## Environment
- Profile: local development
- Database: none
- External dependencies: Confluence-backed wiki payload, local Vite dev server, headless browser runtime

## Commands
- `npx playwright --version`
- `pnpm --filter @sfood/web dev --port 5174 --host 127.0.0.1`
- `curl -i -sS --max-time 20 http://127.0.0.1:5174/`
- `curl -sS --max-time 40 http://127.0.0.1:5174/api/wiki-pages`
- `google-chrome --headless --disable-gpu --no-sandbox --virtual-time-budget=8000 --dump-dom http://127.0.0.1:5174/guides/guide-claude-code-checkpointing`
- `google-chrome --headless --disable-gpu --no-sandbox --virtual-time-budget=8000 --screenshot=/tmp/guide-checkpointing.png http://127.0.0.1:5174/guides/guide-claude-code-checkpointing`

## Results
- PASS: Local dev server started and served the app at `http://127.0.0.1:5174`.
- PASS: `/api/wiki-pages` returned the checkpointing guide record.
- PASS: The raw payload for `[Guide] Claude Code Checkpointing` already contains malformed related-pages HTML inside `bodyHtml`.
- PASS: The rendered browser DOM shows the same malformed related-pages block, including literal `&lt;ul&gt;` / `&lt;li&gt;` text and nested broken anchor markup.
- PASS: The screenshot confirms the related-pages section is visibly corrupted in the browser.
- FAIL: `npx playwright --version` could not complete because the environment could not resolve `registry.npmjs.org` (`EAI_AGAIN`), so the browser verification used local Chrome headless instead of the Playwright package.

## Failure Notes
- The issue is not introduced by the local article renderer alone.
- The upstream page body already contains broken HTML in the related-pages section, so the app is faithfully rendering a malformed source.
- Playwright package installation was blocked by network/DNS access, so the verification used the local browser binary as a fallback.

## Retest Results
- No code fix was applied in this task, so no retest after changes was required.

## Acceptance Criteria Coverage
- AC1: satisfied
- AC2: satisfied
- AC3: satisfied
