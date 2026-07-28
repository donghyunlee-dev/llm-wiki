# notion-style-ui-refresh Spec

## Problem Statement
- 직전 세션(`sfood-design-system-tone`)에서 `@sfood/ui` 디자인 시스템 토큰(컬러/폰트/radius)을 도입했고, 이후 사용자가 `@sfood/ui`의 브랜드 컬러 스케일을 `#d65050`(SFOOD 실사이트 강조색 기반 코랄 레드)로 갱신해 `pnpm update @sfood/ui`로 반영했다.
- 그 위에서 사용자가 지적한 잔여 문제:
  1. 가이드 문서 페이지가 오래된 스타일로 보인다.
  2. 우측 TOC의 폰트/간격이 불편하고 긴 제목에서 줄바꿈이 어색하다.
  3. 배경과 패널을 구분하는 컬러 방식이 구식(테두리/그림자 중심)으로 느껴진다.
  4. AI 서비스/블로그 사이트를 벤치마킹한, 낯설지 않은 톤을 원한다.

## Business Context
- 브레인스토밍(브라우저 시각 companion 사용)으로 3가지 방향(A. Notion/Linear 미니멀, B. Vercel/Stripe Docs, C. Medium 블로그)을 제시했고 사용자가 **A(Notion/Linear 미니멀)**를 선택했다.
- 사용자가 "레이아웃/구조까지 개편 허용"을 명시적으로 승인해, 색상 토큰 레벨을 넘어 레이아웃 구조(카드→구분선 리스트 전환 등)도 변경 대상에 포함한다.

## Scope
- **적용 대상**: `apps/web`의 전체 화면 — 홈, 검색(AI 답변), `/guides` 목록, 가이드/문서 상세(+TOC).
- **브랜드/컬러 체계**: 계속 `@sfood/ui` semantic 토큰(`--color-brand` 등)만 참조하고 새로운 원시 색상을 하드코딩하지 않는다.
- **디자인 원칙**:
  1. 완전히 플랫한 배경 구분 — 패널/카드의 `border`/`box-shadow`를 원칙적으로 제거하고 배경(`--color-background`)과 패널(`--color-surface`)의 명도 차이만으로 구분(모달/드롭다운 등 진짜 떠 있는 요소는 예외).
  2. AI-cliché 좌측 액센트 바 금지 — 강조는 옅은 회색 테두리 1px 또는 텍스트 색상/굵기 변화로만 표현.
  3. 타이포그래피 확대 — 본문 13px→14~15px, `line-height` 1.5→1.6~1.7, 제목 위계 차이 확대.
  4. 여백 확대 — `--space-page`/`--space-section`/`--space-block` 및 카드 간 `gap` 전반 상향.
  5. Accent 절제 — 브랜드 레드는 버튼/링크/포커스링/활성 텍스트에만 사용, 배경 틴트는 최소화.
- **화면별 변경**:
  - 홈: "시작 가이드" 카드 좌측 액센트 바 제거 → 1px 테두리로만 구분. 일반 추천 가이드 카드는 테두리 제거, hover 시에만 배경이 밝아짐.
  - 검색(AI 답변): 사용자 질문은 우측 정렬 + 옅은 배경의 pill 말풍선, AI 답변은 배경 구분 없는 순수 본문. 추천/관련 페이지 태그는 pill 배지.
  - `/guides` 목록: 카드형 박스 나열 → 구분선(divider) 기반 리스트로 전환. hover 시에만 배경이 밝아짐.
  - 가이드/문서 상세 + TOC: 줄간격/문단 간격 확대. TOC 좌측 액센트 바 제거, 활성 항목은 `foreground` + semi-bold, 비활성 항목은 `muted` 회색, 계층은 들여쓰기로만 구분, 긴 제목은 최대 2줄 줄바꿈 허용.
- **다크모드**: 동일한 `[data-theme="dark"]` 토글 메커니즘 유지, "플랫 배경"과 "좌측 바 금지" 원칙을 다크모드에도 동일 적용.

