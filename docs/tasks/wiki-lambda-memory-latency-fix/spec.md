# wiki-lambda-memory-latency-fix Spec

## Problem Statement
- `wiki-pages-endpoint-cache` 작업으로 홈/검색 화면 재진입 지연은 해결했지만, AI 검색 응답 자체는 여전히 약 31초가 걸렸다.
- 사용자 요청: "답변의 퀄리티가 떨어지지 않게 파이프라인을 최적화 해야 해. 성능과 답변 퀄리티를 확인하면서 진행해줘."
- 1차 가설(Stage2 모델을 `o4-mini` → `gpt-5-mini`로 교체)을 로컬에서 실측한 결과, 오히려 2배 이상 느려짐(6~7초 → 12~19초)이 확인되어 폐기했다. `gpt-4.1-mini` 같은 비추론 모델은 코드가 모든 모델 호출에 `reasoning.effort`를 고정 전송해 즉시 502로 실패, 시도할 수 없었다(요청 빌더를 모델별로 분기해야 하는 더 큰 변경이 필요해 이번 스코프에서 보류).
- 로컬에서 직접 OpenAI를 호출했을 때(baseline 구성, 동일 모델/effort/토큰)는 총 9~12초였는데, 프로덕션 Lambda를 통해 같은 질문을 실측하면 약 31초였다 — 코드/모델 문제가 아니라 Lambda 실행 환경 자체의 지연 가능성을 시사했다.
- AWS CLI로 확인한 결과 `sfood-ax-ai-search`, `sfood-ax-ai-ask`, `sfood-ax-wiki-pages`, `sfood-ax-wiki-documents` 4개 Lambda가 전부 **256MB**(가장 낮은 실용 티어)로 설정되어 있었다. AWS Lambda는 메모리에 비례해 vCPU를 할당하므로, 256MB에서는 TLS 연결·JSON 직렬화 같은 CPU 바운드 작업이 눈에 띄게 느려진다.

## Business Context
- CloudWatch Logs 조회 권한이 조직 정책(permissions boundary)으로 막혀 있어 Duration/Init Duration 로그로 직접 원인을 특정할 수는 없었다 — 메모리 상향 후 재실측하는 실험적 접근으로 검증했다.
- 이 변경은 애플리케이션 코드/배포 파이프라인을 건드리지 않는 순수 AWS 설정값 변경이다.

## Scope
- `sfood-ax-ai-search`, `sfood-ax-ai-ask`, `sfood-ax-wiki-pages`, `sfood-ax-wiki-documents` 4개 Lambda의 `MemorySize`를 256MB → 1024MB로 상향.
- 변경 전/후 프로덕션(ax-wiki.s-food.ai) 실측 비교(Playwright).

## Out Of Scope
- Stage1/Stage2 AI 모델 교체(실측 결과 이득 없음, 폐기).
- 비추론 모델 지원을 위한 요청 빌더 리팩터링.
- Lambda VPC/네트워크 경로 변경(현재 VPC 미설정 확인됨, 해당 없음).
- 다른 Lambda(`sfood-ax-wiki-mcp` 등) 메모리 조정.
- IaC(Terraform/CDK 등)로 이 설정을 코드화하는 작업 — 현재 저장소에 Lambda 인프라 정의가 없어(수동 콘솔/CLI 관리) 이번 스코프에서는 다루지 않음.

## User Or Operator Scenarios
- 사용자가 검색 질문을 입력하면 AI 검색 Lambda가 이전보다 CPU를 더 할당받아 동일한 모델 호출도 더 빠르게 처리된다.
- 문서 상세 페이지의 AI 질문(ai-ask)도 동일한 개선 효과를 받는다.
- 답변 내용/스타일/추천 문서 로직은 전혀 변경되지 않는다 — 순수 실행 속도 개선이다.

## Acceptance Criteria
- AC1: 4개 Lambda의 `MemorySize`가 1024MB로 반영된다(`aws lambda get-function-configuration`으로 확인).
- AC2: 변경 후 프로덕션 실측에서 AI 검색 응답 시간이 변경 전 대비 유의미하게(대략 2배 이상) 감소한다.
- AC3: 답변 내용의 스타일/구조/추천 문서 로직에 회귀가 없다(코드 변경이 없으므로 원천적으로 회귀 불가능하지만, 실제 응답을 육안으로 재확인한다).

## Edge Cases
- 이 변경은 되돌리기 쉽다 — `aws lambda update-function-configuration --memory-size 256`으로 즉시 원복 가능.
- 메모리 증가로 인해 Lambda 과금(GB-초 단위)이 소폭 늘어날 수 있으나, 내부 위키 트래픽 규모를 감안하면 무시할 수준으로 판단(요청당 실행시간이 크게 줄어 상쇄되는 효과도 있음).

## Assumptions
- 이 저장소에는 Lambda 인프라를 코드로 관리하는 IaC가 없어(`.github/workflows/deploy.yml`은 코드 zip 업데이트만 수행), 메모리 같은 인프라 설정은 AWS 콘솔/CLI로 수동 관리되는 것으로 확인됨 — 이번 변경도 동일한 방식(AWS CLI)으로 적용했다.
