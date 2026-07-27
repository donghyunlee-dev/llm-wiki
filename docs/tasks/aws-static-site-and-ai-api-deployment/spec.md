# aws-static-site-and-ai-api-deployment Spec

## Problem Statement
`apps/web`은 지금까지 로컬 `pnpm dev`의 Vite 미들웨어(`vite.config.ts`)에만 의존해 Confluence 문서 목록, AI 질문(ask), AI 검색(search)을 제공해왔다. 프로덕션 정적 빌드(`vite build`)에는 이 미들웨어가 없으므로, 그대로 S3/CloudFront에 올리면 AI 질문/검색/문서 목록이 전부 동작하지 않는다. 사용자는 AWS(S3+CloudFront)에 배포하고 GitHub Actions로 자동배포를 구성하고자 하며, 대화 중 확인 결과 **AI 질문/검색은 반드시 실사용 가능해야 하는 메인 기능**으로 확정되었다.

## Business Context
- 배포 대상 아키텍처는 `docs/prd/architecture.md`에 이미 정의되어 있음: 정적 SPA → S3+CloudFront, 필요한 서버 로직만 API Gateway/Lambda로 분리.
- `packages/serverless`에 문서 목록(`wiki-pages`) 핸들러만 존재하고 미배포 상태(`docs/prd/implementation-status.md`: "AWS/deployment work is paused by request") — 이번 요청으로 명시적으로 재개.
- `apps/mcp-server`가 이미 AWS Lambda + Function URL로 배포된 선례가 있음(`docs/tasks/wiki-mcp-server/aws-deployment-guide.md`) — 동일 패턴(esbuild 번들 + Function URL + 콘솔/CLI 1회 설정)을 재사용.

## Scope
1. **AI 질문/검색 로직을 공용 모듈로 추출**: `vite.config.ts`의 `/api/wiki/ai/ask`, `/api/wiki/ai/search` 핸들러 로직(쿼리 이해, 렉시컬 검색, 프롬프트 구성, OpenAI 호출, 응답 정규화, 정책 알림, Playbook 로깅)을 `packages/wiki-core`의 트랜스포트-비의존적 함수로 추출 — 아키텍처 문서의 "Keep fetch/normalize/visibility logic in shared modules that can run in either the SPA or a future Lambda function" 원칙을 그대로 따름.
2. **`vite.config.ts`를 추출된 공용 함수를 호출하는 얇은 어댑터로 리팩터링** — 로컬 dev 동작은 100% 동일하게 유지(회귀 없음).
3. **`packages/serverless`에 신규 Lambda 핸들러 2개 추가**: `aiAskHandler`, `aiSearchHandler` — 1번에서 추출한 동일 공용 함수를 호출하는 얇은 어댑터. 기존 `wikiPagesHandler`는 그대로 유지.
4. **`packages/serverless`에 esbuild 기반 빌드 스크립트 추가** — `apps/mcp-server`와 동일한 번들링 패턴(핸들러별 단일 `.mjs` 산출물).
5. **GitHub Actions 배포 워크플로우 작성** (`.github/workflows/deploy.yml`): `main` 브랜치 push 시 (a) `apps/web`을 프로덕션 모드(`VITE_WIKI_DATA_SOURCE=remote`)로 빌드해 S3에 동기화하고 CloudFront invalidation 수행, (b) `packages/serverless`의 3개 핸들러를 빌드해 각각의 기존 Lambda 함수 코드를 업데이트.
6. **Projects(GitHub 연동) 기능 숨김**: 홈 화면 진입 카드 및 내비게이션에서 "프로젝트 사례" 링크 제거. GitHub 관련 백엔드(`/api/github/projects`)는 이번 스코프에서 만들지 않음 — 라우트 자체는 남겨두되(직접 URL 접근 시 기존처럼 미설정 상태로 동작) 어디서도 링크하지 않음.
7. **1회성 AWS 리소스 설정 가이드 문서 작성** — `docs/tasks/wiki-mcp-server/aws-deployment-guide.md`와 동일한 형식으로, S3 버킷/CloudFront distribution(사용자가 이미 보유) 확인 절차 + Lambda 함수 3개(Function URL 방식) 최초 생성 절차.
8. **GitHub Secrets 목록 정리 및 사용자 안내**.
9. **PR 생성**.

## Out Of Scope
- `/api/wiki/documents`(클라이언트 미사용 확인됨), `/api/github/projects`의 Lambda 구현.
- Projects 기능 완전 삭제(코드/라우트 제거) — 이번엔 "숨김"(링크 제거)까지만, 코드 삭제는 별도 승인 필요.
- API Gateway 커스텀 도메인, WAF, 요청 속도 제한 등 고급 보안 설정 — Function URL 기본 공개 접근(`auth-type NONE`) + CORS(`WIKI_ALLOWED_ORIGIN`)로 시작.
- S3/CloudFront 리소스 자체의 최초 생성(사용자가 이미 보유 확인) — 워크플로우는 기존 리소스에 배포만 수행.
- Confluence 프롬프트 룰/Playbook 로깅 페이지 ID 등 운영 콘텐츠 설정 변경.

