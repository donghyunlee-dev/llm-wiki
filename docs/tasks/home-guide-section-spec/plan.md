# home-guide-section-spec Plan

## Impacted Areas

| 파일 | 변경 | 내용 |
|---|---|---|
| `docs/prd/ui-spec.md` | 수정 | 홈 추천 가이드 정의 추가, 개수 5→4, /guides 규칙 수정 |

## Approach

`ui-spec.md`의 다음 부분을 수정한다:

1. **UX Rules** (line 47): "Show five additional recommended guides below the starting guide."
   → "Show four additional recommended guides below the starting guide, selected from the most recently updated `docType=guide` pages in the corpus."

2. **Featured guides copy** (line 33): "추가 추천 가이드 5개" → "추가 추천 가이드 4개"

3. **Guide List Rules** (line 53): "/guides shows only documents with `metadata.docType === "guide"`."
   → "/guides shows documents with `metadata.docType === "guide"` or `"page"`, excluding intro-style guide pages."

4. **새 섹션 추가**: "Home Recommended Guides" — 동작 소스, 필터, 정렬, 개수 명시

## Validation Plan

1. 문서 내용 검토
2. `pnpm test` (코드 변경 없으므로 회귀 확인용)
3. Playwright: 홈 화면 가이드 섹션 스냅샷 확인
