# home-hero-ai-copy Test Result

## Scope
- 홈 화면 히어로 문구(`hero.eyebrow`, `hero.title`, `search.placeholder`, `search.examples`) 변경 및 `BLOCKED_UI_TERMS`에서 `"AI Wiki"`, `"AI "` 제거에 대한 검증.

## Environment
- Profile: local dev (`pnpm dev`, Vite, localhost:5173)
- Database: 해당 없음(정적 콘텐츠 상수 변경)
- External dependencies: 없음

## Commands
- `pnpm test`
- `pnpm typecheck`
- Playwright MCP로 `http://localhost:5173/` 접속 후 데스크톱(1440x900, 다크/라이트)·모바일(390x844, 라이트) 스크린샷 확인
- Codex(`mcp__codex__codex`)에 diff 전달해 critical review 수집

## Results
- PASS: `pnpm test` — 34 files / 208 tests 전체 통과 (기존 `HomePage.test.tsx` 하드코딩 문구 검증 2건 수정 후 통과, eyebrow/placeholder assertion 보강 후 재통과)
- PASS: `pnpm typecheck` — 전 워크스페이스 통과
- PASS: Playwright 육안 확인 — 데스크톱 다크/라이트, 모바일 라이트 모두 eyebrow+title 2단 구조가 레이아웃 깨짐 없이 렌더링됨
- PASS(반영 완료): Codex critical review — 아래 Failure Notes 참고, 지적된 항목 반영

## Failure Notes
- Codex 1차 리뷰 지적 항목:
  1. `docs/prd/ui-spec.md`, `docs/prd/development-prompt-reference.md`에 여전히 "AI Wiki/bare AI 금지" 계약이 문서로 남아 코드와 불일치 → 두 문서 모두 갱신하여 반영 완료.
  2. `HomePage.test.tsx`가 eyebrow/placeholder 신규 렌더링을 검증하지 않음 → assertion 추가 반영 완료.
  3. 타이틀이 목적(회사 업무 검색 방지) 대비 다소 넓게 읽힐 수 있다는 의견 → 사용자 재피드백으로 "AI Agent" 제거 및 문구 재조정되며 자연스럽게 반영됨.
  4. `search.examples`는 현재 홈 화면에 실제 렌더링되지 않는 값(콘텐츠 검증에만 사용)이라는 점 확인 — 기존부터 알려진 상태(`spec.md` Out Of Scope와 일치), 별도 조치 없음.
- 사용자 피드백: "Agent"라는 단어가 어렵다 → `eyebrow`/`title`/`placeholder`/`examples`에서 "AI Agent" → "AI"로 재조정, title을 "AI에게 궁금한 것을 물어보세요"로 재확정.
- Codex 2차 리뷰(최종 문구 대상): "AI에게 궁금한 것을 물어보세요"가 챗봇으로 오해될 수 있다는 의견 → 이 위키가 "최근 대화"+AI Ask(구조화된 AI 답변) 구조의 대화형 검색이라는 실제 동작과 일치한다고 판단해 반영하지 않음.

## Retest Results
- 1차 문서 갱신 + 테스트 assertion 보강 후 `pnpm test` 재실행하여 208/208 통과 확인.
- 2차 문구 재조정("AI Agent" → "AI") 후 `pnpm test`(208/208), `pnpm typecheck` 재실행하여 통과 확인, Playwright로 데스크톱(라이트/다크)·모바일 재확인.

## Acceptance Criteria Coverage
- AC1 (eyebrow+title 2줄 렌더링): PASS — Playwright 스크린샷으로 확인
- AC2 (`BLOCKED_UI_TERMS`에서 AI 관련 항목 제거): PASS — 코드 확인 + 관련 PRD 문서 동기화
- AC3 (문구 교체): PASS — `homeContent.ts` diff 및 스크린샷으로 확인
- AC4 (`pnpm test`, `pnpm typecheck` 통과): PASS
- AC5 (Playwright 라이트/다크·데스크톱/모바일 확인): PASS
