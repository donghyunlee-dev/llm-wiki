# sfood-design-system-tone Test Result

## 6a. Unit Test / Typecheck
- `pnpm typecheck` — 전체 워크스페이스(5개 프로젝트) 통과.
- `pnpm test` — 전체 통과: wiki-core 168, web 52, edge-sidebar 21, mcp-server 36, serverless 5.
- `pnpm --filter @sfood/web build` — 정상 빌드 (`dist/assets/index-*.css` 108.88KB, `--color-brand`/`--radius-lg` 등 디자인 시스템 토큰이 컴파일된 CSS에 반영됨을 확인).

## 6b. Playwright 리뷰 (Playwright MCP, 1280x800 및 390x844)
스크린샷은 세션 스크래치패드(`design-tone-review/`)에 저장 (저장소에는 커밋하지 않음).
- **홈(라이트)**: 브랜드 마크가 `#e4002b`(레드)에서 디자인 시스템 `--color-brand`(indigo, brand-600)로 교체됨. 페이지 구성(검색 hero → 추천 가이드 → CTA)은 기존과 동일.
- **홈(다크)**: `[data-theme="dark"]` 토글 정상 동작, 배경/카드/브랜드 컬러가 새 다크 팔레트(gray-900 기반 + brand-400)로 일관되게 적용됨. CTA 블록은 기존 설계대로 라이트 반전 유지(회귀 아님, 기존 동작).
- **/guides 목록**: `guide` docType only 노출 규칙(Frozen Behavior) 유지 확인(60개 중 60개 guide 표시), 다크 톤 카드 스타일 적용 확인.
- **검색 스크롤 버그 수정**: `/search?q=...` 질의 후 답변 완료 시 `window.scrollY`가 0 → 95로 이동함을 `browser_evaluate`로 확인. 새 turn 추가 및 loading→complete 전환 시 `scrollIntoView({behavior:"smooth", block:"start"})` 동작 확인.
- **TOC/헤더 겹침 버그 수정**: `/guides/agent-start` 진입 후 `window.scrollTo(0,600)`으로 스크롤, `.article-aside`(목차) 상단이 `.site-header` 아래로 명확한 여백(≈16px)을 두고 위치함을 확인. 겹침 없음.
- **모바일 뷰포트(390x844)**: `document.documentElement.scrollWidth === clientWidth === 375` 확인, 가로 스크롤 회귀 없음.

## 6c. Codex 비판 리뷰
- `mcp__codex__codex`로 `apps/web/package.json`, `apps/web/src/styles.css`, `apps/web/src/ui/pages/SearchPage.tsx` diff 전달, Critical 이슈 없음(blocker 없음) 확인.
- 확인된 항목: `--radius-xl/lg/md` 리터럴 처리(자기참조 회피) 타당, semantic 토큰 매핑(`--accent`→`--color-brand` 등) 정확, 다크모드 `color-mix()` 사용 문제 없음(레거시 브라우저 fallback 부재는 non-critical), `SearchPage.tsx`의 `turnRefs`/`lastScrolledTurnRef` 스크롤 로직에 메모리 누수·StrictMode 이슈 없음.
- 지적 사항(non-critical): 리뷰 시점에 staged 되어 있던 `pnpm-lock.yaml`에 이번 작업과 무관한 `apps/mcp-server` importer 항목이 섞여 있었음 → **반영**: `git reset`으로 전체 unstage, 커밋 시 이번 태스크 파일만 별도로 staging하도록 조치.

## 스킵/제약 사항
- `@sfood/ui`의 React 컴포넌트(dist/index.js)는 이 실행 환경의 pnpm 빌드 파이프라인이 컴파일 산출물을 최종 패키지 위치에 반영하지 못하는 환경 제약으로 임포트하지 못함(빌드 자체는 성공 로그로 확인됨, 산출물 영속화만 실패). CSS 토큰(`tokens/base.css`, `tokens/semantic.css`)은 정상 반영됨. 상세는 `result.md` 참고.
