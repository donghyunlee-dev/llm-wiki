# sfood-design-system-tone Tasks

## Implementation Tasks
- [x] `develop` 브랜치 및 `feature/sfood-design-system-tone` 브랜치 생성
- [x] `@sfood/ui` 의존성 추가 및 설치
- [x] `apps/web/src/styles.css` 라이트/다크 토큰을 디자인 시스템 semantic 토큰으로 재작성
- [x] radius/폰트 토큰 재작성 및 네이밍 충돌(자기참조) 회피
- [x] 검색 결과 자동 스크롤 버그 수정 (`SearchPage.tsx`)
- [x] TOC-헤더 겹침 버그 수정 (`.article-aside` sticky offset)
- [x] 잔여 하드코딩 브랜드 레드(`.chat-structured-answer a`) 제거

## Test Tasks
- [x] `pnpm test` 전체 통과 확인
- [x] `pnpm typecheck` 전체 통과 확인
- [x] `pnpm --filter @sfood/web build` 통과 확인
- [x] Playwright MCP: 홈(라이트/다크), 검색 스크롤, `/guides`, 가이드 상세 TOC, 모바일 뷰포트 확인
- [x] Codex 비판 리뷰 요청 및 반영

## Documentation Tasks
- [x] `spec.md` / `plan.md` / `tasks.md` / `test-result.md` / `result.md` 작성
- [ ] `docs/prd/implementation-status.md`에 세션 기록 추가

## Progress Notes
- `@sfood/ui` dist(React 컴포넌트 번들)는 샌드박스 제약으로 빌드 산출물이 최종 패키지 경로에 반영되지 않아 컴포넌트 임포트는 보류, CSS 토큰만 적용.

## Review Notes
- Codex: Critical 이슈 없음. non-critical로 `pnpm-lock.yaml`의 무관한 변경 혼입 지적 → unstage로 반영.
