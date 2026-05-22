# ai-ask-prompt-guidelines Result

## Delivered Scope
- Added a Korean AI answer guideline document in `docs/prd/`.
- Clarified the page types AI should read and the answer order by question type.
- Added a breadcrumb in `aiAsk.ts` so future prompt edits start from the document.
- Updated PRD read order so the new guideline is part of the standard reading path.

## Changed Files
- /home/donghyunlee/projects/SFOOD-LLM-WIKI/docs/prd/ai-ask-prompt-guide.md
- /home/donghyunlee/projects/SFOOD-LLM-WIKI/docs/prd/README.md
- /home/donghyunlee/projects/SFOOD-LLM-WIKI/packages/wiki-core/src/lib/aiAsk.ts
- /home/donghyunlee/projects/SFOOD-LLM-WIKI/docs/tasks/ai-ask-prompt-guidelines/spec.md
- /home/donghyunlee/projects/SFOOD-LLM-WIKI/docs/tasks/ai-ask-prompt-guidelines/plan.md
- /home/donghyunlee/projects/SFOOD-LLM-WIKI/docs/tasks/ai-ask-prompt-guidelines/tasks.md
- /home/donghyunlee/projects/SFOOD-LLM-WIKI/docs/tasks/ai-ask-prompt-guidelines/test-result.md
- /home/donghyunlee/projects/SFOOD-LLM-WIKI/docs/tasks/ai-ask-prompt-guidelines/result.md

## Key Decisions
- Kept the prompt text in code, but made the document the first thing to read before editing it.
- Separated visible search behavior from AI prompt guidance.

## Open Gaps
- The guideline still mirrors some of the code-level intent; future prompt cleanup may simplify the duplication.
- If prompt ordering changes again, `docs/prd/ai-ask-prompt-guide.md` and `packages/wiki-core/src/lib/aiAsk.ts` should be updated together.

## Next Steps
- Keep `docs/prd/ai-ask-prompt-guide.md` aligned with `packages/wiki-core/src/lib/aiAsk.ts` whenever answer rules change.
