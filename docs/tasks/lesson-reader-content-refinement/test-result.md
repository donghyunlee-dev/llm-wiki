# lesson-reader-content-refinement Test Result

## Commands
- `pnpm --filter @sfood/wiki-core test -- --run lessonPresentation` — Pass (11 tests)
- `pnpm --filter @sfood/web test -- --run` — Pass (25 files / 158 tests)
- `pnpm test` (전체 워크스페이스) — Pass
- `pnpm typecheck` (전체 워크스페이스) — Pass

## Playwright Review (6b)
remote 모드 dev 서버(`vite --port 5299`, 실 Confluence 데이터)에서 라이트/다크 테마로 확인:
- `/lesson`: 가로형 1열 리스트, 번호+제목+100자 설명(말줄임), 시간/완료 뱃지 없음.
- 레슨 리더 일반 씬: 축소된 타이틀 폰트, 넓어진 세로 간격, "교육 설명" 탭이 기본 노출 + 여러 문단으로 분리된 텍스트, 우측 하단에 작은 "다음: ..." 안내 카드, 하단 풋터에 이전/카운터(N/23)/다음.
- 레슨 리더 마지막 씬(23/23): "레슨 완료" 라벨/체크 표시 없이 "다음" 버튼만 노출, 클릭 시 목록으로 이동 확인.
- 학습 흐름 드로어: 이전보다 조밀해져 스크롤 없이 더 많은 챕터/항목이 한 화면에 보임.
- 확인 후 스크린샷과 `.playwright-mcp/` 산출물 정리. 개발 서버는 사용자가 직접 확인 중이라 종료하지 않고 유지.

## Codex Critical Review (6c)
`mcp__codex__codex`로 목록/리더/진행상태/narration 분리/CSS 변경 전체를 리뷰 요청, 3건 지적 확인 후 즉시 수정:
1. **Confirmed — 수정함**: `splitIntoSentences`의 정규식이 소수점("3.14")이나 구두점 뒤 공백이 없는 문장에서 텍스트를 통째로 유실하는 버그. 문자 단위 스캔 방식으로 교체(숫자-`.`-숫자 패턴만 예외 처리), 회귀 테스트 2건 추가.
2. **Confirmed — 수정함**: `buildLessonCardDescription`이 첫 씬에 텍스트 블록이 없으면(customHtml만 있는 경우) 빈 문자열을 반환하던 문제. `lesson.summary` 폴백 추가, 폴백/트렁케이션 테스트 추가.
3. **Confirmed — 수정함**: `transitionToNext` 배너가 하단 바(z-30)보다 낮은 z-20 + 고정 `bottom-24`라 safe-area/줄바꿈으로 하단 바가 커지면 가려질 수 있는 문제. z-40으로 상향 + `calc(6rem + env(safe-area-inset-bottom))`로 여유 확보.
- 완료 기능 삭제 완전성, "교육 설명" 토글 로직은 문제 없음으로 확인됨.

## Acceptance Criteria Coverage
- AC1~AC7: 테스트 + Playwright로 확인.

## Skipped Checks
- 모바일 뷰포트에서의 `transitionToNext` 배너 겹침은 코드 리뷰로 안전장치(z-index/safe-area)만 확보, 실제 iOS 기기 확인은 생략(로컬 환경 제약).
