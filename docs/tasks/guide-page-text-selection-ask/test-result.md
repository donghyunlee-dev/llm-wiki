# guide-page-text-selection-ask Test Result

## Scope
- `PromptComposer.tsx`/`ArticleAskPanel.tsx`의 imperative handle 추가, 신규 `ArticleSelectionAskButton` 컴포넌트, `ArticlePage.tsx` 연결부 검증.

## Environment
- 로컬 dev server(`pnpm --filter @sfood/web dev --port 5183`), 목데이터 기반 `useWikiData`.
- Vitest + `@testing-library/react`(jsdom).
- Playwright MCP(Chromium), 뷰포트 1280x900(데스크톱), 390x844(모바일).
- Codex MCP(`mcp__codex__codex`, read-only sandbox)로 전체 diff 크리티컬 리뷰.

## Commands
- `pnpm --filter @sfood/web typecheck`
- `pnpm --filter @sfood/web test`
- `pnpm --filter @sfood/web build`

## Results
- `typecheck`: PASS (매 태스크마다 재실행, 최종 커밋 기준도 clean)
- `test`: PASS — 17 test files / 68 tests (신규: `ArticleSelectionAskButton.test.tsx` 10개, `PromptComposer.test.ts`/`ArticleAskPanel.test.tsx` imperative handle 테스트 각 1개 추가)
- `build`: PASS — `vite build` 정상 완료
- Playwright 데스크톱(1280x900) 라이트: PASS — 문장 드래그 선택 시 "질문하기" 버튼이 선택 영역 위에 표시됨.
- Playwright 실제 마우스 클릭(`page.locator().click()`, 합성 이벤트 아님): PASS — 클릭 후 Ask 패널 인풋에 선택 텍스트가 채워지고 `document.activeElement`가 해당 textarea로 확인됨.
- Playwright 다크 모드: PASS — 동일 동작, 색상 토큰 정상 반영.
- Playwright 컨테이너 바깥 선택(본문→TOC까지 드래그): PASS — React 리렌더 이후 버튼이 사라짐(동기 직후 조회 시 stale DOM이 보이는 타이밍 아티팩트가 있었으나, React flush 후 재확인하여 정상 동작 확인).
- Playwright 모바일(390x844): PASS — 버튼 노출/클릭/인풋 채움·포커스 모두 데스크톱과 동일하게 동작, 가로 스크롤 없음.
- Codex 크리티컬 리뷰(Task 1-4 전체 diff 대상): 2건 발견 —
  1. 버튼 클릭 시 mousedown이 브라우저의 선택 collapse를 유발해 `selectionchange`가 클릭보다 먼저 버튼을 숨길 수 있는 문제.
  2. `window` 스크롤만 감지해 코드블록/표 등 내부 스크롤 컨테이너 스크롤 시 버튼이 stale 좌표에 남는 문제.
  - 두 건 모두 수정(`onMouseDown`에 `preventDefault()`, `document` 캡처 단계 `scroll` 리스너로 교체) 후 커밋 `52ccc2b`.
- 수정 후 재검증(Playwright, 실제 브라우저): PASS — 실제 마우스 클릭으로 선택→클릭→인풋 채움 재확인, 코드블록 내부 스크롤(`scrollLeft` 변경 + `scroll` 이벤트) 시 버튼이 사라짐을 확인.

## Failure Notes
- 없음(모든 발견 사항은 Codex 리뷰 단계에서 잡혀 즉시 수정·재검증됨).

## Retest Results
- Codex 리뷰 수정 후 `pnpm --filter @sfood/web test -- ArticleSelectionAskButton`(10/10), 전체 스위트(68/68), `typecheck` 모두 재실행 통과.
- Playwright로 클릭 유실 방지/내부 스크롤 dismiss 두 가지 모두 실제 브라우저에서 재확인.

## Acceptance Criteria Coverage
- AC1~AC6: 위 Playwright 검증으로 충족.
- AC7: `typecheck`/`test`/`build` 전부 통과로 충족.
- AC8: Playwright 실제 브라우저 검증 + Codex 크리티컬 리뷰 및 발견 사항 반영으로 충족.
