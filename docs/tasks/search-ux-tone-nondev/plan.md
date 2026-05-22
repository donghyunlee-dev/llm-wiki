# Plan: 검색 UX·답변 톤 개선

## 영향 범위

| 파일 | 변경 이유 |
|------|-----------|
| `docs/prd/ai-ask-prompt-guide.md` | 사용자 프로필 추가, 비개발자 톤 규칙 추가 |
| `packages/wiki-core/src/lib/aiAsk.ts` | buildAiAskInstructions / buildAiSearchInstructionsForIntent 비개발자 지시 추가 |
| `packages/wiki-core/src/lib/aiAsk.test.ts` | 비개발자 톤 지시어 assertion 추가 |
| `apps/web/vite.config.ts` | recommendedDocuments(AI) + relatedDocuments(랭킹 나머지) 분리 반환 |
| `apps/web/src/ui/searchRecommendations.ts` | SearchAnswerLike에 relatedDocuments 추가, resolveSearchDocumentSections 업데이트 |
| `apps/web/src/ui/searchRecommendations.test.ts` | server-provided relatedDocuments 경로 테스트 추가 |
| `apps/web/src/ui/pages/SearchPage.tsx` | SearchAnswer 타입 업데이트, 빈 상태 UX, 빈 제출 힌트 |
| `apps/web/src/styles.css` | chat-empty-hint, chat-input-hint 스타일 추가 |

## 기술 접근법

### 1. 프롬프트 톤 강화

`buildAiAskInstructions()`와 `buildAiSearchInstructionsForIntent()` 양쪽에 추가:
- "사용자는 개발자가 아닌 사내 직원입니다. 프로그래밍 배경 지식 없이도 이해할 수 있는 설명을 써 주세요."
- "MCP, CLI, API, npm 같은 기술 용어를 쓸 때는 처음 등장할 때 괄호 안에 짧은 설명을 덧붙이세요. 예: MCP(AI가 외부 도구를 직접 사용하게 해주는 연결 방식)"
- "전문 용어를 일상 표현으로 바꿀 수 있으면 바꾸고, 꼭 써야 한다면 먼저 설명하세요."

### 2. 추천/관련 페이지 분리

서버(`vite.config.ts`) 변경:
```
기존: recommendedDocuments = (AI picks OR ranking picks).slice(0,6)
신규: recommendedDocuments = AI picks (max 4) OR ranking picks (max 4)
     relatedDocuments    = ranking picks filtered out recommendedDocuments (max 4)
```

클라이언트(`searchRecommendations.ts`) 변경:
- `SearchAnswerLike`에 `relatedDocuments?: SearchDocumentSummary[]` 추가
- `resolveSearchDocumentSections`: server-side relatedDocuments 있으면 그대로 사용,
  없으면 기존 방식(allDocuments 슬라이스)으로 fallback → 하위 호환

### 3. 빈 검색 UX

`SearchPage.tsx`:
- `!query && conversation.length === 0` → `<div className="chat-empty-hint">` 렌더링
- 폼 제출 시 빈 입력이면 `showEmptyHint` 상태 on → 2초 후 자동 off
- `showEmptyHint` 동안 input 아래 `<p className="chat-input-hint">` 표시

## 검증 계획

1. `pnpm test` — 모든 테스트 통과 확인
2. `pnpm typecheck` — 타입 오류 없음 확인
3. `pnpm build` — 빌드 성공 확인
4. 개발 서버에서 수동 확인:
   - `/search` 직접 접근 → 빈 상태 힌트 표시
   - 빈 입력 제출 → 힌트 표시
   - 검색 결과에서 추천/관련 페이지 분리 확인

## 리스크

- AI 결과가 recommend 0개일 때 relatedDocuments가 비어버릴 수 있음 → fallback 처리로 해결
- 프롬프트 추가로 답변 길이 변화 가능 → 기존 테스트 assertion 기준 확인 필요
