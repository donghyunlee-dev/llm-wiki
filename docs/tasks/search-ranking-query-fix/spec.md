# search-ranking-query-fix Spec

## Problem

"클로드 스킬과 코덱스 스킬의 차이점이 뭐지?" 검색 시 "Claude Code Skills" 페이지가 추천/관련 페이지에 나오지 않음.

## Root Cause

`vite.config.ts:384`에서 `rankingRecommendedDocuments` 계산 시 Stage 1 AI 키워드(`searchQuery`) 대신 원래 한국어 질문(`searchQuestion`)을 사용.

- Stage 2 컨텍스트 문서 검색: `searchQuery` 사용 (Stage 1 이중언어 키워드)
- 추천/관련 페이지 랭킹: `searchQuestion` 사용 (원래 질문) ← 버그

"스킬" 토큰은 "skill"로 확장되지 않아 "Claude Code Skills" 페이지가 랭킹 8개에 포함되지 않음.

## Scope

- `apps/web/vite.config.ts` 1줄 수정 (`searchQuestion` → `searchQuery`)

## Out of Scope

- `expandSearchTokenVariants`에 수동 매핑 추가 (CLAUDE.md 금지 패턴)
- AI 프롬프트 변경

## Acceptance Criteria

- AC1: "클로드 스킬과 코덱스 스킬의 차이점이 뒤지?" 검색 시 추천 또는 관련 페이지에 "Claude Code Skills" 포함
- AC2: `pnpm test` 전체 통과
- AC3: `pnpm typecheck` 통과
