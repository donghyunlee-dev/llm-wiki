# aws-static-site-and-ai-api-deployment — AWS 1회성 설정 가이드

`packages/serverless`의 3개 핸들러(`wiki-pages`, `ai-ask`, `ai-search`)를 AWS Lambda + Function URL로 최초 1회 생성하는 절차입니다. `apps/mcp-server`의 배포 선례(`docs/tasks/wiki-mcp-server/aws-deployment-guide.md`)와 동일한 패턴(esbuild 단일 번들 + Function URL, API Gateway 없음)을 따릅니다.

S3 버킷과 CloudFront distribution은 **이미 존재**하므로 이 문서에서 생성하지 않습니다 — 아래 "0. 기존 리소스 정보 확인"에서 ID만 확인합니다.

> 전제: AWS 계정, Lambda 생성 권한, 발급된 Confluence 서비스 계정 API 토큰, 기존에 사용 중인 OpenAI API 키.

---

## 0. 기존 리소스 정보 확인 (S3/CloudFront)

GitHub Secrets에 등록할 값을 미리 확보합니다.

```bash
aws s3 ls                                        # 버킷 이름 확인
aws cloudfront list-distributions \
  --query "DistributionList.Items[].{Id:Id,Domain:DomainName,Origin:Origins.Items[0].DomainName}"
```

→ 검증: 배포 대상 버킷 이름과 해당 CloudFront distribution의 `Id`를 기록.

---

## 1. 배포 아티팩트 생성 (3개 핸들러 공통)

```bash
pnpm install
pnpm --filter @sfood/serverless build
# → packages/serverless/dist/wiki-pages.mjs
# → packages/serverless/dist/ai-ask.mjs
# → packages/serverless/dist/ai-search.mjs
```

각각 ZIP으로 압축합니다 (핸들러 파일명이 곧 Lambda `Handler` 설정의 접두어가 됩니다).

```bash
cd packages/serverless/dist
zip wiki-pages.zip wiki-pages.mjs
zip ai-ask.zip ai-ask.mjs
zip ai-search.zip ai-search.mjs
```

→ 검증: `unzip -l wiki-pages.zip`(등)에 해당 `.mjs` 파일이 포함되어 있어야 한다.

---

## 2. Lambda 함수 3개 생성

세 함수 모두 동일한 런타임/아키텍처 설정을 사용합니다. **`--handler`는 파일명 접두어 + `.handler`** 형식입니다 (예: `wiki-pages.mjs` → `wiki-pages.handler`).

| 함수 이름(예시) | 핸들러 | ZIP |
|---|---|---|
| `sfood-wiki-pages` | `wiki-pages.handler` | `wiki-pages.zip` |
| `sfood-ai-ask` | `ai-ask.handler` | `ai-ask.zip` |
| `sfood-ai-search` | `ai-search.handler` | `ai-search.zip` |

공통 설정: Node.js 22.x / arm64 / 메모리 256MB / 타임아웃 30초.
**`ai-ask`/`ai-search`는 OpenAI 응답 대기 시간이 길 수 있으므로 타임아웃을 60초로 늘리는 것을 권장합니다.**

```bash
aws lambda create-function \
  --function-name sfood-wiki-pages \
  --runtime nodejs22.x --architectures arm64 \
  --handler wiki-pages.handler --timeout 30 --memory-size 256 \
  --role arn:aws:iam::<ACCOUNT_ID>:role/<lambda-basic-exec-role> \
  --zip-file fileb://packages/serverless/dist/wiki-pages.zip

aws lambda create-function \
  --function-name sfood-ai-ask \
  --runtime nodejs22.x --architectures arm64 \
  --handler ai-ask.handler --timeout 60 --memory-size 256 \
  --role arn:aws:iam::<ACCOUNT_ID>:role/<lambda-basic-exec-role> \
  --zip-file fileb://packages/serverless/dist/ai-ask.zip

aws lambda create-function \
  --function-name sfood-ai-search \
  --runtime nodejs22.x --architectures arm64 \
  --handler ai-search.handler --timeout 60 --memory-size 256 \
  --role arn:aws:iam::<ACCOUNT_ID>:role/<lambda-basic-exec-role> \
  --zip-file fileb://packages/serverless/dist/ai-search.zip
```

