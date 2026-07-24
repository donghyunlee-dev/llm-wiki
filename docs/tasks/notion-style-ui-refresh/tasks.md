# notion-style-ui-refresh Tasks

## Implementation Tasks
- [x] Task 1 — 핵심 패널/카드 표면 플랫화 (`.page-panel`, `.empty-card`, `.list-row-link`, `.document-list-item`, `.home-card`, `.article-aside`, `.chat-guide-spotlight`, `.home-guide-card`에서 `border`/`shadow` 제거)
  - 커밋: `5bc211a` — style: flatten core panel/card borders and shadows
- [x] Task 2 — 카드 단위 액센트 하이라이트(좌측 바/브랜드 틴트) 제거, 중립 톤 강조로 대체
  - 커밋: `bd78b2c` — style: replace accent-tinted featured card with neutral tone-only highlight
  - 커밋: `ab4f2d7` — fix: give featured guide card a neutral border instead of a background-only tone
- [x] Task 3 — 타이포그래피/여백 확대 (`.page-shell`, `.article-content`, `.article-paragraph`, `.article-toc`/`.article-toc-link`)
  - 커밋: `c51d63b` — style: widen typography and spacing across pages and article TOC
  - 커밋: `195427d` — style: widen article list/table text to match paragraph typography
- [x] Task 4 — `/guides` 목록을 박스형 카드에서 구분선(divider) 리스트로 전환
  - 커밋: `66e8b79` — style: convert /guides list from boxed cards to a divider list
  - 커밋: `164c44c` — fix: scope divider-list row style to /guides only, restore card look elsewhere
- [x] Task 5 — TOC 활성 헤딩 표시(텍스트 굵기 전용, 바 없음) — scroll-spy 도입
  - 커밋: `f3aedf4` — test: add jsdom environment for component interaction tests
  - 커밋: `4881ce3` — style: apply @sfood/ui design-system tokens across styles.css
  - 커밋: `a6c8f95` — feat: add TOC active-heading indicator via scroll-spy (text-weight only)
  - 커밋: `78ca7e1` — test: cover IntersectionObserver scroll-spy sort logic
- [x] Task 6 — 검색 페이지 사용자 질문을 pill 말풍선으로 전환
  - 커밋: `e4374ab` — style: restyle search question bubble as a light pill instead of a solid accent block
  - 커밋: `826e939` — style: use rounded-full instead of arbitrary radius for chat pill shape

## Documentation Tasks
- [x] Task 7 — 태스크 워크스페이스 문서(`spec.md`/`plan.md`/`tasks.md`/`test-result.md` 스켈레톤/`result.md` 초안) 작성 및 `docs/prd/implementation-status.md` 갱신 (이 커밋)

## Test Tasks
- [x] Task 8 — 전체 검증: `pnpm test`/`pnpm typecheck`/`pnpm --filter @sfood/web build` 전부 PASS, Playwright MCP로 라이트+다크 4개 화면(홈/검색/`/guides`/문서 상세) + 모바일 뷰포트 확인. Codex 비판 리뷰는 사용량 한도로 불가 — `test-result.md`에 사유 및 대체 검증 기록.
  - 커밋: `378a73f` — fix: extend TOC active-heading indicator to the starting-guide page (Task 8 Playwright 검증 중 발견한 실제 버그 수정)

## Progress Notes
- `git log --oneline d830979..HEAD`(2026-07-24 세션 시작 시점 `main` 기준)로 Task 1-6이 이미 이 브랜치(`feature/sfood-design-system-tone`)에 커밋되어 있음을 확인함.
- Task 5는 계획상 3개 커밋(`ArticlePage.tsx` scroll-spy, 신규 테스트, jsdom 환경 설정)으로 예상됐으나 실제로는 `4881ce3`(디자인 시스템 토큰 재적용)이 같은 구간에 끼어 있어 4개 커밋으로 기록됨 — 내용상 Task 5 범위(TOC 활성 표시 관련 스타일/테스트 인프라)에 해당해 함께 묶음.
- Task 8에서 Playwright로 `/guides/agent-start`의 TOC를 클릭했을 때 활성 클래스가 전혀 나타나지 않는 문제를 발견 → 라우터(`router.tsx`) 확인 결과 해당 경로가 `ArticlePage`가 아닌 별도 컴포넌트 `StartingGuidePage`로 렌더링됨을 확인, 동일 scroll-spy 로직을 이식하여 수정.

## Review Notes
- Task 1-6 각각 spec-compliance + code-quality 2단계 서브에이전트 리뷰 수행. 발견/수정 이슈: Task 2(배경 대비 회귀), Task 4(전역 클래스 스코프 회귀), Task 5(커밋 스코프 혼입, IntersectionObserver 테스트 커버리지 부재).
- Codex 비판 리뷰: 사용량 한도로 이번 세션에서 미수행(`test-result.md` 참고). 2026-07-29 이후 재시도 권장.
