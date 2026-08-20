# article-back-link-visibility Spec

## Problem Statement
- 사용자가 가이드 상세 페이지의 뒤로가기 버튼을 리포트: "위치도 그렇고 버튼 모양도 별로이고, 바로 알아볼 수가 없다."
- 실측(Playwright, 라이트/다크): `.article-back-link`가 `.guide-detail-shell`(페이지 전체 폭 컨테이너) 기준 absolute 포지셔닝으로 화면 맨 왼쪽 가장자리에 떠 있고, 텍스트 라벨 없이 `‹` 아이콘만 있는 32×32px 정사각형 버튼이었다. 본문(제목/목차)과도, 헤더와도 시각적으로 연결되지 않아 고립된 요소처럼 보였다.
- 비교: `/guides` 목록 화면의 "홈으로 돌아가기"는 in-flow 텍스트/아이콘 링크인데, 상세 페이지만 다른 스타일(아이콘 전용, absolute)을 쓰고 있어 일관성도 없었다.

## Scope
- `ArticlePage.tsx`의 `.article-back-link`를 본문 리딩 컬럼(`.guide-detail-content`) 안, 제목 바로 위로 이동해 in-flow 렌더링.
- "목록으로" 텍스트 라벨을 아이콘과 함께 항상 노출.
- 더 이상 필요 없는 `aria-label`/`title` 속성 제거(보이는 텍스트로 대체), `.guide-detail-shell`의 `relative`도 함께 정리.

## Out Of Scope
- `StartingGuidePage`(back link 없음, 영향 없음 확인) 등 다른 화면의 내비게이션 스타일 변경.
- TOC, 문서 질문 패널 등 같은 페이지의 다른 컴포넌트.

## User Or Operator Scenarios
- 가이드 상세 페이지에 진입하면 제목 바로 위에 "‹ 목록으로" 링크가 눈에 띄게 보인다.
- 클릭하면 기존과 동일하게 해당 섹션 목록(`/guides` 등)으로 이동한다.
- 라이트/다크 테마, 데스크톱/모바일 모두에서 동일하게 보인다.

## Acceptance Criteria
- AC1: 뒤로가기 링크가 `.guide-detail-content`(리딩 컬럼) 내부에 in-flow로 렌더링된다.
- AC2: 링크에 "목록으로" 텍스트가 항상 보인다(아이콘 전용 아님).
- AC3: 클릭 시 기존과 동일한 경로(`/${section}`)로 이동한다(회귀 없음).
- AC4: `pnpm test`, `pnpm typecheck` 통과.

## Assumptions
- 절대 위치를 없애면서 `.guide-detail-shell`의 `relative`도 함께 제거 가능하다 — 이 컨테이너를 containing block으로 기대하는 다른 absolute 자식이 없음을 `styles.css` 전수 확인 및 Codex 리뷰로 검증.
