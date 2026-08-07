# SFOOD AI Wiki — Notion/Linear 스타일 UI/UX 개편 설계

## 배경

직전 세션([[sfood-design-system-tone]] 태스크, `docs/tasks/sfood-design-system-tone/`)에서 `@sfood/ui` 디자인 시스템 토큰(컬러/폰트/radius)을 도입했다. 이후 사용자가 `@sfood/ui` 저장소의 브랜드 컬러 스케일을 `#d65050`(SFOOD 실사이트 강조색 기반 코랄 레드)로 갱신했고, 이번 세션에서 `pnpm update @sfood/ui`로 이미 반영 완료했다.

이번 개편은 그 위에서 진행하는 후속 작업이다. 사용자가 지적한 문제:
1. 가이드 문서 페이지가 오래된 스타일로 보임
2. 우측 TOC의 폰트/간격이 불편하고 긴 제목에서 줄바꿈이 어색함
3. 배경과 패널을 구분하는 컬러 방식이 구식으로 느껴짐
4. AI 서비스/블로그 사이트 벤치마킹으로 낯설지 않은 톤을 원함

브레인스토밍(브라우저 시각 companion 사용)을 통해 3가지 방향(A. Notion/Linear 미니멀, B. Vercel/Stripe Docs, C. Medium 블로그)을 제시했고 사용자는 **A(Notion/Linear 미니멀)**를 선택했다.

## 범위

- **적용 대상**: 전체 화면 — 홈, 검색(AI 답변), `/guides` 목록, 가이드/문서 상세(+TOC). 사용자가 "레이아웃/구조까지 개편 허용"을 명시적으로 승인했으므로 색상 토큰 레벨을 넘어 레이아웃 구조(카드→구분선 리스트 전환 등)도 변경 대상.
- **브랜드/컬러 체계**: 계속 `@sfood/ui` semantic 토큰(`--color-brand` 등)을 참조. 새로운 원시 색상을 하드코딩하지 않는다.
- **Out of scope**: `apps/edge-sidebar`, `apps/mcp-server` 등 `apps/web` 외 앱. 검색/AI 프롬프트 로직, docType 노출 규칙(Frozen Behaviors) 등 기능 로직은 변경하지 않는다 — 오직 시각/레이아웃.

## 디자인 원칙 (확정)

1. **완전히 플랫한 배경 구분**: 패널/카드의 테두리(`border`)와 그림자(`box-shadow`)를 원칙적으로 제거하고, 배경(`--color-background`)과 패널(`--color-surface`)의 명도 차이만으로 구분한다. 예외적으로 진짜 "떠 있는" 요소(모달, 드롭다운)에는 최소한의 그림자를 유지한다.
2. **AI-cliché 좌측 액센트 바 금지**: 카드나 리스트 항목을 강조하거나 활성 상태를 표시할 때 왼쪽 색상 바(left accent bar)를 사용하지 않는다 (사용자가 명시적으로 지적한 패턴, `feedback_no_ai_cliche_accent_bar` 메모리 기록됨). 강조는 (a) 옅은 회색 테두리 1px, 또는 (b) 텍스트 색상/굵기 변화로만 표현한다.
3. **타이포그래피 확대**: 본문 기준 크기를 13px→14~15px로, `line-height`를 1.5→1.6~1.7로 확대해 여유 있게. 제목(H1~H3) 위계 크기 차이를 지금보다 뚜렷하게.
4. **여백 확대**: `--space-page`/`--space-section`/`--space-block` 및 카드 간 `gap`을 전반적으로 상향.
5. **Accent는 절제**: 브랜드 레드는 버튼/링크/포커스링/활성 텍스트에만 사용하고 배경 틴트로는 최소화한다.

## 화면별 변경 사항

### 홈 (`HomePage.tsx`)
- 레이아웃 구성(검색 hero → 추천 가이드 → CTA)은 유지.
- "시작 가이드" 카드: 왼쪽 액센트 바 제거 → 다른 카드보다 살짝 진한 1px 테두리로만 구분.
- 일반 추천 가이드 카드: 테두리 제거, 배경 톤 차이 없이 hover 시에만 배경이 살짝 밝아짐.

