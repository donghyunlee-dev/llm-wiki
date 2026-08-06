# sfood-design-system-tone Result

## Delivered Scope
- `develop` 브랜치 생성, `develop`을 base로 하는 `feature/sfood-design-system-tone` 브랜치에서 작업.
- `@sfood/ui`(사내 디자인 시스템)를 `apps/web` 의존성으로 추가하고, `apps/web/src/styles.css`의 하드코딩된 컬러/폰트/배경/radius 토큰을 `@sfood/ui/tokens/base.css` + `tokens/semantic.css`가 제공하는 semantic 토큰(`--color-brand`, `--color-background`, `--color-surface`, `--color-foreground`, `--color-border`, `--font-sans`, radius 스케일 등)으로 전면 교체. 페이지 내부 구성(레이아웃/정보 배치)은 변경하지 않음.
- 톤 축은 사용자 확인에 따라 **일반 웹사이트(service)** — 브랜드 컬러(indigo 계열)를 적극 노출.
- 다크모드(`[data-theme="dark"]`)도 동일 토큰 체계로 재작성(디자인 시스템이 기본 제공하지 않는 다크 팔레트는 같은 `base.css` 원시 스케일 내에서 자체적으로 구성).
- 버그 2건 수정:
  - 검색 결과 화면에서 새 답변 turn이 추가되거나 로딩→완료로 전환될 때 자동 스크롤되지 않던 문제 (`SearchPage.tsx`).
  - 가이드 문서 TOC가 sticky 헤더와 겹치던 문제 (`styles.css`의 `.article-aside`).
- `pnpm test`/`pnpm typecheck`/`pnpm build` 통과, Playwright MCP로 홈(라이트/다크)/검색/`/guides`/가이드 상세/모바일 뷰포트 확인, Codex 비판 리뷰 완료(Critical 0).

## Changed Files
- `apps/web/package.json` — `@sfood/ui` 의존성 추가
- `apps/web/src/styles.css` — 디자인 시스템 토큰 import 및 색상/폰트/radius 재매핑, TOC sticky offset 수정, 마지막 하드코딩 red 잔재(`.chat-structured-answer a`) 제거
- `apps/web/src/ui/pages/SearchPage.tsx` — 답변 turn 자동 스크롤 로직 추가
- `docs/tasks/sfood-design-system-tone/{spec,plan,tasks,test-result,result}.md` — 태스크 문서
- `pnpm-lock.yaml` — `@sfood/ui` 의존성 반영 (커밋 시 이번 태스크와 무관한 기존 변경분과 분리 필요, 아래 Open Gaps 참고)

## Key Decisions
- **@sfood/ui는 CSS 토큰만 임포트, JS 컴포넌트는 임포트하지 않음.** 이 실행 환경의 pnpm이 git 의존성의 `prepare`(vite build) 스크립트를 격리된 임시 디렉터리에서는 성공시키지만(`dist/index.js` 383KB 빌드 로그 확인됨), 그 산출물을 최종 패키지 위치(`node_modules/.pnpm/.../@sfood/ui/dist`)에 반영하는 단계가 이 샌드박스에서 계속 누락되어(`pnpm install`/`--force`/`store prune`/lockfile 재생성 등 여러 방법 시도, 매번 동일하게 실패) `dist/index.js`를 통한 `<Button>`/`<Card>` 등 React 컴포넌트 import는 이 환경에서 불가능했습니다. 반면 `tokens/base.css`/`tokens/semantic.css`/`global.css`는 빌드가 필요 없는 순수 CSS라 정상 임포트됨을 확인했습니다. 따라서 "컴포넌트를 디자인 시스템 기준으로 변경"은 기존 커스텀 컴포넌트(버튼/카드/패널 등)의 시각적 스타일(색/반경/그림자)을 디자인 시스템 토큰 값에 맞춰 재작성하는 방식으로 구현했고, 실제 `@sfood/ui` React 컴포넌트로의 교체는 하지 않았습니다.
- **Tailwind v4 비호환으로 `@sfood/ui/global.css` 전체는 import하지 않음.** 해당 파일은 Tailwind v3 문법(`@tailwind base/components/utilities`)을 포함해 이 프로젝트의 Tailwind v4(`@import "tailwindcss"`) 파이프라인과 충돌 가능성이 있어, 순수 CSS 커스텀 프로퍼티만 담긴 두 토큰 파일만 import했습니다.
- **`--radius-xl/lg/md`는 리터럴 픽셀 값으로 재정의.** `@sfood/ui`의 `tokens/base.css`가 동일한 이름(`--radius-xl/lg/md`)을 전역 `:root`에 이미 선언하므로, 그대로 `var()`로 체이닝하면 같은 이름을 재귀 참조하며 세 단계가 모두 동일 값으로 붕괴하는 문제가 있어(자체 검증 및 Codex 확인) 디자인 시스템의 실제 스케일 값(16/12/8px)을 리터럴로 적용했습니다.
- **다크모드 팔레트는 자체 구성.** `@sfood/ui`의 `semantic.css`는 다크모드 기본값을 제공하지 않아(FAQ에 "직접 추가" 안내), 같은 `base.css`의 gray/brand 원시 스케일과 `color-mix()`를 사용해 자체적으로 구성했습니다.

## Open Gaps
- `@sfood/ui` React 컴포넌트(Button/Card/Modal 등)는 이 세션의 샌드박스 제약으로 실제 사용/검증하지 못했습니다. 정상적인 개발 환경(로컬/CI)에서 `pnpm install`을 재실행하면 `dist`가 정상 생성될 가능성이 높으며, 그 이후 컴포넌트 단위 교체(예: 버튼을 `<Button variant="primary">`로)를 후속 작업으로 진행할 것을 권장합니다.
- `pnpm-lock.yaml`에는 이번 태스크와 무관한 `apps/mcp-server` 관련 기존 변경분이 이미 섞여 있었습니다(세션 시작 시점부터 `M pnpm-lock.yaml` 상태). 커밋 시 `git add -p`로 `@sfood/ui` 관련 hunk만 분리해서 staging해야 합니다.
- `styles.css`는 1756줄 단일 파일로, 이번 작업은 최상단 색상/폰트/radius 토큰 레이어와 TOC/링크 관련 두 규칙만 수정하는 surgical 방식으로 진행했습니다. 파일 전체를 grep한 결과 브랜드 레드 하드코딩(`#e4002b` 계열)은 모두 제거했지만, 특수 목적의 `--guide-graph-*`(가이드 인덱스 그래프 시각화, 항상 어두운 캔버스로 의도된 위젯)는 사이트 톤과 무관한 전용 색상이라 범위에서 제외했습니다.
- 이번 세션에서는 `git commit`을 수행하지 않았습니다(사용자가 커밋을 요청하지 않음). 모든 변경은 워킹 트리에 존재하며 `feature/sfood-design-system-tone` 브랜치입니다.

## Next Steps
- 정상 환경에서 `@sfood/ui` dist 빌드를 확인한 뒤, `Button`/`Card`/`FormField` 등 실제 컴포넌트로 점진 교체하는 후속 태스크를 별도로 진행.
- 커밋 전 `pnpm-lock.yaml`의 관련 없는 변경분 분리.
- 사용자 승인 시 `develop` 브랜치로 병합 및 PR 진행.