## Out Of Scope
- `apps/edge-sidebar`, `apps/mcp-server` 등 `apps/web` 외 앱.
- 검색/AI 프롬프트 로직, docType 노출 규칙(Frozen Behaviors, `CLAUDE.md`) 등 기능 로직 — 오직 시각/레이아웃만 변경한다.
- `/guides`의 `guide` docType only 필터, intro 문서 제외 로직 — 표현 방식(카드→리스트)만 바뀌고 필터 로직은 불변.

## User Or Operator Scenarios
- 직원이 홈/검색/가이드 목록/문서 상세를 오가며 Notion/Linear류의 플랫하고 여백이 넉넉한 톤을 일관되게 경험한다.
- 직원이 긴 문서를 읽으며 TOC를 스크롤할 때, 현재 보고 있는 섹션이 텍스트 굵기 변화만으로(막대 없이) 표시된다.
- 직원이 검색 답변에서 자신의 질문을 우측 정렬 pill 말풍선으로, AI 답변을 배경 없는 순수 텍스트로 구분해 본다.
- 직원이 라이트/다크 모드를 전환해도 플랫 배경 원칙과 좌측 바 금지 원칙이 동일하게 유지된다.

## Acceptance Criteria
- AC1: `.page-panel`, `.home-card`, `.home-guide-card`, `.document-list-item`, `.article-aside`, `.chat-guide-spotlight`, `.empty-card` 등 컨테이너 패널/카드에서 `border`/`box-shadow`가 제거된다 (버튼/입력/페이지네이션 등 기능 컨트롤은 기존 테두리 유지).
- AC2: 홈 "시작 가이드" 카드 및 TOC 활성 항목 어디에도 좌측 액센트 바가 남아있지 않다.
- AC3: 본문(`article-content`/`article-paragraph`) 및 TOC 링크의 글자 크기/줄간격이 확대된다.
- AC4: `/guides` 목록이 구분선 기반 리스트로 렌더링되고, 기존 `guide` docType only 노출 개수(Frozen Behavior)는 변하지 않는다.
- AC5: TOC에 스크롤에 따라 활성 항목이 텍스트 굵기(semibold)로만 표시되는 scroll-spy가 동작한다.
- AC6: 검색 페이지의 사용자 질문이 우측 정렬 pill(연한 배경)로 렌더링된다.
- AC7: `pnpm test`, `pnpm typecheck`, `pnpm --filter @sfood/web build`가 통과한다.
- AC8: Playwright MCP로 라이트/다크 각 4개 화면을 확인하고 Codex 비판 리뷰를 완료한다 (Task 8, 별도 세션에서 수행).

## Edge Cases
- `/guides` 카드→리스트 구조 변경 시 기존 `CategoryPage.test.tsx`가 구조에 의존하는 assertion을 갖고 있다면 깨질 수 있다 — 텍스트/무관한 클래스명 기준 assertion만 있는지 확인 필요.
- "완전히 플랫" 원칙이 과하면 접근성(경계 인지) 이슈가 생길 수 있어 포커스 링과 hover 상태는 명확히 유지한다.
- TOC 스크롤-스파이는 jsdom에 `IntersectionObserver`가 없어 유닛 테스트로는 클릭 기반 활성화만 검증 가능 — 실제 스크롤 동작은 Playwright(실브라우저)로만 확인 가능.

## Assumptions
- `@sfood/ui` React 컴포넌트는 직전 세션에서 확인된 이 실행 환경의 dist 빌드 미반영 이슈가 해결되지 않는 한 이번에도 CSS 토큰 레벨에서만 작업한다(정상 환경 재검증 필요, Open Gap 유지).
- TOC 활성 상태 도입은 2026-05-06에 기록된 "TOC 활성 하이라이트 제거" 결정을 대체하는, 이번 세션의 명시적 재도입 요청이다.

## Clarifications
- Q: 3가지 벤치마킹 방향(Notion/Linear, Vercel/Stripe Docs, Medium) 중 어느 것으로 진행하는가?
  A: A안(Notion/Linear 미니멀). (사용자 확인 완료)
- Q: 색상 토큰뿐 아니라 레이아웃 구조도 바꿔도 되는가?
  A: 예, 명시적으로 승인됨(카드→구분선 리스트 전환 등).
