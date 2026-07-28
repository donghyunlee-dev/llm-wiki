# search-unsupported-answer-detection-fix Test Result

## Automated
| Command | Result |
|---|---|
| `pnpm -r typecheck` | ✅ Pass |
| `pnpm -r test` | ✅ Pass — 317 tests (wiki-core 177, +2 new; web 65, 5 fixture updates) |
| `pnpm --filter @sfood/web build` | ✅ Pass |

New/updated tests in `searchAnswerState.test.ts`:
- Existing case (empty confluenceData + empty unsupportedClaims + exact hardcoded no-page phrasing) — still passes.
- **New regression test**: empty confluenceData + empty unsupportedClaims + phrasing that drifts from the hardcoded pattern (`"I'm sorry, but ...라는 주제로 정리된 페이지가 없습니다"`) — now correctly returns `true` (previously would have returned `false`, reproducing the live bug).
- **New**: non-empty confluenceData + non-empty unsupportedClaims → `false` (partially-supported answers still show recommendations).

`searchRecommendations.test.ts`: 5 existing tests had mock "answer" objects that omitted `confluenceData` entirely (meant to represent supported-answer scenarios but relying on incomplete mocks) — updated to include a realistic non-empty `confluenceData`, matching what the real API always returns.

## Live Verification (deployed `ai-search` Lambda, packages/serverless)
Before the fix, asking variations of a question about a nonexistent feature ("claude dispatch") produced inconsistent AI output — sometimes `unsupportedClaims` was populated (correctly suppressed recommendations), sometimes it came back empty with drifted phrasing (leaked 4 recommended + 4 related documents). After deploying the fix:

```
Q: "claude teleport 기능 설명해줘" (made-up nonexistent feature)
confluenceData: 0, unsupportedClaims: [], recommended: 0, related: 0
```

This is the exact failure combination (empty confluenceData, empty unsupportedClaims) — confirms recommendations are now correctly suppressed regardless of `unsupportedClaims`/answer phrasing.
