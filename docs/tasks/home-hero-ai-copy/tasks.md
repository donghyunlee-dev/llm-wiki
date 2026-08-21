# home-hero-ai-copy Tasks

## Implementation Tasks
- [x] `homeContent.ts`: `BLOCKED_UI_TERMS`에서 `"AI Wiki"`, `"AI "` 제거
- [x] `homeContent.ts`: `hero.eyebrow`, `hero.title` 문구 교체
- [x] `homeContent.ts`: `search.placeholder`, `search.examples[0]` 문구 교체
- [x] `HomePage.tsx`: `hero.eyebrow` 렌더링 요소 추가
- [x] (재수정) 사용자 피드백 반영: "AI Agent" → "AI"로 단순화, title을 "AI에게 궁금한 것을 물어보세요"로 재확정

## Test Tasks
- [x] `pnpm test`
- [x] `pnpm typecheck`
- [x] Playwright 홈 화면 확인 (라이트/다크, 데스크톱/모바일)
- [x] Codex critical review

## Documentation Tasks
- [x] `docs/prd/implementation-status.md` 갱신
- [x] `test-result.md`, `result.md` 작성
- [x] `docs/prd/ui-spec.md`, `docs/prd/development-prompt-reference.md`의 "AI Wiki/bare AI 금지" 계약 갱신(Codex 리뷰에서 발견된 문서-코드 불일치)

## Progress Notes
- 사용자와 2차례 문구 조정(개발 포커스 → 활용/가이드 포커스) 후 최종 승인받아 진행.

## Review Notes
- Codex 1차 critical review 결과: (1) PRD 문서(`ui-spec.md`, `development-prompt-reference.md`) 미갱신 → 반영 완료, (2) `HomePage.test.tsx`가 eyebrow/placeholder 미검증 → assertion 추가 반영 완료, (3) 타이틀이 목적 대비 다소 넓게 읽힐 수 있음 → 사용자 재피드백으로 문구 자체가 재조정됨.
- Codex 2차 critical review(최종 문구 대상): "AI에게 궁금한 것을 물어보세요"가 챗봇으로 오해될 수 있다는 의견 → 실제 제품이 "최근 대화"+AI Ask 구조의 대화형 검색이라 문구가 실제 동작과 일치한다고 판단, 반영하지 않음.
