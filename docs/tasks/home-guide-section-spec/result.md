# home-guide-section-spec Result

## Delivered Scope

### docs/prd/ui-spec.md 수정

- **Featured guides copy**: "추가 추천 가이드 5개" → "최대 4개", guide 부족 시 있는 만큼 표시 명시
- **UX Rules**: "Show five" → "Show up to four additional... Fewer than four is acceptable"
- **Home Recommended Guides Rules 섹션 신규 추가**: 소스, 필터, 정렬, 개수, 시작 가이드 중복 제거, 총 표시 개수 명확화
- **Starting guide 매핑 규칙**: slug, title 패턴 2가지, id 순서로 fallback 명시; `nav` docType 허용; 홈+agent-start 라우트로만 노출 범위 제한
- **Guide List Rules**: `/guides`가 `guide` + `page` 모두 표시하도록 수정; `page` docType 기준 명확화 (public read model 조건)

### docs/prd/development-prompt-reference.md 수정

- "pinned starting guide plus five additional guides" → "up to four additional guides, dynamically selected"
- "/guides filters to guide documents only" → "guide or page docType" 포함으로 수정

## Decisions

- 홈 추천 가이드는 코드(`buildFeaturedGuides`)와 스펙이 이미 일치함을 확인 — 문서가 현실을 따라가지 못한 것이 원인
- 스냅샷 데이터 보강은 Out of Scope로 결정 (사용자 선택)

## Gaps

없음.