→ 검증: `aws lambda get-function --function-name <이름>`으로 각 함수 `State: Active` 확인.

---

## 3. 환경변수 설정

세 함수 모두 Confluence 접근이 필요하고, `ai-ask`/`ai-search`는 추가로 OpenAI 키가 필요합니다. `OPENAI_API_KEY`는 **기존에 다른 곳(예: dev 환경)에서 사용 중인 값을 그대로 재사용**합니다 — 새로 발급하지 않습니다.

```bash
COMMON_ENV="ATLASSIAN_SITE_NAME=sfoodxproject,\
ATLASSIAN_USER_EMAIL=svc-wiki@s-food.com,\
ATLASSIAN_API_TOKEN=<API_TOKEN>,\
CONFLUENCE_SPACE_ID=63111172,\
WIKI_ALLOWED_ORIGIN=<배포된 웹사이트 도메인 또는 *>"

aws lambda update-function-configuration \
  --function-name sfood-wiki-pages \
  --environment "Variables={$COMMON_ENV}"

aws lambda update-function-configuration \
  --function-name sfood-ai-ask \
  --environment "Variables={$COMMON_ENV,OPENAI_API_KEY=<기존 OPENAI 키>}"

aws lambda update-function-configuration \
  --function-name sfood-ai-search \
  --environment "Variables={$COMMON_ENV,OPENAI_API_KEY=<기존 OPENAI 키>,\
CONFLUENCE_PLAYBOOK_PAGE_ID=<선택, Playbook 로깅 페이지 ID>,\
CONFLUENCE_PROMPT_RULES_PAGE_ID=<선택, 동적 프롬프트 룰 페이지 ID>}"
```

- `CONFLUENCE_SPACE_ID`는 **숫자 ID**입니다.
- `CONFLUENCE_PLAYBOOK_PAGE_ID`/`CONFLUENCE_PROMPT_RULES_PAGE_ID`는 선택 사항 — 미설정 시 각각 Playbook 로깅 생략, 기본 프롬프트 룰 사용으로 정상 동작합니다.
- 토큰·키는 콘솔/CLI 환경변수에만 저장하고 소스에 커밋하지 않습니다.

→ 검증: 콘솔 Configuration → Environment variables에서 각 함수별로 설정한 키 노출 확인.

---

## 4. Function URL 활성화 (3개 함수 공통)

```bash
for FN in sfood-wiki-pages sfood-ai-ask sfood-ai-search; do
  aws lambda create-function-url-config \
    --function-name "$FN" \
    --auth-type NONE

  aws lambda add-permission \
    --function-name "$FN" \
    --statement-id FunctionURLAllowPublicAccess \
    --action lambda:InvokeFunctionUrl \
    --principal "*" \
    --function-url-auth-type NONE

  # 이 두 번째 문이 없으면 위 문만으로는 403 Forbidden이 발생한다(트러블슈팅 섹션 참고)
  aws lambda add-permission \
    --function-name "$FN" \
    --statement-id FunctionURLAllowInvokeAction \
    --action lambda:InvokeFunction \
    --principal "*" \
    --invoked-via-function-url
done
```

> `auth-type NONE`은 IAM 인증을 끄는 것 — 실제 접근 통제는 핸들러 자체의 `WIKI_ALLOWED_ORIGIN` CORS 설정으로 수행합니다(`apps/mcp-server`와 동일한 방식).

→ 검증: 각 함수의 반환된 `FunctionUrl`(예: `https://xxxx.lambda-url.ap-northeast-2.on.aws/`) 기록 — `apps/web`의 프로덕션 API 엔드포인트 설정(`VITE_WIKI_REMOTE_ENDPOINT` 등)에 필요합니다.

---

## 5. 동작 검증

