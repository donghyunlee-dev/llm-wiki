# Search Answer Readability Tone Test Result

## 2026-05-19

- PASS: `pnpm --filter @sfood/wiki-core test`
  - 검색 프롬프트에 짧은 문단, 빈 줄 분리, 괄호 설명 금지 규칙이 포함되는지 검증
- PASS: `pnpm --filter @sfood/web test`
  - 긴 설명 문단이 2문장 단위 문단으로 분리되는지 검증
  - 짧은 문단은 그대로 유지되는지 검증
  - 답변 본문에 이미 `바로 할 일`, `확인 포인트`, `주의` 섹션이 있으면 구조화 보조 섹션 중복 렌더링을 숨기는지 검증
  - 일반 문장 속 `확인`, `주의` 표현은 섹션으로 오인하지 않는지 검증
- PASS: `pnpm --filter @sfood/wiki-core typecheck`
- PASS: `pnpm --filter @sfood/web typecheck`
- PASS: `pnpm typecheck`
- PASS: `pnpm test`

## 2026-05-19 Retest

- PASS: `pnpm --filter @sfood/web test`
- PASS: `pnpm --filter @sfood/web typecheck`

## 2026-05-19 Retest 2

- PASS: `pnpm --filter @sfood/web test`
- PASS: `pnpm --filter @sfood/web typecheck`
- PASS: `pnpm --filter @sfood/wiki-core test`
- PASS: `pnpm --filter @sfood/wiki-core typecheck`
- PASS: `pnpm typecheck`
- PASS: `pnpm test`

## 2026-05-19 Retest 3

- PASS: `pnpm --filter @sfood/web test`
- PASS: `pnpm --filter @sfood/web typecheck`
- PASS: `pnpm --filter @sfood/wiki-core test`
- PASS: `pnpm --filter @sfood/wiki-core typecheck`
- PASS: `pnpm typecheck`
- PASS: `pnpm test`

## 2026-05-19 Retest 4

- PASS: `pnpm --filter @sfood/web typecheck`
- PASS: `pnpm --filter @sfood/web test`

## 2026-05-19 Retest 5

- PASS: `pnpm --filter @sfood/web test`
- PASS: `pnpm --filter @sfood/web typecheck`
- PASS: `pnpm typecheck`
- PASS: `pnpm test`

## 2026-05-19 Retest 6

- PASS: `pnpm --filter @sfood/wiki-core test`
  - `mcp 설정페이지가 있지 않아?` 질문이 `page-lookup` intent로 분류되고, 페이지 검색 확인/링크 중심 프롬프트가 포함되는지 검증
- PASS: `pnpm --filter @sfood/wiki-core typecheck`
- PASS: `pnpm typecheck`
- PASS: `pnpm test`

## 2026-05-20 Retest

- PASS: `pnpm --filter @sfood/web test`
  - 정책 원천 링크가 있으면 정책 안내 메시지가 비어도 기본 문구로 정책 반영 박스를 노출하는지 검증
- PASS: `pnpm --filter @sfood/web typecheck`
- PASS: `pnpm typecheck`

## 2026-05-20 Retest 2

- PASS: `pnpm --filter @sfood/web typecheck`
- PASS: `pnpm --filter @sfood/web test`
- PASS: Playwright computed style check
  - 검색 입력창: 15px
  - 사용자 질문: 14px
  - AI 답변 본문/목록: 15px
  - AI 답변 heading: 17-19px, font-weight 700
