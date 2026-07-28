# recommend-related-docType-allowlist Test Result

## Automated
| Command | Result |
|---|---|
| `pnpm -r typecheck` | ✅ Pass |
| `pnpm -r test` | ✅ Pass — 317 tests (web 67, +2 new: `searchRecommendations` docType-allowlist test, `ArticleAskPanel` suggested-next-pages docType test) |
| `pnpm --filter @sfood/web build` | ✅ Pass |
| `pnpm --filter @sfood/serverless build` | ✅ Pass |

## Live Verification (deployed `ai-search` Lambda)
```
Q: "자주 묻는 질문 목록이 어디 있어?"
answer: "...FAQ 인덱스 페이지에서 확인할 수 있어요..." (mentions the FAQ index page in prose)
recommendedDocuments: [guide/page docType only — no [FAQ] Index entry]
relatedDocuments: [guide/page docType only]
```
Confirms the `[FAQ] Index` document (docType `faq`) no longer appears in the recommended/related lists even when the answer text directly references it — the allowlist filters purely on docType, independent of what the AI's prose mentions.

```
Q: "FAQ 목차 페이지 보여줘"
recommendedDocuments: [('...', 'page')]
relatedDocuments: []
```
All returned items are docType `page`/`guide` only.
