# notion-style-ui-refresh Test Result

## Scope
- `apps/web`의 Notion/Linear 스타일 개편(Task 1-6) 전체에 대한 회귀 검증: 자동화 테스트/타입체크/빌드 + Playwright 실브라우저 시각 확인(라이트/다크) + Codex 비판 리뷰(불가 시 사유 기록).

## Environment
- 브랜치: `feature/sfood-design-system-tone`
- 대상 화면: 홈(`/`), 검색(`/search?q=...`), `/guides` 목록, 가이드/문서 상세(`/guides/guide-claude-모델-선택-가이드-...`, `/guides/agent-start`)
- 테마: 라이트, 다크(`[data-theme="dark"]` 토글)

## Commands
- `pnpm test` — PASS (wiki-core 168, web 55, edge-sidebar 21, mcp-server 36, serverless 5)
- `pnpm typecheck` — PASS (전체 5개 워크스페이스 프로젝트)
- `pnpm --filter @sfood/web build` — PASS (`dist/assets/index-*.css` 108.74KB, `dist/assets/index-*.js` 379.99KB)
- `pnpm --filter @sfood/web dev` — Playwright 확인용 로컬 서버 정상 기동, 검증 후 종료함

## Playwright Checklist
- [x] 홈(라이트/다크): "시작 가이드" 카드에 컬러 테두리/배경(좌측 액센트 바 포함)이 전혀 없고 중립 회색 1px 테두리로만 구분됨을 스크린샷+computed style로 확인. 검색 hero 구조 불변.
- [x] 검색(라이트/다크): 사용자 질문이 우측 정렬 `rounded-full`/`bg-accent-soft` pill로 렌더링됨을 확인(라이트: 옅은 코랄 배경+진한 텍스트, 다크: 어두운 적갈색 배경+밝은 텍스트, 대비 양호). 답변 영역은 배경 없는 순수 텍스트.
  - 참고: 이 dev 환경에서 "ERP란 무엇인가요" 질의의 AI 답변 본문이 비어있었음(FAQ/추천/관련 페이지는 정상 렌더링) — 로컬 AI 백엔드/데이터 이슈로 보이며 이번 CSS/레이아웃 변경과 무관, 별도 조사 필요 시 후속 이슈로 분리.
- [x] `/guides`(라이트/다크): 구분선 리스트 레이아웃으로 렌더링됨 확인("전체 60개 중 60개 표시" — `guide` docType only Frozen Behavior 유지), 카드 박스/테두리 없음.
- [x] 문서 상세(라이트/다크, 실제 `guide` docType 문서): TOC 스크롤/클릭 시 활성 항목이 굵은 흰색/진한 텍스트로만(막대·배경 없이) 표시됨을 클래스 검사로 확인. 긴 헤딩("Claude Sonnet 5 — 에이전팅을 위한 새로운 기준" 등)이 2줄까지 자연스럽게 줄바꿈되며 간격이 답답하지 않음을 스크린샷으로 확인.
- [x] 모바일 뷰포트(390x844): `document.documentElement.scrollWidth === clientWidth === 375` — 가로 스크롤 없음.

### 검증 중 발견 및 수정한 실제 버그
- **`/guides/agent-start`(홈의 "시작 가이드" 카드가 링크하는 페이지)는 `ArticlePage`가 아니라 별도 컴포넌트 `StartingGuidePage`(`GuidesPage.tsx`)가 렌더링**한다는 사실을 라우터(`router.tsx`)에서 확인. `StartingGuidePage`는 TOC 마크업을 독립적으로 복제하고 있었고 Task 5의 스크롤스파이/활성 상태 기능이 전혀 없었음(클릭해도 아무 반응 없음, active 클래스 없음) — 가장 많이 방문될 피처드 페이지에서 기능이 누락된 실제 회귀/누락이었다.
  - 조치: `StartingGuidePage`에 `ArticlePage.tsx`와 동일한 패턴(activeHeadingId state, IntersectionObserver, handleTocClick)을 적용. 테스트 추가(`GuidesPage.test.tsx`에 클릭→active 클래스 검증 케이스). `pnpm test`/`typecheck`/`build` 재확인 통과. 커밋 `378a73f`.
  - 진단 과정에서 처음에는 "React 상태 업데이트가 DOM에 반영 안 됨"으로 오인했으나, `data-*` 속성/텍스트 마커를 이용한 단계적 격리 테스트 끝에 실제 원인(다른 컴포넌트가 렌더링됨)을 확인함. `console.log`는 Playwright MCP의 콘솔 캡처에서 보이지 않아(레벨 매핑 이슈로 추정) 진단에 사용하지 못했고, DOM 속성/텍스트 마커 방식이 더 신뢰할 수 있었다.

## Codex Critical Review
- **불가**: `mcp__codex__codex` 호출 시 "You've hit your usage limit... try again at Jul 29th, 2026" 응답을 받음. `docs/ops/spec-driven-workflow.md`의 "Codex가 불가능하면 test-result.md에 명시적으로 기록하고 진행한다" 규칙에 따라 이 사실을 기록하고, Codex 없이 검증을 완료한다.
- 대체 검증: `subagent-driven-development` 워크플로우에 따라 Task 1-6 각각에 대해 독립 subagent의 **spec-compliance review**(구현이 요구사항과 정확히 일치하는지 코드로 직접 확인)와 **code-quality review**(버그/일관성/스코프 위반 점검)를 별도로 수행했다. 이 과정에서 실제로 발견되어 수정된 이슈들:
  - Task 2: featured 카드가 라이트모드에서 페이지 배경과 거의 구분되지 않고 hover 피드백이 사라지는 회귀 → 중립 테두리 방식으로 재수정.
  - Task 4: `.document-list-item`이 전역 클래스라 `/projects`/정적 페이지에서 카드 스타일과 구분선을 모두 잃는 회귀 → `.document-list .document-list-item` 중첩 셀렉터로 스코프 한정, 베이스 규칙은 카드 스타일로 복원.
  - Task 5: 커밋에 무관한 디자인 토큰 마이그레이션이 섞여 들어간 문제(`git add` 스코프 실수) → 커밋 분리. `IntersectionObserver` 로직이 jsdom 한계로 테스트되지 않던 문제 → mock 기반 테스트 추가, sort 로직을 실제로 깨뜨려 테스트가 회귀를 잡아내는지 검증(mutation test) 후 복원.
  - 이번 세션(Task 8) 자체 Playwright 검증에서 위 "StartingGuidePage TOC 누락" 버그를 추가로 발견/수정.
- Codex 재시도 가능 시점(2026-07-29 이후) 별도 세션에서 전체 diff에 대한 독립 리뷰를 한 번 더 받는 것을 권장.

## Failure Notes
- 없음(발견된 이슈는 모두 위 과정에서 수정 및 재검증 완료).

## Retest Results
- 모든 수정 후 `pnpm test`(전체 워크스페이스), `pnpm typecheck`, `pnpm --filter @sfood/web build` 최종 재실행 — 전부 PASS.

## Acceptance Criteria Coverage
- AC1-AC6 (Task 1-6 구현): 완료, 코드 반영 및 Playwright로 실증됨.
- AC7 (`pnpm test`/`typecheck`/`build`): PASS.
- AC8 (Playwright + Codex 리뷰): Playwright 완료(라이트/다크 4개 화면 + 모바일). Codex는 사용량 한도로 이번 세션에서 수행 불가 — 위 대체 검증(subagent 2단계 리뷰 + 실브라우저 버그 발견/수정)으로 보완했으며, 이 사실을 명시적으로 기록함(스킵 아님).
