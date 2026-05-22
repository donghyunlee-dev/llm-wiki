# search-answer-tone-explanatory Plan

## Summary
- Rewrite the search-answer tone instructions so the model explains like a friendly blog post for 초·중급 AI 바이브코딩 users.
- Keep the answer grounded in search results, but require a more explanatory opening, clearer transitions, and slightly more teaching-oriented framing.

## Impacted Modules
- `packages/wiki-core/src/lib/aiAsk.ts`
- `docs/prd/ai-ask-prompt-guide.md`
- `docs/prd/search-flow-contract.md`
- `docs/prd/implementation-status.md`
- `packages/wiki-core/src/lib/aiAsk.test.ts`

## Approach
- Update the system prompt for search and shared guidance so it explicitly asks for a warm, explanatory, blog-like tone.
- Add phrasing that tells the model to assume the reader is not yet comfortable with the document family and needs the flow explained.
- Preserve the existing answer structure and recommendation ordering rules.
- Add prompt-level tests that assert the new tone language is present.

## Validation Plan
- Run targeted unit tests for the prompt helpers.
- Run `pnpm typecheck`.
- Update the browser-visible contract only if the text order or visible sections need to change.

## Risks
- If the tone instruction is too strong, the model may become verbose and bury the actual action.
- If the tone instruction is too weak, the answer may remain terse and summary-like.

## Rollback Considerations
- Keep the change isolated to prompt text and prompt tests.
- Do not change ranking or page-selection behavior unless a later validation shows the tone depends on it.
