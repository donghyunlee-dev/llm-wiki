# ai-ask-no-ops-context Result

## Delivered Scope
- Removed `ops` document input from `aiAsk` prompt construction.
- Removed `ops` prompt payload wiring from the Vite dev API.
- Updated the AI prompt guide to state that search questions do not read onboarding Q&A pages and do not use `ops` as AI input.

## Changed Files
- /home/donghyunlee/projects/SFOOD-LLM-WIKI/packages/wiki-core/src/lib/aiAsk.ts
- /home/donghyunlee/projects/SFOOD-LLM-WIKI/packages/wiki-core/src/lib/aiAsk.test.ts
- /home/donghyunlee/projects/SFOOD-LLM-WIKI/apps/web/vite.config.ts
- /home/donghyunlee/projects/SFOOD-LLM-WIKI/docs/prd/ai-ask-prompt-guide.md
- /home/donghyunlee/projects/SFOOD-LLM-WIKI/docs/prd/implementation-status.md
- /home/donghyunlee/projects/SFOOD-LLM-WIKI/docs/tasks/ai-ask-no-ops-context/spec.md
- /home/donghyunlee/projects/SFOOD-LLM-WIKI/docs/tasks/ai-ask-no-ops-context/plan.md
- /home/donghyunlee/projects/SFOOD-LLM-WIKI/docs/tasks/ai-ask-no-ops-context/tasks.md
- /home/donghyunlee/projects/SFOOD-LLM-WIKI/docs/tasks/ai-ask-no-ops-context/test-result.md
- /home/donghyunlee/projects/SFOOD-LLM-WIKI/docs/tasks/ai-ask-no-ops-context/result.md

## Key Decisions
- Kept `policy` documents in AI input.
- Left `ops` parsing available in the data layer, but removed it from AI prompt inputs.

## Open Gaps
- If future prompt tuning needs `ops`, the inclusion decision should be made explicitly in the prompt guide first.

## Next Steps
- Keep `aiAsk.ts` and `docs/prd/ai-ask-prompt-guide.md` aligned whenever AI input sources change.
