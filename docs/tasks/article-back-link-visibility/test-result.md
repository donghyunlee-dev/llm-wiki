# article-back-link-visibility Test Result

## Commands Executed
- `pnpm --filter @sfood/web test`(전체) → **PASS** (34 files / 208 tests, 신규 테스트 1건 포함, 회귀 없음)
- `pnpm typecheck`(전체) → **PASS**

## Unit Test
- `ArticlePage.test.tsx` 신규: 보이는 "목록으로" 텍스트, `href="/guides"`, `.guide-detail-content` 내부 배치를 검증. RED(수정 전 aria-label만 매칭, 보이는 텍스트 없음) → GREEN(수정 후) 확인.

## Playwright Review (로컬 dev 서버, 실제 원격 데이터)
| 확인 항목 | 결과 |
|---|---|
| 라이트 테마, 데스크톱(1440px) | "‹ 목록으로" 링크가 제목 바로 위, 본문 컬럼 안에 인라인으로 노출 |
| 다크 테마, 데스크톱 | 동일하게 정상 노출 |
| 모바일(390px) | 정상 노출, 레이아웃 깨짐 없음 |
| 클릭 내비게이션 | `/guides`로 정상 이동 |
| 콘솔 확인 | 기존부터 있던 `ArticleContentRenderer`의 key 경고 1건만 존재, 신규 에러 없음 |

## Codex Critical Review (2026-08-20)
- `.guide-detail-shell`의 `relative` 제거: `styles.css` 전수 검색 결과 이 컨테이너를 containing block으로 기대하는 다른 absolute 자식 없음(TOC는 sticky, ask dock은 fixed) — **안전 확인**.
- 새 스타일이 `.text-link`(13px/font-semibold)와 톤이 크게 어긋나지 않음 — **문제없음**.
- `aria-label`/`title` 제거: `BackArrowIcon`이 이미 `aria-hidden`이고 보이는 텍스트가 생겨 스크린리더가 "목록으로" 링크로 정상적으로 읽음 — **접근성 문제없음**.
- `StartingGuidePage`는 back link를 렌더하지 않아 이번 변경의 영향 없음 — **확인**.
- **Low**: 신규 테스트가 `.guide-detail-content` 내부 배치와 텍스트 노출은 검증하지만, CSS가 다시 absolute로 회귀해도 DOM 배치 자체는 유지되므로 완전한 레이아웃 회귀 가드는 아님 — 의미는 있으나 한계로 기록.

## Acceptance Criteria Coverage
| AC | 결과 |
|---|---|
| AC1: in-flow 렌더링 | PASS |
| AC2: "목록으로" 텍스트 항상 노출 | PASS |
| AC3: 클릭 시 기존과 동일 경로 이동 | PASS |
| AC4: `pnpm test`/`pnpm typecheck` 통과 | PASS |

## Retest Outcomes
- 해당 없음(최초 구현).
