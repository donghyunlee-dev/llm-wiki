# wiki-pages-endpoint-cache Tasks

## Implementation Tasks
- [x] `wikiPagesHandler.ts`에 TTL 기반 모듈 스코프 캐시 추가(캐시 히트/미스, in-flight 공유, 실패 시 미캐시).
- [x] 테스트 격리용 캐시 리셋 훅 추가.

## Test Tasks
- [x] TTL 이내 반복 호출 시 fetch 1회만 실행되는 테스트 (AC1).
- [x] TTL 만료 후 재호출 시 fetch가 다시 실행되는 테스트 (AC2, 데이터 갱신까지 검증).
- [x] 동시 요청 시 fetch 1회만 실행되는 테스트 (AC3).
- [x] 캐시 히트/미스 모두 응답 바디·상태코드가 기존과 동일한지 확인하는 테스트 (AC4).
- [x] 업스트림 실패 시 캐시에 남지 않고 다음 요청이 재시도하는 테스트.
- [x] 만료된 캐시에서 재조회 실패 시 stale 미서빙 테스트(Codex 리뷰 반영).
- [x] `pnpm test` 전체 통과 확인.
- [x] `pnpm typecheck` 통과 확인.

## Documentation Tasks
- [x] `test-result.md`에 실행 커맨드·결과 기록.
- [x] `result.md`에 구현 요약 기록 (배포 전/후 실측 비교는 배포 승인 후 추가 예정).
- [x] README에 캐시/반영 지연 동작 문서화.
- [x] `docs/prd/implementation-status.md` 갱신.
- [x] 배포 후 Before/After 실측 재기록.

## Progress Notes
- 2026-08-20: spec.md/plan.md 작성 완료, 구현 착수.
- 2026-08-20: 캐시 구현 + 테스트 완료, `pnpm test`/`pnpm typecheck` 통과, Codex 크리티컬 리뷰 완료 및 반영. 프로덕션 배포는 사용자 확인 대기 중.
- 2026-08-20: PR #25 생성(`fix/wiki-pages-endpoint-cache` → `develop`), 사용자가 main 반영. 배포 후 Playwright로 프로덕션 재실측 — `/api/wiki-pages` 캐시 히트 시 7~9초 → 0.8초대로 감소 확인. AI 검색 자체 지연(~31초)은 스코프 밖이라 무변화, 후속 과제로 남김.

## Review Notes
- Codex 크리티컬 리뷰(2026-08-20): Medium 2건(동시성 dedup 효과 과장 표현, 캐시 미키잉 가정 문서화), Low 2건(TTL 갱신 검증 부족, stale 실패 케이스 미검증) 지적 → 전부 반영.
- Playwright 리뷰는 이번 변경이 백엔드 전용(UI 변경 없음)이라 로컬에서 확인할 브라우저 경로가 없음 — 프로덕션 배포 후 실측으로 대체 예정(`test-result.md` 참고).
