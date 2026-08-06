# lesson-reader-keyboard-and-script-dock Tasks

- [x] 키보드 핸들러에서 Space/PageDown/PageUp 제거, ArrowLeft/ArrowRight만 유지
- [x] "교육 설명" 패널을 하단 컨트롤 바와 함께 dock으로 묶고 고정
- [x] 패널 본문 자체 스크롤(`max-h-[26vh] overflow-y-auto`)
- [x] "숨기기/보기" 텍스트 → 회전 셰브론 아이콘 버튼
- [x] 관련 테스트 갱신(키보드 무시 테스트, 아이콘 aria-label 기반 테스트, 포커스 가드 테스트)
- [x] Codex 비판 리뷰 1차 반영(배너 겹침, 스크롤 위치 리셋, 주석, 테스트 커버리지)
- [x] `position: sticky` → `fixed` + `ResizeObserver` 기반 정확한 여백으로 전환(직접 발견 및 수정)
- [x] `pnpm test` / `pnpm typecheck` 통과
- [x] Playwright로 짧은/긴 씬, 라이트/다크 확인
- [x] 작업 문서/`implementation-status.md` 갱신
