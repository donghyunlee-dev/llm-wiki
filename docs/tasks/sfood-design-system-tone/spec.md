# sfood-design-system-tone Spec

## Problem Statement
- 현재 `apps/web`의 컬러/폰트/배경/컴포넌트 스타일은 `apps/web/src/styles.css` 단일 파일(1756줄)에 하드코딩된 CSS 변수로 관리되고 있어, 사내 SFOOD 디자인 시스템(`@sfood/ui`)과 톤앤매너가 분리되어 있다.
- 부수적으로 확인된 버그 2건이 있다: (1) 검색 결과 화면에서 새 답변이 추가돼도 스크롤이 자동 이동하지 않음, (2) 가이드 문서 상세 페이지에서 sticky TOC가 상단 헤더와 겹침.

## Business Context
- 서비스 전체의 톤앤매너를 SFOOD 디자인 시스템 기준으로 통일해 브랜드 일관성을 확보한다.
- 사용자 확인 결과, 이 위키는 **일반 웹사이트(service) 축**을 기준으로 개편한다 (브랜드 컬러를 적극 노출하고 첫인상/가독성을 우선).

## Scope
- `@sfood/ui` 설치 및 Tailwind preset/global.css 연동.
- 색상, 폰트, 배경을 디자인 시스템 semantic 토큰(`--color-brand`, `--color-background`, `--color-surface`, `--color-foreground`, `--color-muted`, `--color-border`, 상태색 등) 기준으로 교체.
- 기존 커스텀 컴포넌트(카드, 버튼, 패널 등 `apps/web/src/ui/*`)의 스타일을 디자인 시스템 컴포넌트/토큰 기준으로 개편. 페이지 내부 구성(레이아웃, 정보 배치, 라우팅 구조)은 변경하지 않는다.
- 다크모드는 기존 `[data-theme="dark"]` 속성 토글 방식을 유지하되, 디자인 시스템 semantic 토큰의 다크 변형을 사용한다.
- 버그 수정:
  - `SearchPage.tsx`: 새 답변(turn)이 추가되거나 로딩→완료로 전환될 때 해당 turn으로 스크롤 이동.
  - `styles.css` / `ArticlePage.tsx` 관련: `.article-aside`(TOC)의 sticky top 오프셋을 실제 `.site-header` 높이에 맞춰 겹침 제거.
- Playwright를 사용한 화면별 기능/톤앤매너 회귀 테스트: 홈, 검색(질문 입력→답변→스크롤 확인), `/guides` 목록, 가이드/문서 상세(TOC 겹침 확인), 다크모드 토글.

## Out Of Scope
- 페이지 내부 정보 구성, 라우팅 구조, 기능 로직(검색 랭킹, AI 프롬프트, docType 노출 규칙 등) 변경 — Frozen Behaviors(`CLAUDE.md`) 영역은 손대지 않는다.
- `apps/edge-sidebar`, `apps/mcp-server` 등 `apps/web` 외 앱의 스타일 변경.
- 신규 기능 추가.

## User Or Operator Scenarios
- 직원이 홈에서 검색 → 답변을 받으면 화면이 새 답변 위치로 자연스럽게 스크롤된다.
- 직원이 가이드 문서를 읽으며 TOC를 스크롤해도 상단 헤더와 겹치지 않는다.
- 직원이 라이트/다크 모드를 전환해도 모든 화면에서 디자인 시스템 톤(브랜드 컬러/폰트/배경)이 일관되게 유지된다.

## Acceptance Criteria
- AC1: `apps/web`에 `@sfood/ui`가 설치되고, 색상/폰트/배경이 하드코딩 hex가 아닌 디자인 시스템 semantic 토큰을 참조한다.
- AC2: 홈/검색/가이드 목록/가이드 상세/문서 상세 화면에서 페이지 내부 구성(정보 배치)이 기존과 동일하게 유지된다.
- AC3: 검색 결과 화면에서 답변 turn 추가 시 자동 스크롤이 동작한다 (Playwright로 스크롤 위치 변화 확인).
- AC4: 가이드/문서 상세 화면에서 TOC가 스크롤 중 헤더와 겹치지 않는다 (Playwright로 겹침 없음 확인).
- AC5: 라이트/다크 모드 모두에서 명암비, 포커스 링 등 디자인 시스템 체크리스트 핵심 항목을 만족한다.
- AC6: `pnpm test`, `pnpm typecheck` 통과.

## Edge Cases
- 디자인 시스템 미설치 환경(예: 조직 GitHub 접근 불가)에서 `pnpm install` 실패 가능성.
- 기존 컴포넌트 중 디자인 시스템에 대응 컴포넌트가 없는 경우 (예: `WikiCodeBlock`, `WikiCallout`) — 토큰만 적용하고 구조는 유지.
- 검색 스크롤 자동 이동이 사용자가 위로 스크롤해 이전 답변을 읽고 있는 도중에 발생하는 경우 — 새 turn 추가 시점에만 스크롤하고 기존 스크롤 위치를 강제로 빼앗지 않는 것으로 한정(진행 중 스트리밍 매 프레임 스크롤 강제 금지).

## Assumptions
- `gh` CLI로 `sfood-it-dev-ax-org/SFOOD-DESIGN-SYSTEM` 조직 저장소 접근이 가능하다 (조사 단계에서 확인됨).
- 페이지 내부 구성을 바꾸지 않는다는 지시는 컴포넌트의 시각적 스타일(색/폰트/배경/모양)만 교체하고 레이아웃 순서·정보 구조는 그대로 둔다는 의미로 해석한다.

## Clarifications
- Q: 기간계 vs 일반 웹사이트 톤 중 어느 축을 기준으로 개편하는가?
  A: 일반 웹사이트(service) 축. (사용자 확인 완료)
