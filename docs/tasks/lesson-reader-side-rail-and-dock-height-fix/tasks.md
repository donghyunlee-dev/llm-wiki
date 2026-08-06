# lesson-reader-side-rail-and-dock-height-fix Tasks

- [x] "다음 페이지 안내" xl 이상 사이드 레일로 이동, xl 미만은 기존 하단 dock 유지
- [x] "교육 설명" 패널 높이를 clamp(96px,22vh,260px)로 조정
- [x] "교육 설명 숨기기" 미재현 확인(systematic-debugging)
- [x] ResizeObserver 미작동 버그 발견 및 근본 수정(deps 제거)
- [x] 부수 발견: `.lesson-reader-shell` min-height, `flex-1` 정리
- [x] 관련 테스트 갱신(사이드 레일 두 사본 렌더 검증)
- [x] `pnpm test` / `pnpm typecheck` 통과
- [x] Playwright로 1366×768/1440×900, xl 경계 확인, 스크롤 후 완전 노출 실측
- [x] 작업 문서 갱신