```bash
WIKI_PAGES_URL="https://xxxx.lambda-url.ap-northeast-2.on.aws/"
AI_ASK_URL="https://yyyy.lambda-url.ap-northeast-2.on.aws/"
AI_SEARCH_URL="https://zzzz.lambda-url.ap-northeast-2.on.aws/"

# wiki-pages: GET → pages 배열
curl -s "$WIKI_PAGES_URL" | head -c 200

# ai-ask: 필수 파라미터 누락 → 400
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$AI_ASK_URL" \
  -H "content-type: application/json" -d '{}'

# ai-search: 정상 질문 → 200 + answer 필드
curl -s -X POST "$AI_SEARCH_URL" \
  -H "content-type: application/json" \
  -d '{"question":"반품 규정이 궁금해요"}' | head -c 300
```

→ 검증:
- `wiki-pages` GET → `{"pages": [...]}`
- `ai-ask` 파라미터 누락 → HTTP 400, `code: "BAD_REQUEST"`
- `ai-search` 정상 질문 → HTTP 200, `answer`/`recommendedDocuments` 필드 포함

---

## 6. 재배포

GitHub Actions 워크플로우(`.github/workflows/deploy.yml`)가 `main` push 시 자동으로 `aws lambda update-function-code`를 실행합니다. 수동 재배포가 필요하면:

```bash
pnpm --filter @sfood/serverless build
cd packages/serverless/dist
zip wiki-pages.zip wiki-pages.mjs && zip ai-ask.zip ai-ask.mjs && zip ai-search.zip ai-search.mjs
cd -
aws lambda update-function-code --function-name sfood-wiki-pages --zip-file fileb://packages/serverless/dist/wiki-pages.zip
aws lambda update-function-code --function-name sfood-ai-ask --zip-file fileb://packages/serverless/dist/ai-ask.zip
aws lambda update-function-code --function-name sfood-ai-search --zip-file fileb://packages/serverless/dist/ai-search.zip
```

환경변수만 바꿀 때는 `update-function-configuration`만 다시 실행합니다.

---

## 트러블슈팅

| 증상 | 원인/대응 |
|---|---|
| 모든 요청 503 + `CONFLUENCE_UNAVAILABLE` | Confluence 4개 환경변수 누락 |
| `ai-ask`/`ai-search`가 503 + `AI_PROVIDER_UNAVAILABLE` | `OPENAI_API_KEY` 누락 |
| `ai-ask`/`ai-search`가 502 + `AI_PROVIDER_UNAVAILABLE` | OpenAI 호출 자체가 실패 — 키 유효성, 모델명, 타임아웃(30초→60초) 확인 |
| CORS 오류(브라우저 클라이언트) | `WIKI_ALLOWED_ORIGIN`을 배포된 웹사이트 도메인으로 설정 |
| Lambda import 오류 | 핸들러가 `<파일명>.handler`인지, ZIP 루트에 해당 `.mjs`가 있는지 확인 |
| Playbook 로깅이 동작하지 않음 | `CONFLUENCE_PLAYBOOK_PAGE_ID` 미설정 시 정상적으로 생략됨(선택 기능) |
| Function URL(`auth-type NONE`) 호출 시 `403 Forbidden`("For troubleshooting Function URL authorization issues...") — `AuthType: NONE`과 `lambda:InvokeFunctionUrl` 리소스 정책은 정상 등록되어 있는데도 발생 | **해결됨 (2026-07-28)**: `create-function-url-config` + `add-permission --action lambda:InvokeFunctionUrl`만으로는 부족하다 — Function URL을 통한 실제 공개 호출이 되려면 **`lambda:InvokeFunction` 권한도 별도로 추가**해야 한다(조건: `lambda:InvokedViaFunctionUrl: true`). 이 계정의 다른 정상 동작 중인 Function URL 기반 Lambda(`sfood-ax-wms-stock-proxy`)와 리소스 정책을 비교해 발견함. 아래 명령을 3개 함수 모두에 추가로 실행하면 해결된다(이미 이 저장소의 3개 함수에는 적용 완료):
```bash
aws lambda add-permission --function-name <함수명> \
  --statement-id FunctionURLAllowInvokeAction \
  --action lambda:InvokeFunction --principal "*" \
  --invoked-via-function-url
```
`--function-url-auth-type` 플래그는 `lambda:InvokeFunctionUrl` 액션에만 쓸 수 있어 이 두 번째 문에는 쓸 수 없다 — 대신 `--invoked-via-function-url` 플래그를 사용한다. (참고: `--invoked-via-function-url` 없이 `lambda:InvokeFunction`을 `Principal: "*"`에 조건 없이 부여하면 Function URL을 거치지 않고도 누구나 Lambda Invoke API로 직접 호출 가능해지는 진짜 보안 위험이므로 반드시 조건을 포함해야 한다.)

