# lesson-player-slice-3 Test Result

## Commands Run

| Command | Result |
|---|---|
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS — wiki-core 229, apps/web 130, 나머지 회귀 없음 |

## New/Updated Tests

- `LessonReaderPage.test.tsx`: 전환 잠금(빠른 연속 클릭 시 1칸만 이동) 테스트 추가, 기존 2개 테스트에 잠금 해제 대기(450ms) 반영, Home/End가 이미 첫/마지막 장면일 때 불필요한 잠금을 걸지 않는 회귀 테스트 추가(Codex 지적 반영).

## Playwright 실브라우저 검증

- "다음" 클릭 시 `data-direction="forward"` + `lesson-scene-enter-forward` 애니메이션 재생 확인(computed style).
- "이전" 클릭 시 `data-direction="backward"` + `lesson-scene-enter-backward` 확인.
- `prefers-reduced-motion: reduce` 에뮬레이션 시 `lesson-scene-enter-fade`(0.22s)로 전환되는 것을 확인.
- "다음" 버튼을 3회 빠르게 연속 클릭해도 장면이 1칸만 이동함을 URL(`?scene=1`)로 확인(전환 잠금 실동작 확인).

## Codex 비판적 리뷰

`slice3.diff`를 Codex에 전달해 리뷰받음. 1건 발견(Low), 수정 완료.

| # | 지적 사항 | 조치 |
|---|---|---|
| 1 | 이미 첫/마지막 장면인데 Home/End를 누르거나, 이미 보고 있는 장면을 학습 흐름 드로어에서 다시 선택하면 실제로는 아무 것도 바뀌지 않는데도 전환 잠금(410ms)이 걸려, 바로 이어지는 정상적인 다음 입력이 무시됨 | Home/End와 드로어의 같은 장면 재선택 시 `beginTransition`을 호출하기 전에 "실제로 이동하는가"를 먼저 확인하도록 가드 추가 |

레이스 컨디션, 잠금 고착, CSS/JS 지속시간 불일치는 Codex가 검토했으나 발견되지 않음(모든 전환 시작 지점이 `transitioning` 체크를 선행하므로 겹치는 타이머 문제 없음, 언마운트 후 `setTransitioning` 호출도 무해함, `410ms > 360ms` 여유 확인됨).

## Skipped Checks

- Reveal(단계별 점진 공개) 애니메이션은 Out of Scope(Player 상태 모델 변경이 필요한 별도 기능).