### 검색 — AI 답변 (`SearchPage.tsx`)
- ChatGPT/Claude.ai류 채팅 UI를 참고: 사용자 질문은 우측 정렬 + 옅은 배경의 말풍선(pill), AI 답변은 배경 구분 없는 순수 본문 텍스트로 자연스럽게 이어지도록.
- 추천/관련 페이지 태그는 알약형(pill) 배지로.
- (기존 자동 스크롤 로직은 그대로 유지, 시각 스타일만 변경)

### `/guides` 목록 (`CategoryPage.tsx` / `GuidesPage`)
- 현재의 카드형 박스 나열을 구분선(divider) 기반 리스트로 전환 (블로그 아카이브 페이지 톤).
- 항목 hover 시에만 배경이 살짝 밝아짐, 평상시엔 얇은 `border-bottom` 구분선만.
- **Frozen Behavior 불변**: `guide` docType only 필터, intro 문서 제외 로직은 그대로 유지 — 이번 변경은 시각적 리스트 표현 방식만 바꾼다.

### 가이드/문서 상세 + TOC (`ArticlePage.tsx`, `ArticleContentRenderer.tsx`)
- 본문 읽기 폭 유지하되 줄간격/문단 간격 확대.
- **TOC 재설계**:
  - 왼쪽 액센트 바 제거.
  - 활성 항목: `foreground` 색상 + semi-bold. 비활성 항목: `muted` 회색.
  - 계층 구분은 들여쓰기로만 (기존 level-2/3/4 padding 체계 유지).
  - 긴 제목: 잘라내지 않고 자연스럽게 최대 2줄까지 줄바꿈 허용. 항목 간 `gap`과 `line-height`를 확대해 답답해 보이지 않게.
  - 헤더와의 sticky offset 겹침 수정(직전 세션에 이미 적용됨, `top-[88px]`)은 유지.

## 다크모드
- 동일한 `[data-theme="dark"]` 토글 메커니즘 유지. "플랫 배경" 원칙과 "좌측 바 금지" 원칙은 다크모드에도 동일 적용 — 지난 세션에서 구성한 `--gray-900` 기반 다크 팔레트 위에서 테두리/그림자만 걷어내는 방향으로 조정.

## 기술 접근
- 주 수정 파일: `apps/web/src/styles.css`(토큰 재조정 + 컴포넌트 클래스 다수 수정), `apps/web/src/ui/pages/CategoryPage.tsx`(카드→리스트 구조 변경 시 JSX 조정 필요할 수 있음), `apps/web/src/ui/pages/ArticleContentRenderer.tsx` 또는 TOC 렌더 부분(활성 클래스 로직), `apps/web/src/ui/pages/HomePage.tsx`(시작 가이드 카드 클래스).
- 기존 CSS 유틸리티 클래스 네이밍 패턴(`chat-*`, `article-*`, `site-*`)을 따르고 새 클래스 체계를 도입하지 않는다.
- `@sfood/ui` React 컴포넌트는 이전 세션에서 확인된 이 실행 환경의 dist 빌드 산출물 미반영 이슈가 해결되지 않는 한 이번에도 CSS 토큰 레벨에서만 작업한다 (정상 환경에서 재검증 필요 — Open Gap으로 유지).

## 검증 계획
- `pnpm test` / `pnpm typecheck` / `pnpm --filter @sfood/web build` 통과.
- Playwright MCP로 4개 화면(홈/검색/가이드목록/문서상세) 라이트+다크 스크린샷 확인, 특히:
  - TOC 긴 제목 2줄 줄바꿈 시 겹침/잘림 없음
  - 좌측 액센트 바가 어디에도 남아있지 않음(홈 카드, TOC 포함)
  - 카드/패널에 불필요한 테두리·그림자가 남아있지 않음
- Codex 비판 리뷰.

## 미해결 사항 / 리스크
- `/guides` 리스트를 카드→구분선 리스트로 바꾸면 기존 `CategoryPage.test.tsx` 스냅샷/구조 기반 테스트가 깨질 수 있음 — 테스트를 새 구조에 맞게 갱신 필요.
- "완전히 플랫"이 지나치면 접근성(경계 인지) 이슈가 생길 수 있음 — 포커스 링과 hover 상태는 명확하게 유지해 대비.
