# claude-worktree-search-investigation Test Result

## Scope
- Investigate whether missing search output for `claude worktree를 설명하세요.` is caused by `wiki.metadata`/corpus filtering or by downstream retrieval.

## Environment
- Profile: local repository investigation
- Database: none
- External dependencies: Confluence API via `apps/web/.env.local`, local Vite dev API

## Commands
- `bash -lc "set -a; source apps/web/.env.local; set +a; node --input-type=module -e \"... fetch /wiki/api/v2/pages/95780877?body-format=storage and /wiki/api/v2/pages/95780877/properties?key=wiki.metadata ...\""`
- `pnpm dev`
- `curl -sS -m 60 -H 'Content-Type: application/json' -d '{"question":"claude worktree를 설명하세요."}' http://localhost:5174/api/wiki/ai/search`
- `bash -lc "set -a; source apps/web/.env.local; set +a; pnpm --filter @sfood/wiki-core test -- claudeWorktreeLiveTrace.test.ts --reporter=verbose"` (temporary live-trace test executed, then removed)

## Results
- PASS: Confluence page `95780877` exists in space `63111172`, status `current`, version `9`, title `[Guide] Claude Code Worktrees`.
- PASS: Page `95780877` has `wiki.metadata` with `docType=page`, `audience=intermediate`, `status=published`, and populated graph fields (`prerequisites`, `next`, `related`).
- PASS: The page body itself contains repeated `Claude Code worktree` / `git worktree` / `claude --worktree` content, so the source page content is not empty or malformed.
- PASS: The local `/api/wiki/ai/search` response for `claude worktree를 설명하세요.` still says no matching page exists and returns empty `confluenceData`, which reproduces the user-observed failure after property validation.
- PASS: Live retrieval trace shows the target page ranks only `23` in direct lexical ranking and `18` in `getIndexFirstSearchWikiDocumentsIn`, so it never enters the server's top candidate slice used for AI answer generation.
- PASS: The expanded AI context is built from the top-ranked `8-10` seeds and capped at `14`, so page `95780877` is absent before the AI call.
- PASS: The Stage 1 `fetchQueryUnderstanding()` call does not return usable JSON for this query in the reproduced run. The OpenAI response finished as `status: "incomplete"` with `incomplete_details.reason: "max_output_tokens"`, so the server falls back to regex intent classification and the raw user question.

## Failure Notes
- The reproduced `/api/wiki/ai/search` payload returned:
  - `answer`: "현재 위키에 해당 주제에 대한 페이지가 없습니다..."
  - `confluenceData`: `[]`
  - `unsupportedClaims`: `[]`
  - unrelated `recommendedDocuments` about generic Claude Code topics
- This combination indicates the failure is downstream of page property setup. Either retrieval did not surface page `95780877` strongly enough, or the AI answer stage rejected/ignored the retrieved context.
- Retrieval trace narrowed that further:
  - `classifyQuestionIntent("claude worktree를 설명하세요.")` => `concept`
  - `extractQuestionSubjects(...)` => `["claude"]`
  - concept-mode ranking strongly favors broad `guide` documents with `Claude` in title/summary
  - target page `95780877` is `docType=page`, not `guide`
  - the query token `worktree` is singular while the title/slug uses `Worktrees`, so strong title/slug token hits are weaker than expected and many generic Claude guides outrank it
- Because the page is absent from the AI context, the final "page does not exist" answer is a retrieval miss first, not an AI hallucination first.

## Retest Results
- Not applicable. This task was investigation-only.

## Acceptance Criteria Coverage
- AC1: PASS — page `95780877` is not blocked by missing/invalid `wiki.metadata`.
- AC2: PASS — the reproduced failure occurs after valid page/property inspection, inside the search/AI answer path.
- AC2: PASS — more specifically, the page drops out in candidate ranking/context construction before the AI answer can use it.
- AC3: PASS — commands and observed outputs are recorded above.
