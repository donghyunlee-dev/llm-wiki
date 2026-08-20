# article-back-link-visibility Plan

## Summary
- `ArticlePage.tsx`: `.article-back-link`를 `.guide-detail-shell`의 absolute 자식에서 `.guide-detail-content` 안 in-flow 요소로 이동, "목록으로" 텍스트 추가.
- `styles.css`: `.article-back-link`를 absolute 아이콘 버튼 스타일에서 in-flow 텍스트+아이콘 링크 스타일로 교체, `.guide-detail-shell`의 `relative` 제거(더 이상 필요 없음).

## Impacted Modules
- `apps/web/src/ui/pages/ArticlePage.tsx`
- `apps/web/src/ui/pages/ArticlePage.test.tsx`
- `apps/web/src/styles.css`

## Architecture Approach
- 커스텀 포지셔닝 로직 대신 일반 문서 흐름(in-flow)을 사용 — absolute 좌표 계산(패딩값과 정확히 맞춰야 했던 기존 방식)을 제거해 유지보수 부담도 줄인다.
- 기존 `BackArrowIcon`(이미 `aria-hidden`)을 그대로 재사용, 아이콘 옆에 보이는 텍스트만 추가.
- `aria-label`/`title`은 보이는 텍스트가 생겨 중복이라 제거.

## Validation Plan
- TDD: `ArticlePage.test.tsx`에 신규 테스트(RED 확인) — 보이는 "목록으로" 텍스트, `/guides` href, `.guide-detail-content` 내부 배치.
- `pnpm test`/`pnpm typecheck`.
- Playwright: 로컬 dev 서버에서 라이트/다크, 데스크톱/모바일 스크린샷 확인 + 클릭 내비게이션 확인 + 콘솔 에러 확인(기존 무관 경고 제외).
- Codex 크리티컬 리뷰: `.guide-detail-shell`의 `relative` 제거로 인한 다른 absolute 자식 영향 여부, 접근성, 스타일 일관성, 테스트 강도, `StartingGuidePage` 영향 여부.

## Risks
- `.guide-detail-shell`의 `relative` 제거가 다른 absolute 위치 자식에 영향을 줄 가능성 — `styles.css` 전수 검색 및 Codex 리뷰로 없음을 확인.
- 새 위치가 리딩 컬럼의 세로 공간을 조금 더 씀 — 사용자가 이미 동의한 트레이드오프.

## Rollback Considerations
- 코드/CSS 변경을 되돌리면 즉시 원상 복구(데이터 마이그레이션 없음).
