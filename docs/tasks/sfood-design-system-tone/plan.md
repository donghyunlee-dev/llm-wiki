# sfood-design-system-tone Plan

## Summary
`@sfood/ui` 디자인 시스템을 `apps/web`에 설치하고, 현재 `styles.css`에 하드코딩된 컬러/폰트/배경 변수를 디자인 시스템 semantic 토큰으로 교체한다. 페이지 레이아웃/구성은 유지하고 시각 톤만 교체한다(service 축). 동시에 검색 스크롤 버그와 TOC 헤더 겹침 버그를 수정한다.

## Impacted Modules
- `apps/web/package.json` — `@sfood/ui` 의존성 추가
- `apps/web/src/styles.css` — 색상/폰트/배경/radius CSS 변수 전체를 semantic 토큰 참조로 교체
- `apps/web/src/main.tsx`(또는 진입 CSS import 지점) — `@sfood/ui/global.css` import 추가
- `apps/web/src/ui/**` — 카드/버튼/패널 등 컴포넌트의 클래스/인라인 스타일이 디자인 시스템 토큰과 충돌하는 부분 정리
- `apps/web/src/ui/pages/SearchPage.tsx` — 답변 turn 자동 스크롤 로직 추가
- `apps/web/src/ui/pages/ArticlePage.tsx` 및 `styles.css`의 `.article-aside` — TOC sticky top 오프셋을 헤더 높이에 맞춰 수정

## Architecture Approach
1. 디자인 시스템 설치: `docs/USAGE.md` 절차대로 `package.json` 의존성 추가 → `pnpm install` → Tailwind preset/global.css 연동.
2. 토큰 매핑표 작성: 기존 변수(`--accent`, `--page-bg`, `--panel-bg`, `--card-bg`, `--font-display`, `--font-body` 등) → 디자인 시스템 semantic 토큰 1:1 매핑. raw hex(`#e4002b` 등)를 직접 참조하는 곳을 모두 토큰 참조로 치환.
3. 라이트/다크 두 블록(`:root`, `:root[data-theme="dark"]`) 각각 토큰 값으로 교체하되, 기존 `[data-theme="dark"]` 토글 메커니즘(`ThemeProvider.tsx`)은 그대로 둔다.
4. 컴포넌트 단위로 순회하며(홈 → 검색 → 가이드 목록 → 문서 상세 → FAQ/프로젝트) 하드코딩 색상/폰트가 남아있는지 점검하고 토큰 클래스로 치환. 페이지 내부 JSX 구조(엘리먼트 순서/배치)는 변경하지 않는다.
5. 버그 수정은 별도의 작은 단위 변경으로 처리: SearchPage에 turn 컨테이너 ref + `useEffect`로 마지막 turn `scrollIntoView`, TOC는 `.site-header` 실측 높이 기준으로 `top` 값 조정(CSS 변수화하여 하드코딩 매직넘버 방지).

## Data And API Impact
- 없음. 순수 프레젠테이션 계층 변경이며 API 계약, 데이터 스키마, 검색/AI 로직에는 영향을 주지 않는다.

## Validation Plan
- `pnpm test`, `pnpm typecheck` 전체 통과 확인.
- Playwright MCP로 순차 확인:
  1. 홈 화면 톤(컬러/폰트/배경) 및 레이아웃 불변 확인, 스크린샷.
  2. 검색: 질문 입력 → 답변 수신 → 새 turn으로 스크롤 이동 확인.
  3. `/guides` 목록: guide-only 노출 규칙(Frozen) 불변 확인, 톤 적용 확인.
  4. 가이드/문서 상세: TOC 스크롤 시 헤더와 겹치지 않음 확인.
  5. 라이트/다크 모드 토글 후 각 화면 재확인.
- Codex 비판 리뷰(diff 전달) 수행 후 지적 사항 반영.
- 결과는 `test-result.md`에 명령/결과/스크린샷 근거로 기록.

## Risks
- `@sfood/ui`가 private 조직 저장소이므로 CI/다른 개발자 환경에서 `pnpm install` 시 조직 접근 권한이 없으면 실패할 수 있다.
- 디자인 시스템에 대응 컴포넌트가 없는 커스텀 UI(코드 블록, 콜아웃 등)는 토큰만 적용하고 구조는 유지 — 완전한 "컴포넌트 교체"가 아닌 부분 적용이 될 수 있음을 결과 문서에 명시한다.
- 전역 CSS 변수 교체 범위가 넓어(1756줄) 일부 화면에서 시각 회귀가 발생할 수 있음 — Playwright 스크린샷 비교로 화면별 확인 필요.

## Rollback Considerations
- 모든 변경은 `feature/sfood-design-system-tone` 브랜치(base: `develop`)에서 진행되며 `main`/`develop`에 병합 전까지 격리된다.
- 문제가 발견되면 해당 브랜치를 폐기하거나 `git revert`로 개별 커밋 단위 되돌리기가 가능하도록 커밋을 의미 단위로 분리한다.
