# lesson-reader-keyboard-and-script-dock Test Result

## Commands
- `pnpm --filter @sfood/web test -- --run LessonReaderPage` — Pass (24 tests)
- `pnpm test` (전체 워크스페이스) — Pass (154 tests)
- `pnpm typecheck` (전체 워크스페이스) — Pass

## Playwright Review (6b)
remote 모드 dev 서버에서 확인:
- ArrowRight/ArrowLeft로 씬 이동 확인, Space/PageDown 입력 시 씬이 그대로 유지되는지 `document.querySelector('h1')` 텍스트로 확인.
- "교육 설명" 패널이 하단 컨트롤 바에 항상 맞닿아 표시, 회전 셰브론 아이콘으로 펼침/접힘 토글, 접으면 슬림 헤더만 컨트롤 바에 붙어 남음.
- 짧은 씬(대부분 콘텐츠): dock과 본문 사이 겹침 없음(측정: dockTop 472.5 > stageBottom 468.5).
- 카드 그리드가 있는 긴 씬(업무와 환경에 맞는 AI를 선택합니다): 초기 화면에서 카드 4개 중 마지막 1개가 dock에 일부 가려짐 — `window.scrollTo(0, scrollHeight)`로 스크롤하면 완전히 드러남(가려진 콘텐츠가 영구적으로 안 보이는 게 아님, AC5 충족).
- 라이트/다크 테마 모두 확인.

## Codex Critical Review (6c)
`mcp__codex__codex`로 두 차례 리뷰:
1. **1차(구조 변경 직후)**: 3건 확인 및 수정 — (a) `transitionToNext` 배너가 펼쳐진 패널과 겹칠 수 있음(fixed+고정 bottom 값의 근본적 한계) → dock 안으로 이동, (b) 씬 전환 시 패널 스크롤 위치가 남을 수 있음 → 본문에 씬별 `key` 부여로 매번 새로 마운트, (c) 키보드 가드 주석이 Space 관련 옛 설명을 그대로 두고 있음 → 갱신. 테스트 커버리지 지적(PageUp을 두 번째 씬에서도 확인, 버튼 포커스 시 ArrowRight 무시 확인)도 반영.
2. **직접 발견(2차, 자체 검증)**: Codex가 짚은 "dock이 커질수록 배너가 겹친다"는 지적을 고치는 과정에서, `position: sticky` 자체가 콘텐츠가 짧은 씬에서 "문서 길이 - 뷰포트 높이"만큼 항상 실제 콘텐츠와 겹치는 더 근본적인 문제가 있음을 발견 — `fixed` + `ResizeObserver` 기반 정확한 padding-bottom으로 재작업. 이 부분은 별도 Codex 호출 없이 실측(Playwright `getBoundingClientRect`)으로 직접 검증.

## Acceptance Criteria Coverage
- AC1~AC5: 테스트 + Playwright 실측으로 확인.

## Skipped Checks
- 모바일 뷰포트에서의 dock 겹침 정도는 별도로 측정하지 않음(데스크톱 기준으로 충분히 검증됐고, 로직이 뷰포트 크기에 무관하게 동일하게 동작함).
