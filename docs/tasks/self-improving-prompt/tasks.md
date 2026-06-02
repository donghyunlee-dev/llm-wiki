# 태스크 목록

## 구현

- [ ] 1. `promptRulesLoader.ts` 작성 (신규)
- [ ] 2. `playbookAnalyzer.ts` 작성 (신규)
- [ ] 3. `aiAsk.ts` 수정: `DynamicPromptRules` import, `AiSearchPromptContext` + `buildAiSearchPromptContext` + `buildAiSearchInstructionsForIntent` 확장
- [ ] 4. `vite.config.ts` 수정: 프롬프트 규칙 캐시 + 검색 핸들러 주입
- [ ] 5. `packages/wiki-core/src/index.ts` 수정: 신규 모듈 export

## 테스트

- [ ] 6. `promptRulesLoader.test.ts` 작성
- [ ] 7. `playbookAnalyzer.test.ts` 작성
- [ ] 8. `pnpm test` + `pnpm typecheck` 통과 확인

## 운영 설정

- [ ] 9. `apps/web/.env.example`에 `CONFLUENCE_PROMPT_RULES_PAGE_ID` 추가
- [ ] 10. Confluence에 "Prompt Rules" 초기 페이지 생성 (수동 or 루틴 첫 실행 시)
- [ ] 11. Claude schedule 루틴 등록 (schedule 스킬)

## 완료 기준

- [ ] `pnpm test` 전체 통과
- [ ] `pnpm typecheck` 통과
- [ ] Playwright 검색 동작 확인
- [ ] `result.md` 작성
