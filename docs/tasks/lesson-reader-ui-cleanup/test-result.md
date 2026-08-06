# lesson-reader-ui-cleanup Test Result

## Commands
- `pnpm --filter @sfood/web test -- --run LessonReaderPage LessonOutlineDrawer` — Pass (25 files / 158 tests, 후속 보강 후 159 tests)
- `pnpm test` (전체 워크스페이스) — Pass
- `pnpm typecheck` (전체 워크스페이스) — Pass

## Playwright Review (6b)
remote 모드 dev 서버(`vite --port 5299`, 실 Confluence 데이터)에서 실제 레슨(`ai는-미리-학습한-패턴을-활용하는-모델입니다`) 진입 후 확인:
- 라이트/다크 테마 모두에서 상단 카운터가 "2 / 23" 단일 표시로 나옴 (이중 표시 제거 확인).
- 라이트/다크 테마 모두에서 "이전" 버튼이 배경과 구분되는 채워진 형태로 보임(기존엔 배경과 같은 색이라 텍스트만 떠 있는 것처럼 보였음).
- "학습 흐름" 드로어를 라이트/다크 테마 모두에서 열어 챕터 헤더 아래 23개 항목이 제목만 있는 리스트로 표시되고, 레슨 제목 중복이나 "약 N분" 표시가 없음을 확인.
- 확인 후 스크린샷 파일과 `.playwright-mcp/` 임시 산출물, 검증용 dev 서버 프로세스는 모두 정리함.

## Codex Critical Review (6c)
`mcp__codex__codex`로 3개 변경(카운터 단일화, 이전 버튼 대비, 학습 흐름 중복 제거) 및 관련 테스트를 리뷰 요청.
- 지적 1(단일 카운터에 "이 레슨"/"전체" 레이블이 없어져 문맥을 잃음): 검토 결과 **의도된 설계** — 참고 사이트 비교 분석에서 확인한 "01/23" 형태의 단순 숫자 카운터를 맞추려는 것이 이번 수정의 목적이므로 레이블 없이 유지. `result.md`의 Key Decisions에 기록.
- 지적 2(다중 씬 레슨 시 씬 번호가 레슨마다 1부터 리셋): `spec.md`에 이미 허용된 엣지 케이스로 기록되어 있음, 실 콘텐츠(레슨:씬 1:1)엔 영향 없음 — 조치 없음.
- 지적 3(테스트가 레이블/시간 표시 "부재"를 직접 검증하지 않음): **반영** — `LessonOutlineDrawer.test.tsx`에 레슨 제목/"약 N분" 부재를 확인하는 테스트 추가, `LessonReaderPage.test.tsx`의 두 카운터 테스트에 `.lesson-reader-progress-item` 개수가 1개임을 확인하는 단언 추가.
- 삭제한 CSS 클래스(`lesson-reader-progress-label`, `lesson-outline-lesson-title`, `lesson-outline-lesson-minutes`)는 코드베이스 전체에서 다른 사용처 없음을 확인(dead code 삭제 안전).

## Acceptance Criteria Coverage
- AC1 (단일 카운터): 테스트 + Playwright로 확인
- AC2 (이전 버튼 대비): Playwright로 라이트/다크 확인
- AC3 (학습 흐름 단순화): 테스트 + Playwright로 확인
- AC4 (기존 네비게이션 회귀 없음): 전체 테스트 스위트 통과로 확인

## Skipped Checks
- 모바일 뷰포트 확인은 이번 변경(카운터/버튼/드로어 텍스트)이 반응형 레이아웃에 영향을 주지 않는 범위라 생략.
