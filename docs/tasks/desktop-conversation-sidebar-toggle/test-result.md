# desktop-conversation-sidebar-toggle Test Result

## Scope
데스크톱 사이드바 접기/펼치기 왕복 동작(홈/검색), 모바일 드로어 회귀 없음, 라이트/다크 렌더링 검증.

## Environment
- 로컬 dev 서버(`pnpm dev`), 실제 Confluence 원격 데이터 + localStorage에 저장된 실제 대화("ERP 권한 신청")
- 브라우저: Playwright(Chromium), 데스크톱(1440x900) + 모바일(390x844)

## Commands
- `pnpm typecheck`
- `pnpm test`
- Playwright MCP로 홈/검색 양쪽에서 토글 클릭 왕복, 모바일 뷰포트 리사이즈 후 기존 드로어 확인, 라이트/다크 스크린샷

## Results
- PASS: `pnpm typecheck`
- PASS: `pnpm test` (34 files / 208 tests, 회귀 없음)
- PASS: Playwright(홈, 데스크톱) — "대화 목록 닫기" 클릭 → 사이드바 사라짐 + 버튼 라벨 "대화 목록 열기"로 전환 → 재클릭 → 사이드바 복귀
- PASS: Playwright(검색, 데스크톱) — 동일한 왕복 동작 확인
- PASS: Playwright(검색, 모바일 390x844) — 데스크톱 collapse 상태가 모바일 레이아웃에 영향 없음, 기존 모바일 드로어 툴바("대화 목록", "관련 페이지")가 정상 노출되고 사이드바는 화면 밖으로 숨겨진 기존 동작 유지(스크린샷 확인)
- PASS: 라이트 테마(데스크톱)·다크 테마(모바일) 스크린샷으로 레이아웃 확인
- PASS: Codex 크리티컬 리뷰(접근성 Minor 1건: 토글 버튼에 `aria-expanded`/`aria-controls` 부재) 반영 — 사이드바 컨테이너에 stable id 부여 후 속성 추가

## Failure Notes
없음.

## Retest Results
Codex 리뷰 반영 후 `pnpm typecheck`/`pnpm test` 재실행, 통과 유지.

## Acceptance Criteria Coverage
- AC1: 충족(Playwright 확인)
- AC2: 충족(같은 버튼으로 재오픈 확인)
- AC3: 충족(모바일 스크린샷으로 기존 드로어 동작 유지 확인)
- AC4: 충족(홈/검색 양쪽 동일 패턴 적용 및 확인)
