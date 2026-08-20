# wiki-lambda-memory-latency-fix Tasks

## Investigation Tasks
- [x] `docs/prd/ai-ask-prompt-guide.md`, `docs/prd/search-flow-contract.md` 재확인(AI 동작 수정 전 필수 확인 절차).
- [x] 로컬 실험 스크립트로 Stage2 모델 교체(`gpt-5-mini`, effort 변형, 토큰 예산 축소) 실측 — 효과 없음/역효과 확인, 폐기.
- [x] `gpt-4.1-mini`(비추론) 시도 — 코드가 모든 모델에 `reasoning.effort`를 고정 전송해 502로 실패, 요청 빌더 리팩터링 없이는 불가함을 확인.
- [x] 로컬 baseline(9~12초) vs 프로덕션 실측(~31초) 차이를 근거로 Lambda 실행 환경(메모리/CPU) 가설 수립.
- [x] AWS CLI로 `sfood-ax-ai-search` 외 3개 Lambda 설정 확인 — 전부 256MB.
- [x] CloudWatch Logs 접근 시도 — 조직 정책으로 차단 확인(Open Gap으로 기록).

## Implementation Tasks
- [x] 사용자 확인 후 `sfood-ax-ai-search` 메모리 256MB → 1024MB 변경.
- [x] 실측으로 효과 확인 후 `sfood-ax-ai-ask`, `sfood-ax-wiki-pages`, `sfood-ax-wiki-documents`도 1024MB로 변경(사용자 승인).

## Validation Tasks
- [x] 변경 후 Playwright로 ax-wiki.s-food.ai 재실측(콜드/웜 각각).
- [x] 답변 내용 육안 재확인 — 스타일/추천 문서 회귀 없음 확인.

## Documentation Tasks
- [x] `test-result.md`에 실측 수치 기록.
- [x] `result.md`에 결정 배경과 Open Gap 기록.
- [x] `docs/prd/implementation-status.md` 갱신.

## Progress Notes
- 2026-08-20: 모델 교체 가설 실측 후 폐기, Lambda 메모리 가설로 전환해 검증 및 적용 완료.
