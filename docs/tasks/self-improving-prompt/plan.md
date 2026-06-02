# 구현 계획

## 기술 접근

### 아키텍처 흐름

```
[사용자 검색]
    ↓
[vite.config.ts 검색 핸들러]
    ↓ (TTL 캐시)
[loadPromptRulesFromConfluence] → Confluence "Prompt Rules" 페이지 읽기
    ↓
[buildAiSearchPromptContext(docs, question, policies, history, dynamicRules)]
    ↓
[buildAiSearchInstructionsForIntent(intent, dynamicRules)]
    → 기본 프롬프트 + 동적 규칙 주입
    ↓
[AI 답변 생성]
    ↓
[Playbook 기록 (기존)]

[매일 Claude 루틴]
    ↓ (MCP Atlassian Rovo 도구)
[Playbook 7일치 읽기 → 부족 패턴 집계]
    ↓
[Prompt Rules 페이지 갱신]
    ↓ (다음 캐시 TTL 만료 후 자동 반영)
```

### Confluence "Prompt Rules" 페이지 HTML 구조

```html
<p><em>마지막 갱신: YYYY-MM-DD HH:mm</em></p>
<h2>추가 답변 지침</h2>
<ul>
  <li>...</li>
</ul>
<h2>추가 키워드 힌트</h2>
<ul>
  <li>코덱스 → codex, Codex CLI</li>
</ul>
<h2>감지된 반복 실패 패턴</h2>
<ul>
  <li>...</li>
</ul>
```

서버는 `<h2>` 섹션 단위로 `<li>` 항목을 추출한다.

## 영향 범위

| 파일 | 변경 종류 | 내용 |
|---|---|---|
| `packages/wiki-core/src/lib/promptRulesLoader.ts` | 신규 | Confluence 규칙 페이지 파싱 |
| `packages/wiki-core/src/lib/playbookAnalyzer.ts` | 신규 | Playbook 실패 패턴 집계 |
| `packages/wiki-core/src/lib/aiAsk.ts` | 수정 | `DynamicPromptRules` import + 컨텍스트/instruction 확장 |
| `apps/web/vite.config.ts` | 수정 | 프롬프트 규칙 캐시 + 검색 핸들러에 주입 |
| `packages/wiki-core/src/index.ts` | 수정 | 신규 모듈 re-export |
| `apps/web/.env.example` | 수정 | `CONFLUENCE_PROMPT_RULES_PAGE_ID` 추가 |

## 리스크

| 리스크 | 대응 |
|---|---|
| 잘못된 규칙이 생성되어 답변 품질 저하 | Confluence 페이지를 직접 편집해 규칙 제거 가능, 다음 TTL 후 반영 |
| Confluence 읽기 실패 | try/catch + EMPTY_PROMPT_RULES 폴백 |
| 동적 규칙이 기존 프롬프트와 충돌 | 기본 프롬프트 뒤에 추가이므로 기존 규칙이 우선 |

## 검증 계획

1. `pnpm typecheck` 통과
2. `pnpm test` 전체 통과
3. `promptRulesLoader.test.ts`: HTML 파싱 단위 테스트
4. `playbookAnalyzer.test.ts`: 테이블 파싱 + 패턴 집계 단위 테스트
5. Playwright: "MCP 설정 방법" 검색 시 동적 규칙이 answer에 반영되는지 확인
