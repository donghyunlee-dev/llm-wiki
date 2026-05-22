# Tasks: 검색 UX·답변 톤 개선

## 구현 작업

- [ ] T1. `docs/prd/ai-ask-prompt-guide.md` — 사용자 프로필 섹션 및 비개발자 톤 규칙 추가
- [ ] T2. `packages/wiki-core/src/lib/aiAsk.ts` — buildAiAskInstructions / buildAiSearchInstructionsForIntent 비개발자 지시 추가
- [ ] T3. `packages/wiki-core/src/lib/aiAsk.test.ts` — 비개발자 톤 지시어 테스트 추가
- [ ] T4. `apps/web/vite.config.ts` — recommendedDocuments / relatedDocuments 분리 반환
- [ ] T5. `apps/web/src/ui/searchRecommendations.ts` — relatedDocuments 필드 추가 및 섹션 로직 업데이트
- [ ] T6. `apps/web/src/ui/searchRecommendations.test.ts` — server relatedDocuments 경로 테스트
- [ ] T7. `apps/web/src/ui/pages/SearchPage.tsx` — 타입 업데이트, 빈 상태, 빈 제출 힌트
- [ ] T8. `apps/web/src/styles.css` — chat-empty-hint / chat-input-hint 스타일

## 검증 작업

- [ ] V1. `pnpm test` 전체 통과
- [ ] V2. `pnpm typecheck` 통과
- [ ] V3. `pnpm build` 성공
- [ ] V4. 수동: `/search` 직접 접근 빈 상태 확인
- [ ] V5. 수동: 빈 입력 제출 힌트 확인

## 문서 작업

- [ ] D1. `docs/prd/implementation-status.md` 최신 작업 기록
- [ ] D2. `docs/tasks/search-ux-tone-nondev/test-result.md` 작성
- [ ] D3. `docs/tasks/search-ux-tone-nondev/result.md` 작성
