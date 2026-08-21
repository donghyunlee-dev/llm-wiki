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

### 재설계 후 재검증 (텍스트 버튼 → 사이드바 아이콘 토글 + 접힘 rail)
- PASS: `pnpm typecheck`
- PASS: `pnpm test` (34 files / 208 tests, 회귀 없음)
- PASS: Playwright(홈, 데스크톱 1440x900, 다크) — 사이드바 우상단 chevron 아이콘 클릭 → `lg:w-10` rail로 축소 + 아이콘이 반대 방향으로 회전, 재클릭 → 원상 복귀
- PASS: Playwright(검색, 데스크톱, 라이트 테마) — 동일 왕복 동작, `aria-label="대화 목록 닫기"/"대화 목록 열기"`로 전환 확인
- PASS: Playwright(검색, 모바일 390x844) — 데스크톱 토글 버튼이 노출되지 않음(`hidden lg:flex`), 기존 "대화 목록"/"관련 페이지" 모바일 툴바와 드로어 정상 동작
- NOTE: 모바일 드로어 상단이 사이트 헤더(59px, z-40)에 일부 가려지는 현상을 관찰했으나, `git diff c5c4305 origin/develop -- apps/web/src/styles.css`로 해당 CSS 영역이 이번 변경과 무관함을 확인 — 사전 존재 이슈로 판단, 범위 밖으로 분류(수정하지 않음, `result.md` Open Gaps에 기록)

## Acceptance Criteria Coverage
- AC1: 충족(Playwright 확인)
- AC2: 충족(같은 버튼으로 재오픈 확인)
- AC3: 충족(모바일 스크린샷으로 기존 드로어 동작 유지 확인)
- AC4: 충족(홈/검색 양쪽 동일 패턴 적용 및 확인)
