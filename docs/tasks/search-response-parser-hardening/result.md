# search-response-parser-hardening Result

## Delivered Scope
- Extracted search response parsing into a dedicated helper.
- Added a fallback recovery path for labeled schema fragments leaked into the answer body.
- Verified that the local service now preserves evidence and recommendations instead of degrading to empty fallback fields for the reproduced pattern.

## Changed Files
- `apps/web/src/lib/aiSearchResponse.ts`
- `apps/web/src/lib/aiSearchResponse.test.ts`
- `apps/web/vite.config.ts`
- `docs/tasks/search-response-parser-hardening/spec.md`
- `docs/tasks/search-response-parser-hardening/plan.md`
- `docs/tasks/search-response-parser-hardening/tasks.md`
- `docs/tasks/search-response-parser-hardening/test-result.md`
- `docs/tasks/search-response-parser-hardening/result.md`

## Key Decisions
- Treat nested-object-only JSON fragments as insufficient; require a full search payload before accepting the primary JSON parse path.
- Recover labeled schema fragments explicitly instead of relying on broad string cleanup in the visible answer only.

## Open Gaps
- Setup-question answers can still collapse into one line even when parsing succeeds.

## Next Steps
- Continue with setup-answer generation hardening until the same Claude CLI query consistently returns a multi-section answer.
