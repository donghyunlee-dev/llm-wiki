# home-faq-entry-link Result

## Delivered Scope
`search-flow-contract.md`에 "AI 검색 답변 내 FAQ 노출 제한 규칙은 정적 내비게이션과 무관하다"는 구분 문구를 추가한 뒤, 홈 화면 "추천 가이드" 섹션 헤더에 기존 `home-secondary-button` 스타일을 재사용한 FAQ 진입 링크를 추가. `HOME_CONTENT.entryCards`에 이미 있던 FAQ 카드 데이터(지금까지 어디에도 렌더링되지 않던 죽은 데이터)를 실제로 사용.

## Changed Files
- `docs/prd/search-flow-contract.md`
- `apps/web/src/ui/pages/HomePage.tsx`

## Key Decisions
- 헤더 전역 내비게이션 개편이 아니라 홈 화면에만 좁게 FAQ 링크를 추가(사용자 승인 범위).
- Codex 리뷰 반영: `entryCards.find(...)!`(non-null assertion) 대신 `?? { title: "FAQ", href: "/faq" }` fallback으로 교체해 향후 `entryCards` 구성이 바뀌어도 모듈 평가 시점에 크래시하지 않도록 함.

## Open Gaps
없음.

## Next Steps
없음. 사용자 승인 범위 완료. (참고: `entryCards`의 나머지 3개 카드는 여전히 미사용 상태로 남아있음 — 별도 요청 없으면 그대로 둠.)
