# search-composer-multiline-layout Plan

## Summary
- 검색/질문 입력기 공통 동작을 재사용 가능한 textarea composer로 정리하고, 홈 화면은 기존 카드 언어를 유지하면서 폭/간격만 더 조밀하게 재배치한다.

## Impacted Modules
- `apps/web/src/ui/pages/HomePage.tsx`
- `apps/web/src/ui/pages/SearchPage.tsx`
- `apps/web/src/ui/pages/CategoryPage.tsx`
- `apps/web/src/ui/pages/ArticleAskPanel.tsx`
- `apps/web/src/styles.css`
- 관련 렌더 테스트

## Architecture Approach
- 제출 로직은 각 페이지에 남기고, textarea 키 처리와 자동 높이 조정은 공통 UI 컴포넌트로 분리한다.
- 레이아웃 조정은 기존 CSS 클래스 위주로 수정해 구조 변경을 최소화한다.

## Data And API Impact
- API 스키마 변경 없음.
- 검색 질문 문자열은 기존과 동일하게 제출되며, 입력기 줄바꿈은 `trim()` 후 기존 submit 경로를 탄다.

## Validation Plan
- `pnpm --filter @sfood/web test`
- `pnpm typecheck`
- Playwright로 홈, 검색, 가이드, 문서 상세에서 입력 높이/엔터 동작/첫 화면 밀도 확인

## Risks
- textarea 자동 높이와 sticky dock 조합에서 모바일 높이 계산이 어색할 수 있다.
- Enter 전송 처리 시 IME 조합 중 submit 오작동이 생기지 않도록 방어가 필요하다.

## Rollback Considerations
- 공통 composer를 제거하고 각 페이지를 기존 input 기반으로 되돌리면 된다.
- 레이아웃 조정은 CSS 클래스 단위로 국소 롤백 가능하다.
