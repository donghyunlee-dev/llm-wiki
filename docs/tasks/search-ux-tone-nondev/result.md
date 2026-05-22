# Result: 검색 UX·답변 톤 개선

## 완료된 범위

### 1. 비개발자 사용자 프로필 반영
- `docs/prd/ai-ask-prompt-guide.md`에 사용자 프로필 섹션 신설
- `buildAiAskInstructions()` / `buildAiSearchInstructionsForIntent()` 양쪽에 지시 추가:
  - 사용자가 개발 배경 없는 사내 직원임을 명시
  - 기술 용어 첫 등장 시 괄호 설명 요구 (MCP, CLI, npm 등)
  - 일상 표현 우선 원칙 추가
  - "친구에게 설명하듯" 문체 강화

### 2. 추천/관련 페이지 명확한 분리
- 서버(`vite.config.ts`): AI가 직접 선택한 페이지를 `recommendedDocuments`(max 4),
  랭킹 기반 나머지를 `relatedDocuments`(max 4)로 분리 반환
- 클라이언트(`searchRecommendations.ts`): server-provided `relatedDocuments` 우선 사용,
  없으면 기존 방식으로 하위 호환

### 3. 빈 검색어 UX
- URL에 쿼리 없이 `/search` 접근: "궁금한 내용을 입력하면 관련 가이드와 함께 답변을 드립니다." 힌트 표시
- 빈 폼 제출: "검색어를 입력해 주세요." 힌트 2.5초 표시 후 자동 해제
- 접근성: `role="alert"`, `aria-describedby` 처리 포함

## 결정 사항

- 추천 페이지 최대 개수를 6 → 4로 줄이고, 그 차이를 관련 페이지로 활용
- 빈 제출 힌트는 타이머 기반 자동 해제(2.5초)로 구현. 직접 입력 시에도 즉시 해제

## 갭 / 후속 작업

- 실제 AI 답변 품질(비개발자 톤)은 OpenAI 환경에서 별도 확인 필요
- 랭킹 기반 검색 자체의 품질(시맨틱 검색 부재) 개선은 별도 태스크 대상
