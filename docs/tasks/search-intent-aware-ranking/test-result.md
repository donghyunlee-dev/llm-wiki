# search-intent-aware-ranking Test Result

## Executed Checks
- `pnpm --filter @sfood/wiki-core test -- src/lib/wikiDocuments.test.ts src/lib/aiAsk.test.ts`
- `pnpm --filter @sfood/web test -- src/ui/searchRecommendations.test.ts src/lib/aiSearchResponse.test.ts src/ui/structuredAnswer.test.ts`
- `pnpm --filter @sfood/web typecheck`
- Live `/api/wiki/ai/search` calls against the dev server, including a cache-bypass history payload for `mcp가 뭐지?`

## Notes
- Unit tests passed after the ranking adjustments.
- The live API output changed away from the earlier setup-only behavior, but the dev-server cache/session still needs a clean restart check before we call the result final.
- The important regression check remains whether `mcp가 뭐지?` consistently lands on an overview/concept page family instead of a setup-only family.
