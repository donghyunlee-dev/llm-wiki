# Search Answer Readability Tone Plan

## Summary
- AI 답변 지침서와 `aiAsk.ts` 검색 프롬프트를 함께 조정한다.
- `StructuredAnswerView`에 검색 답변용 긴 문단 분리 보정을 추가한다.
- 프롬프트와 렌더링 양쪽에 회귀 테스트를 추가한다.
- 페이지 존재/위치 질문을 별도 검색 의도로 분리해, 개념 설명보다 페이지 검색 결과 확인과 링크 안내를 우선하도록 조정한다.

## Impacted Modules
- `docs/prd/ai-ask-prompt-guide.md`
- `docs/prd/search-flow-contract.md`
- `packages/wiki-core/src/lib/aiAsk.ts`
- `packages/wiki-core/src/lib/aiAsk.test.ts`
- `apps/web/src/ui/StructuredAnswerView.tsx`
- `apps/web/src/ui/structuredAnswer.test.ts`

## Architecture Approach
- 생성 품질은 프롬프트에서 우선 제어한다.
- 이미 생성된 답변이 긴 단일 문단이면 UI에서 문장 경계 기준으로 보정한다.
- 목록/코드/표 파서는 그대로 두고, paragraph block 렌더링 직전에만 보정한다.
- `classifySearchQuestionIntent()`에서 페이지/문서/가이드/링크 존재 여부와 위치 질문을 `setup`보다 먼저 `page-lookup`으로 분류한다.
- `page-lookup` 프롬프트는 검색 결과 확인 여부, 일치/근접 페이지 링크, 짧은 부연만 요구하고 주제 개념 설명을 금지한다.

## Data And API Impact
- API 응답 스키마 변경 없음.
- 추천 문서, 관련 문서, 검색 후보 선정 변경 없음.
- 검색 랭킹은 유지하고, AI 답변 생성 의도와 출력 요구사항만 보정한다.

## Validation Plan
- `pnpm --filter @sfood/wiki-core test`
- `pnpm --filter @sfood/web test`
- `pnpm --filter @sfood/wiki-core typecheck`
- `pnpm --filter @sfood/web typecheck`
- 필요 시 `pnpm typecheck`

## Risks
- 자동 문단 분리가 짧은 설명까지 과도하게 나눌 수 있다.
- 링크가 포함된 문장의 마크다운을 깨면 안 된다.

## Rollback Considerations
- 프롬프트 문구와 `StructuredAnswerView` 문단 분리 함수를 되돌리면 기존 렌더링으로 복귀한다.
