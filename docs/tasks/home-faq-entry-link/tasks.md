# home-faq-entry-link Tasks

## Implementation Tasks
- `search-flow-contract.md`에 AI 답변 노출 규칙과 정적 내비게이션을 구분하는 문구 추가
- `HomePage.tsx`의 `home-guides-header`에 FAQ 링크 추가(`home-secondary-button` 스타일 재사용)

## Test Tasks
- `pnpm test` 전체 회귀 확인
- Playwright로 데스크톱/모바일 레이아웃 확인

## Documentation Tasks
- `docs/prd/implementation-status.md`에 통합 요약 추가

## Progress Notes
- 계약 문서 구분 문구 추가 → `HomePage.tsx`에 FAQ 링크 추가(`HOME_CONTENT.entryCards`의 기존 FAQ 카드 데이터 재사용) 순서로 진행.

## Review Notes
- Codex 통합 리뷰(4건 묶음)에서 Minor 1건: `entryCards.find(...)!`(non-null assertion)이 향후 카드 구성 변경 시 크래시 위험 → `?? { title: "FAQ", href: "/faq" }` fallback으로 수정해 반영 완료.
