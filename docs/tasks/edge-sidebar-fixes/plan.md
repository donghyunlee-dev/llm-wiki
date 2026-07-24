# edge-sidebar-fixes Plan

상세 구현 계획(파일 구조, 태스크별 TDD 단계, 완전한 코드)은 다음 문서에 있다:

`docs/superpowers/plans/2026-07-22-edge-sidebar-fixes.md`

## 접근 요약
- A안(서버 정리 HTML): 매크로 정리를 `@sfood/wiki-core`의 DOM-비의존 함수로 서버에서 수행, 익스텐션은 정리된 HTML 렌더만 → 익스텐션 0-의존 격리 유지.

## 영향 범위
- `packages/wiki-core`: 정리 함수 신규 + sanitizer 강화.
- `apps/web/vite.config.ts`: `GET /api/wiki/documents` 신규.
- `apps/edge-sidebar`: dedup(ID 기준)·href 우선순위·본문 로딩 경로 수정, 죽은 코드 제거, 콜아웃 테마 스타일.

## 검증 계획
- 단위 테스트(정리 함수, dedup, 문서 조회), 전체 `pnpm test`/`pnpm typecheck`/build, Codex 비판 리뷰, 사용자 브라우저 수동 확인.

## 리스크
- 정규식 정리기는 깊은 중첩 매크로에 웹 DOMParser 렌더러보다 견고성이 낮음(텍스트 유실 없이 이중 노출만 방지).