## User Or Operator Scenarios
- 개발자가 `main`에 머지하면 GitHub Actions가 자동으로 `apps/web`을 빌드해 S3에 올리고 CloudFront 캐시를 무효화한다.
- 동시에 `packages/serverless`의 3개 Lambda(문서 목록/AI 질문/AI 검색) 코드가 최신 버전으로 갱신된다.
- 배포된 사이트에서 사용자가 가이드 문서를 보고, AI에게 질문하고, AI 검색을 사용할 수 있다 — 로컬 dev와 동일하게 동작.
- 배포된 사이트에는 "프로젝트 사례" 진입점이 보이지 않는다.
- 사용자가 GitHub Secrets에 필요한 값을 설정하면 별도 코드 변경 없이 워크플로우가 정상 동작한다.

## Acceptance Criteria
- AC1: `packages/wiki-core`에 AI 질문/검색 공용 함수가 추가되고, 단위 테스트로 커버됨.
- AC2: `vite.config.ts`가 리팩터링 후에도 로컬 `pnpm dev` 기준 AI 질문/검색/문서 목록이 기존과 동일하게 동작(회귀 없음, 기존 테스트 통과).
- AC3: `packages/serverless`에 `wikiPagesHandler`(기존), `aiAskHandler`(신규), `aiSearchHandler`(신규) 3개가 존재하고 각각 단위 테스트로 커버됨.
- AC4: `packages/serverless`에 esbuild 빌드 스크립트가 있어 `pnpm --filter @sfood/serverless build`로 3개 핸들러가 각각 번들됨.
- AC5: `.github/workflows/deploy.yml`이 `main` push 시 (a) 정적 사이트 빌드+S3 동기화+CloudFront invalidation, (b) 3개 Lambda 함수 코드 업데이트를 수행 — 필요한 값은 모두 GitHub Secrets/Variables로 참조(하드코딩 없음).
- AC6: 홈 화면에서 "프로젝트 사례" 카드가 사라지고, 나머지 3개 카드는 정상 표시됨(entry cards 4→3, 관련 테스트/검증 로직 갱신).
- AC7: `docs/tasks/aws-static-site-and-ai-api-deployment/aws-setup-guide.md`에 Lambda 3개 최초 생성 절차가 문서화됨.
- AC8: 사용자에게 필요한 GitHub Secrets 전체 목록을 명확히 전달.
- AC9: `pnpm test`(전체 워크스페이스)/`typecheck`/`build` 통과. Playwright로 홈 화면(프로젝트 카드 숨김) 확인. Codex 크리티컬 리뷰(추출된 AI 로직의 동작 동일성, Lambda 핸들러, 워크플로우 YAML).
- AC10: PR 생성.

## Edge Cases
- Confluence/OpenAI 환경변수가 Lambda에 설정되지 않은 경우 — 기존과 동일하게 503/명확한 에러 코드 응답(하드코딩된 폴백 없이 명시적 실패).
- AI 검색의 인메모리 캐시(`aiSearchCache`)는 Lambda 각 인스턴스(컨테이너) 생명주기 동안만 유효 — 요청 간 캐시 미스가 dev보다 잦을 수 있음(Lambda 특성상 불가피, 별도 완화 조치 없이 문서화).
- Playbook 로깅(`firePlaybookLog`)은 fire-and-forget이라 Lambda 응답 반환 후 백그라운드 실행이 보장되지 않을 수 있음(Lambda는 응답 후 즉시 프리즈될 수 있음) — 알려진 한계로 문서화, 필요시 별도 개선.
- `ai-ask`/`ai-search` Lambda는 `wikiPagesHandler`와 동일하게 CORS(`WIKI_ALLOWED_ORIGIN`)만으로 접근을 구분하며, 이는 브라우저의 same-origin 정책을 우회하는 비-브라우저 클라이언트(curl 등)의 직접 호출까지 막지는 못한다 — OpenAI 호출 비용이 발생하는 공개 엔드포인트이므로, 남용이 우려되면 별도 태스크로 IAM 인증 전환 또는 요청 속도 제한 추가를 검토해야 한다(Codex 리뷰에서 지적, 이번 스코프는 기존 `wikiPagesHandler` 선례를 그대로 따르는 것으로 확정).

## Assumptions
- S3 버킷과 CloudFront distribution은 이미 존재하며, 정적 웹사이트 호스팅 또는 OAC 기반 CloudFront 접근 중 어느 쪽이든 사용자가 이미 구성한 방식을 그대로 사용한다(워크플로우는 버킷 이름만 참조, 버킷 정책은 건드리지 않음).
- Lambda 인증은 `apps/mcp-server`와 동일하게 Function URL(`auth-type NONE`) + 핸들러 자체 CORS 헤더로 시작한다.
- GitHub Actions → AWS 인증은 정적 액세스 키(`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`)를 사용한다(사용자 선택).
- OpenAI API 키는 기존에 사용 중인 키를 그대로 재사용한다(사용자 선택).

## Clarifications
- Q: AI 질문/검색/GitHub 프로젝트 목록도 이번 배포 범위에 포함할지?
  A: AI 질문/검색은 메인 기능이라 반드시 포함. GitHub 프로젝트 목록은 제외 및 기능 숨김.
- Q: wiki-pages Lambda가 이미 존재하는지?
  A: 아직 없음 — 1회 생성 필요(가이드 문서로 안내).
- Q: OpenAI 키 출처?
  A: 기존에 쓰던 키 재사용.
- Q: GitHub Actions → AWS 인증 방식?
  A: 액세스 키.
