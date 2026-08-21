# home-hero-ai-copy Spec

## Problem Statement
- 홈 화면 히어로 문구("궁금한 것을 검색해보세요")와 검색 예시("업무 자동화는 어떻게 시작하나요?" 등)가 검색 범위를 특정하지 않아, 사용자가 이 위키를 회사 전반의 업무 지식 위키(ERP/WMS/OMS 등)로 오인하고 검색해 빈 결과를 얻는 문제가 있다.

## Business Context
- 이 위키는 AI/AI Agent 활용 및 AX 관련 가이드·지식을 찾는 용도이며, 회사 업무 시스템(ERP/OMS/WMS 등)과는 무관하다.
- 문구에 검색 범위를 명확히 드러내야 오검색을 줄일 수 있다.
- `BLOCKED_UI_TERMS`(`packages/wiki-core/src/lib/homeContent.ts`)에 "AI Wiki", "AI " 가 금지어로 등록되어 있어, 정체성을 드러내는 문구를 쓸 수 없었다. 이번 작업에서 해당 두 항목을 금지어 목록에서 제거한다.
- 사용자는 개발자가 아닌 일반 사용자도 포함되므로, "개발/환경설정" 프레이밍이 아니라 "활용 방법/가이드를 찾는다"는 지식 탐색 프레이밍을 사용한다.

## Scope
- `packages/wiki-core/src/lib/homeContent.ts`
  - `BLOCKED_UI_TERMS`에서 `"AI Wiki"`, `"AI "` 제거
  - `HOME_CONTENT.hero.eyebrow`, `HOME_CONTENT.hero.title` 문구 교체
  - `HOME_CONTENT.search.placeholder`, `HOME_CONTENT.search.examples` 문구 교체
- `apps/web/src/ui/pages/HomePage.tsx`
  - `home-title` h1 위에 `hero.eyebrow`를 렌더링하는 요소 추가(기존 `.home-eyebrow` CSS 클래스 재사용)

## Out Of Scope
- `hero.body` 렌더링 여부 (현재도 미렌더링 상태 유지)
- `.home-title`, `.home-eyebrow` CSS 스타일 변경 (기존 스타일 그대로 사용)
- `entryCards`, `projectDesign` 문구
- `BLOCKED_UI_TERMS`의 다른 항목(Confluence, DB 등)

## User Or Operator Scenarios
- 사용자가 홈 화면에 진입하면 "AI / AI Agent 활용 가이드"라는 라벨과 "AI 활용법이 궁금하신가요?"라는 제목을 보고, 이 위키가 AI/AX 활용 지식을 다룬다는 것을 바로 인지한다.
- 검색창 placeholder와 예시 문구를 통해 "AI Agent 활용 방법"과 같은 검색을 유도받는다.

## Acceptance Criteria
- AC1: 홈 화면에 eyebrow(작은 라벨) + title(h1) 2줄 구조가 렌더링된다.
- AC2: `BLOCKED_UI_TERMS`에 `"AI Wiki"`, `"AI "`가 더 이상 없다.
- AC3: `hero.eyebrow`, `hero.title`, `search.placeholder`, `search.examples[0]`이 합의된 문구로 교체된다.
- AC4: `pnpm test`, `pnpm typecheck` 통과.
- AC5: Playwright로 홈 화면 실제 렌더링(라이트/다크, 데스크톱/모바일) 확인.

## Edge Cases
- eyebrow 텍스트가 추가되어 히어로 섹션 높이가 늘어나 레이아웃이 깨지지 않는지 확인.
- `collectVisibleText()` 기반 금지어 테스트가 새 문구에 대해 여전히 통과하는지 확인.

## Assumptions
- `search.examples[1]`("AI 활용 프로젝트 사례 찾기"로 이미 합의됨)과 `[2]`("자주 묻는 질문 확인")는 사용자 승인 문구를 그대로 사용한다.
- eyebrow는 accent 색상의 작은 텍스트로, 기존 `.home-eyebrow` 클래스를 그대로 사용한다.

## Clarifications
- Q: 1줄 vs 2줄? → A: 기존에 준비돼 있던 eyebrow+title 2단 구조를 재사용하는 2줄 구성으로 결정(사용자 승인).
- Q: "개발" 프레이밍 vs "활용/가이드" 프레이밍? → A: 일반 사용자 대상이므로 "활용/가이드" 프레이밍으로 최종 결정(사용자 승인).
- Q: "AI Agent"라는 단어를 써도 되는가? → A: 일반 사용자에게 "Agent"가 어려운 단어라 제외하고, "AI"만 남기고 "AI에게 궁금한 것을 물어본다"는 행동 문장으로 마무리(사용자 승인, 최종 문구).
