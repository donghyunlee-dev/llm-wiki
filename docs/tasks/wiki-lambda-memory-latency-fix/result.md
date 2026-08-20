# wiki-lambda-memory-latency-fix Result

## Delivered Scope
- AI 검색 응답 지연(약 31초)의 원인을 조사해, 애초 가설이었던 "AI 모델 교체"가 아니라 **Lambda 메모리 설정(256MB, 최저 실용 티어)**이 실제 병목임을 실측으로 확인.
- `sfood-ax-ai-search`, `sfood-ax-ai-ask`, `sfood-ax-wiki-pages`, `sfood-ax-wiki-documents` 4개 Lambda의 메모리를 256MB → 1024MB로 상향(AWS CLI, 코드/배포 변경 없음).
- AI 검색 응답 시간을 **29~36초 → 웜 인스턴스 기준 9.8초**로, 위키 데이터 콜드 로드도 12.9초 → 7.1초로 개선.

## Changed Files
- `docs/tasks/wiki-lambda-memory-latency-fix/*` (이 문서 세트)
- `docs/prd/implementation-status.md`
- 저장소 코드 변경 없음 — AWS Lambda 설정만 변경.

## Key Decisions
- **모델 교체(gpt-5-mini) 폐기**: 로컬에서 동일 파이프라인으로 직접 실측한 결과 현재 값(o4-mini)보다 2배 이상 느리고 품질도 낫지 않아 채택 근거가 없었음. 답변 퀄리티를 지키면서 성능을 확인하라는 요청에 따라, 효과가 없는 변경을 프로덕션에 반영하지 않고 실측 단계에서 폐기함.
- **인프라 원인으로 조사 방향 전환**: 로컬 baseline과 프로덕션 실측 간 3배 차이를 근거로 Lambda 실행 환경을 의심, AWS CLI로 메모리 설정을 확인해 가설을 확정.
- **사용자 확인 후 단계적 적용**: 먼저 `ai-search` 하나만 1024MB로 올려 효과를 실측 확인한 뒤, 사용자 승인을 받아 나머지 3개 Lambda까지 동일하게 적용.
- CloudWatch Logs 접근이 조직 정책으로 막혀 있어(`logs:FilterLogEvents` 거부) Duration 로그로 직접 원인을 확정하지는 못했고, 메모리 상향 후 재실측하는 실험적 검증으로 대체함 — 이 점은 결과 해석의 한계로 명시한다.

## Validation
- Playwright로 ax-wiki.s-food.ai 변경 전/후 실측(`docs/tasks/wiki-lambda-memory-latency-fix/test-result.md`).
- 답변 내용을 육안으로 재확인해 스타일/추천 문서 로직에 회귀가 없음을 확인(코드 변경이 없어 원천적으로 회귀 가능성도 낮음).
- 코드 변경이 없어 `pnpm test`/`pnpm typecheck`/Codex 리뷰는 해당 없음.

## Open Gaps
- 이 저장소에는 Lambda 인프라를 관리하는 IaC가 없어, 이번 메모리 설정은 AWS 콘솔/CLI에만 반영되어 있다 — 향후 Lambda가 재생성되거나 IaC가 도입되면 이 값이 유실될 수 있다. 인프라를 코드로 관리하게 되면 이 설정(1024MB)을 그 정의에 반영해야 한다.
- CloudWatch Logs 접근 권한이 없어 Duration/Init Duration의 정확한 수치 기반 분석은 못했다 — 권한이 열리면 재확인 가치가 있다.
- `gpt-4.1-mini` 같은 비추론 모델을 시도하려면 `aiOrchestration.ts`의 요청 빌더가 모델별로 `reasoning` 파라미터를 조건부로 넣도록 리팩터링해야 한다 — 이번 스코프에서는 다루지 않음(현재 개선만으로 충분한 효과를 확인했기 때문에 우선순위 낮음).

## Next Steps
- 없음(사용자 확인 사항 완료, 추가 후속 조치는 필요 시 별도 요청).
