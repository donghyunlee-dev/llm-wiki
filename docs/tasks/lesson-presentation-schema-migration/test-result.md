# lesson-presentation-schema-migration Test Result

## Scope
레슨 콘텐츠 읽기 파이프라인 전체 재작성(신규 `lesson.presentation` 스키마 + `wiki.metadata` 평탄화 필드) — wiki-core 파싱/정렬/컴파일 계층, apps/web 렌더링 계층, 스냅샷 픽스처, 문서.

## Environment
- Node/pnpm 워크스페이스(6개 패키지), Vite dev server(snapshot 모드 + remote 모드 양쪽 확인)
- 실 Confluence 데이터: space `AIAW`, lesson docType 문서 23개, 실제 API 토큰으로 REST 직접 조회 및 앱 통합 확인
- Playwright MCP(실브라우저), 참고 사이트 https://sfood-ai-education.leedh84.chatgpt.site/ 대조

## Commands
- `pnpm typecheck` (워크스페이스 전체 6개 패키지)
- `pnpm test` (워크스페이스 전체)
- `pnpm --filter @sfood/wiki-core test`/`typecheck` (반복 실행, 파일별 TDD 사이클)
- `pnpm --filter @sfood/web test`/`typecheck` (반복 실행)
- 임시 dev server(snapshot 모드, 포트 5199) + Playwright 시각 확인
- 임시 dev server(remote 모드, 포트 5299, 실 Confluence 자격증명) + Playwright 시각 확인
- REST API 직접 조회(curl, `.env.local` 자격증명) — 실 스키마 실측 조사

## Results
- PASS — `pnpm typecheck` 전체 6개 패키지
- PASS — `pnpm test` 전체: wiki-core 255개, apps/web 180개, mcp-server 42개, edge-sidebar 23개, serverless 21개 (총 521개, 회귀 없음)
- PASS — snapshot 모드 dev server: `/lesson` 코스 개요(2개 레슨), 레슨 1(visual-split, hook/explanation/visual), 레슨 2(comparison/side-by-side, hook/explanation/visual/example), narration 토글, transitionToNext 배너, 학습 흐름 드로어 챕터 그룹 헤더 — Playwright로 전부 확인
- PASS — remote 모드 dev server(실 Confluence 23개 레슨): `/lesson` 코스 개요에 "23개 레슨 · 23개 장면 · 약 115분" 정확히 노출, 순서/챕터/예상 소요시간 전부 실제 메타데이터와 일치. 레슨 1 상세 화면이 참고 사이트의 동일 레슨과 텍스트·구조 거의 동일하게 렌더링됨(hook 큰 제목, explanation 본문, visual 블록의 번호 원+카드 3개, transitionToNext 배너) — 라이트/다크 + 데스크톱(1440px)/모바일(390px) 확인
- PASS — Codex 비판 리뷰에서 발견한 Critical 1건 + Medium 3건 전부 수정 후 재검증(아래 상세)

## Failure Notes (발견 후 즉시 수정됨)
- **[Critical] `wikiDataSource.ts`의 원격 JSON 재검증 계층이 `presentation`과 평탄화된 `wiki.metadata` 필드를 전혀 읽지 않고 있었음** — Codex 비판 리뷰(6c)에서 발견. `confluenceClient.ts`(서버/미들웨어 측 원본 Confluence 응답 파싱)만 고치고, 브라우저가 `/api/wiki-pages` JSON을 다시 파싱하는 `wikiDataSource.ts`의 별도 검증 계층을 놓쳤던 것 — 이 계층에서 걸러지면 실제 앱 사용 시 모든 레슨이 조용히 사라진다(스냅샷 모드는 이 계층을 거치지 않아 처음에는 발견하지 못함). `readLessonPresentationValue` 등 파싱 로직을 `lessonSemanticBlocks.ts`로 옮겨 두 파일이 공유하도록 재작성해 근본 수정(같은 종류의 재발 방지) — 회귀 테스트 추가(`wikiDataSource.test.ts`), 실 Confluence 데이터로 재확인(remote 모드 dev server, "23개 레슨" 정상 노출 확인).
- **[Medium] `CustomHtmlDiagramBlock`에 주입하는 `css` 문자열이 `</style` 시퀀스를 포함하면 `<style>` 태그를 조기에 닫을 수 있음** — 零폭 문자 삽입으로 리터럴 매칭만 깨는 방식으로 수정, 회귀 테스트 추가.
- **[Medium] 블록이 `order` 필드가 아니라 배열 순서대로 렌더링됨** — `readLessonPresentationValue`에 `order` 기준 정렬 추가, 회귀 테스트 추가.
- **[Medium] `wiki.metadata.order`가 소수/음수를 그대로 허용** — `Number.isInteger` 검증으로 강화(음수 자체는 저작 의도일 수 있어 거부하지 않고 정수 여부만 검증).

## Retest Results
- 위 4건 수정 후 `pnpm typecheck`/`pnpm test` 전체 재실행 — 전부 통과(wiki-core 255, apps/web 180).
- Critical 수정 후 실 Confluence remote 모드로 재확인 — 23개 레슨 전체 정상 노출 확인(수정 전에는 0개였을 것으로 추정, 직접 재현은 안 했으나 코드 경로상 확실).

## Acceptance Criteria Coverage
- AC1(코스 순서/챕터 그룹) — PASS(remote 모드 실 데이터로 확인, 학습 흐름 드로어 챕터 헤더 확인)
- AC2(blocks[] 렌더링, visual 블록 html+css) — PASS(snapshot + remote 모드 양쪽 확인)
- AC3(motion/interaction은 진입 애니메이션일 뿐 클릭 게이팅 없음) — PASS(참고 사이트 실측 후 스펙 정정, 코드에 클릭 게이팅 로직 자체를 두지 않음, 관련 유닛 테스트로 확인)
- AC4(transitionToNext 배너) — PASS
- AC5(다른 docType 회귀 없음) — PASS(`pnpm test` 전체 통과, guide/page 관련 테스트 전부 그린)
- AC6(레거시 H2 파서 제거 후 전체 통과) — PASS
- AC7(알 수 없는 kind 안전 처리) — PASS(유닛 테스트로 명시 확인)