---

## GitHub Secrets 목록

`.github/workflows/deploy.yml`이 참조하는 값입니다. 저장소 Settings → Secrets and variables → Actions에서 등록합니다.

| 이름 | 종류 | 값 |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | Secret | GitHub Actions 배포용 IAM 사용자 액세스 키 |
| `AWS_SECRET_ACCESS_KEY` | Secret | 위 액세스 키의 시크릿 |
| `WEB_S3_BUCKET` | Secret | 기존 정적 사이트 S3 버킷 이름 |
| `CLOUDFRONT_DISTRIBUTION_ID` | Secret | 기존 CloudFront distribution ID |
| `WIKI_PAGES_LAMBDA_NAME` | Secret | 위 2번 단계에서 생성한 wiki-pages 함수 이름 (예: `sfood-wiki-pages`) |
| `AI_ASK_LAMBDA_NAME` | Secret | ai-ask 함수 이름 (예: `sfood-ai-ask`) |
| `AI_SEARCH_LAMBDA_NAME` | Secret | ai-search 함수 이름 (예: `sfood-ai-search`) |
| `SFOOD_DESIGN_SYSTEM_TOKEN` | Secret | `sfood-it-dev-ax-org/SFOOD-DESIGN-SYSTEM`(private, `@sfood/ui`가 의존하는 저장소) 읽기 전용 fine-grained PAT — 없으면 `pnpm install`이 `could not read Username for 'https://github.com'`로 실패함 |
| `VITE_WIKI_REMOTE_ENDPOINT` | Variable | 프로덕션 빌드가 문서 목록을 가져올 엔드포인트 — 4번 단계에서 얻은 `wiki-pages` Function URL |
| `VITE_AI_ASK_ENDPOINT` | Variable | 프로덕션 빌드가 AI 질문 기능이 호출할 엔드포인트 — 4번 단계에서 얻은 `ai-ask` Function URL |
| `VITE_AI_SEARCH_ENDPOINT` | Variable | 프로덕션 빌드가 AI 검색 기능이 호출할 엔드포인트 — 4번 단계에서 얻은 `ai-search` Function URL |

IAM 사용자에게 필요한 최소 권한: `s3:PutObject`/`s3:DeleteObject`/`s3:ListBucket`(대상 버킷), `cloudfront:CreateInvalidation`(대상 distribution), `lambda:UpdateFunctionCode`(3개 함수).

**참고**: `apps/web`은 빌드 시점에 `VITE_AI_ASK_ENDPOINT`/`VITE_AI_SEARCH_ENDPOINT`/`VITE_WIKI_REMOTE_ENDPOINT`가 설정되어 있으면 그 절대 URL(각 Lambda Function URL)로 직접 요청하고, 없으면 dev 전용 상대 경로(`/api/wiki/ai/ask` 등)로 폴백합니다. 따라서 위 3개 Variable을 4번 단계에서 발급받은 Function URL로 반드시 설정해야 배포된 사이트에서 AI 질문/검색/문서 목록이 정상 동작합니다. Lambda Function URL은 기본적으로 CORS를 지원하지 않으므로, 핸들러 자체의 `WIKI_ALLOWED_ORIGIN` 환경변수를 배포된 웹사이트 도메인으로 설정해 브라우저 요청이 차단되지 않도록 합니다.
