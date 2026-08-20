# wiki-lambda-memory-latency-fix Plan

## Summary
- 코드 변경 없음. `aws lambda update-function-configuration --memory-size 1024`로 4개 Lambda의 메모리를 조정.
- 조정 전, 로컬에서 실제 파이프라인 함수를 직접 호출하는 실험 스크립트(비커밋, 실험 후 삭제)로 모델 교체 가설을 먼저 검증 — 효과 없음을 확인 후 인프라 쪽 원인으로 조사 방향을 전환.

## Impacted Modules
- AWS Lambda 설정: `sfood-ax-ai-search`, `sfood-ax-ai-ask`, `sfood-ax-wiki-pages`, `sfood-ax-wiki-documents`
- 저장소 코드/문서: 없음(이 task 문서 세트, `docs/prd/implementation-status.md` 제외)

## Architecture Approach
- 모델 교체(gpt-5-mini) 실험 → 실측상 역효과 확인 → 폐기.
- 로컬 baseline(9~12초) vs 프로덕션 실측(~31초) 간 3배 차이를 근거로, 병목이 OpenAI 호출 자체가 아니라 Lambda 실행 환경(CPU 배분)에 있다고 가설 수립.
- CloudWatch Logs 접근이 조직 정책으로 차단되어 있어 Duration/Init Duration 로그 기반 확정 진단은 불가 — 대신 메모리를 올리고 실측 비교하는 실험적 검증으로 대체.
- 사용자 확인 후 `sfood-ax-ai-search`부터 1024MB로 올려 실측, 효과 확인 후 나머지 3개 Lambda까지 동일하게 적용(사용자가 "모든 wiki Lambda를 1024MB로 통일" 선택).

## Data And API Impact
- 없음. 응답 스키마, 상태 코드, 캐시 동작 모두 변경 없음 — 실행 속도만 변경됨.

## Validation Plan
- `aws lambda get-function-configuration`으로 각 Lambda의 `MemorySize`/`LastUpdateStatus`가 반영됐는지 확인.
- Playwright로 ax-wiki.s-food.ai에서 변경 전/후 AI 검색 응답 시간을 동일한 방식(Performance API `resource` 엔트리)으로 비교.
- 변경 후 답변 내용을 육안으로 재확인해 스타일/추천 문서 로직에 이상이 없는지 확인.

## Risks
- Lambda 과금(GB-초)이 메모리 4배 증가로 소폭 늘 수 있음 — 실행시간이 3배 가까이 줄어 상쇄되며, 내부 위키 트래픽 규모에서는 체감 비용 차이가 미미할 것으로 판단.
- 이 설정이 코드/IaC로 관리되지 않고 AWS 콘솔/CLI 수동 설정이라, 향후 Lambda가 재생성되거나 IaC가 도입되면 이 값이 유실될 수 있음 — Open Gap으로 기록.

## Rollback Considerations
- `aws lambda update-function-configuration --function-name <name> --memory-size 256`으로 각 함수를 즉시 원복 가능. 코드/배포 변경이 없으므로 애플리케이션 재배포 불필요.
