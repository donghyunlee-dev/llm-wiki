# article-back-link-visibility Result

## Delivered Scope
- 가이드 상세 페이지의 뒤로가기 버튼을 페이지 가장자리에 떠 있던 아이콘 전용 absolute 버튼에서, 본문 리딩 컬럼 안 제목 바로 위의 "‹ 목록으로" in-flow 텍스트+아이콘 링크로 교체.
- `.guide-detail-shell`의 더 이상 불필요한 `relative` 포지셔닝 제거.

## Changed Files
- `apps/web/src/ui/pages/ArticlePage.tsx`
- `apps/web/src/ui/pages/ArticlePage.test.tsx`
- `apps/web/src/styles.css`
- `docs/tasks/article-back-link-visibility/*`
- `docs/prd/implementation-status.md`

## Key Decisions
- 별도 새 컴포넌트 없이 기존 `Link`/`BackArrowIcon`을 재사용, 위치와 스타일만 교체 — 최소 변경.
- `aria-label`/`title` 제거 — 보이는 텍스트가 생겨 중복이라 판단(Codex 리뷰로 접근성 문제없음 확인).
- `/guides` 목록 화면의 "홈으로 돌아가기"와 완전히 동일한 컴포넌트로 통일하지는 않음(그쪽은 아이콘 전용 + 제목 옆 배치로 다른 맥락) — 대신 톤(13px/font-semibold, `.text-link`와 유사)만 맞춤.

## Validation
- `pnpm test`(34 files/208 tests, 회귀 없음), `pnpm typecheck` 통과.
- Playwright로 라이트/다크/모바일 시각 확인, 클릭 내비게이션 확인, 콘솔 에러 없음 확인.
- Codex 크리티컬 리뷰 완료 — 이견 없음, Low 1건(테스트가 CSS 레이아웃 회귀까지는 완전히 못 잡음)만 한계로 기록.

## Open Gaps
- 없음.

## Next Steps
- 없음(승인된 스코프 완료).
