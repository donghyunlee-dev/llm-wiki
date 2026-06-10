# guide-page-toc-and-entity-rendering Test Result

## Executed Checks
- `pnpm --filter @sfood/wiki-core test`
  - PASS
- `pnpm --filter @sfood/web test`
  - PASS
- `pnpm typecheck`
  - PASS
- Playwright MCP on `http://localhost:5175/guides/agent-start`
  - PASS
  - `article-toc-level-2::before = "•"`, `article-toc-level-3::before = "—"`
  - `padding-left` grows from `24px` to `32px`, confirming visible hierarchy

## Acceptance Criteria Coverage
- AC1. 충족
  - level 2/3/4 목차 항목에 prefix marker와 증가한 padding 적용
- AC2. 충족
  - read model에서 escaped entity는 HTML용으로 한 번 풀고, summary/heading text는 실제 문자로 디코딩
- AC3. 충족
  - `confluenceReadModel.test.ts`, `GuidesPage.test.tsx` 회귀 추가 후 전체 테스트 통과

## Retest Notes
- Playwright live page에는 level 4 항목이 없어서, level 4 클래스 존재 자체는 web unit test로 보완했다.

## Skipped Checks
- Codex critical review
  - 현재 실행 주체가 Codex 세션이므로 별도 외부 Codex 비판 리뷰는 수행하지 못했다. 명시적으로 기록한다.
