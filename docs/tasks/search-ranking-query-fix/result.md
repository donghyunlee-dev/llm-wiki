# search-ranking-query-fix Result

## Delivered Scope

### 코드 (`apps/web/vite.config.ts`)

1. **Line 384**: `rankingRecommendedDocuments` 계산 쿼리 수정
   - `searchQuestion` (원래 한국어 질문) → `searchQuery` (Stage 1 이중언어 키워드)
   - 효과: "스킬" 토큰이 "skill"로 확장된 Stage 1 키워드가 추천/관련 페이지 랭킹에도 적용됨

2. **Line 307-311**: searchKeywords trim/filter 방어 코드 추가
   - `[""]` 같은 빈 문자열 포함 배열에서도 `searchQuestion` fallback이 정상 동작

## Root Cause Summary

Stage 2 컨텍스트 문서 검색(line 312-317)은 `searchQuery`를 사용하는데, 추천/관련 페이지 랭킹(line 384)은 `searchQuestion`을 사용해 일관성이 없었음. Stage 1의 이중언어 키워드 확장 효과가 랭킹에 반영되지 않아 "Claude Code Skills" 같은 영어 제목 페이지가 한국어 질문으로 검색 시 누락됨.

## Gaps

- 서버 측 `/api/wiki/ai/search` 핸들러의 regression 테스트 없음 (Codex Medium 지적) — Vite plugin 환경 테스트가 어려워 별도 태스크로 추적 권장.
