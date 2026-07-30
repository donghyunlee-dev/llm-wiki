# wiki-mcp-server — AWS 배포 가이드

`@sfood/mcp-server`를 AWS Lambda + Function URL로 배포하는 절차입니다.
API Gateway 없이 무료 티어 범위에서 동작하며, 위키 서비스(`packages/serverless`)와 **독립적으로** 배포됩니다.

> 전제: AWS 계정, Lambda 생성 권한, 발급된 Confluence 서비스 계정 API 토큰.

---

## 1. 배포 아티팩트 생성

esbuild로 단일 ESM 파일로 번들합니다 (런타임 의존성 0개라 `node_modules` 동봉 불필요).

```bash
pnpm install
pnpm --filter @sfood/mcp-server build
# → apps/mcp-server/dist/index.mjs
```

ZIP으로 압축합니다. (핸들러 파일명이 `index.mjs`여야 함)

```bash
cd apps/mcp-server/dist
zip mcp-server.zip index.mjs
```

→ 검증: `unzip -l mcp-server.zip`에 `index.mjs`가 포함되어 있어야 한다.

---

## 2. Lambda 함수 생성

콘솔 또는 CLI로 생성합니다.

| 항목 | 값 |
|---|---|
| 함수 이름 | `sfood-wiki-mcp` |
| 런타임 | Node.js 22.x |
| 아키텍처 | arm64 (비용 절감) 또는 x86_64 |
| 핸들러 | `index.handler` |
| 메모리 | 256MB (충분) |
| 타임아웃 | 30초 |

**AWS CLI 예시:**

```bash
aws lambda create-function \
  --function-name sfood-wiki-mcp \
  --runtime nodejs22.x \
  --architectures arm64 \
  --handler index.handler \
  --timeout 30 \
  --memory-size 256 \
  --role arn:aws:iam::<ACCOUNT_ID>:role/<lambda-basic-exec-role> \
  --zip-file fileb://apps/mcp-server/dist/mcp-server.zip
```

> `index.mjs`가 `export const handler`를 내보내므로 핸들러는 `index.handler`입니다.
> Node 22 ESM 핸들러는 별도 설정 없이 `.mjs` 확장자로 인식됩니다.

→ 검증: `aws lambda get-function --function-name sfood-wiki-mcp`로 `State: Active` 확인.

---

## 3. 환경변수 설정

```bash
aws lambda update-function-configuration \
  --function-name sfood-wiki-mcp \
  --environment "Variables={\
ATLASSIAN_SITE_NAME=sfoodxproject,\
ATLASSIAN_USER_EMAIL=svc-wiki@s-food.com,\
ATLASSIAN_API_TOKEN=<API_TOKEN>,\
CONFLUENCE_SPACE_ID=63111172,\
MCP_API_KEY=<랜덤_생성_키>,\
MCP_ALLOWED_ORIGIN=*}"
```

- `MCP_API_KEY`는 강한 랜덤 값으로 생성합니다: `openssl rand -hex 32`
- `CONFLUENCE_SPACE_ID`는 **숫자 ID**입니다 (Confluence 기본).
- 토큰·키는 콘솔/CLI 환경변수에만 저장하고 소스에 커밋하지 않습니다.

→ 검증: 콘솔 Configuration → Environment variables에 5~6개 키 노출 확인.

---

## 4. Function URL 활성화

```bash
aws lambda create-function-url-config \
  --function-name sfood-wiki-mcp \
  --auth-type NONE

aws lambda add-permission \
  --function-name sfood-wiki-mcp \
  --statement-id FunctionURLAllowPublicAccess \
  --action lambda:InvokeFunctionUrl \
  --principal "*" \
  --function-url-auth-type NONE
```

> `auth-type NONE`은 IAM 인증을 끄는 것이며, 실제 접근 통제는 `x-api-key` 헤더로 수행합니다.
> 더 강한 통제가 필요하면 `auth-type AWS_IAM` + SigV4로 전환할 수 있습니다.

→ 검증: 반환된 `FunctionUrl`(예: `https://xxxx.lambda-url.ap-northeast-2.on.aws/`) 기록.

---

## 5. 동작 검증

```bash
ENDPOINT="https://xxxx.lambda-url.ap-northeast-2.on.aws/"
KEY="<MCP_API_KEY>"

# 인증 실패 → 401
curl -s -o /dev/null -w "%{http_code}\n" "$ENDPOINT" \
  -H "content-type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize"}'   # 401

# 초기화 → 200
curl -s "$ENDPOINT" -H "content-type: application/json" -H "x-api-key: $KEY" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize"}'

# 도구 목록 (5개)
curl -s "$ENDPOINT" -H "content-type: application/json" -H "x-api-key: $KEY" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'

# 검색
curl -s "$ENDPOINT" -H "content-type: application/json" -H "x-api-key: $KEY" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call",
       "params":{"name":"search_wiki","arguments":{"query":"반품 규정"}}}'
```

→ 검증:
- API Key 없는 요청 → HTTP 401
- `initialize` → `result.protocolVersion: "2024-11-05"`
- `tools/list` → tool 5개
- `search_wiki` → `result.content[0].text`에 검색 결과 JSON

---

## 6. 재배포

코드 변경 후:

```bash
pnpm --filter @sfood/mcp-server build
cd apps/mcp-server/dist && zip mcp-server.zip index.mjs && cd -
aws lambda update-function-code \
  --function-name sfood-wiki-mcp \
  --zip-file fileb://apps/mcp-server/dist/mcp-server.zip
```

환경변수만 바꿀 때는 `update-function-configuration`만 다시 실행합니다.

---

## 트러블슈팅

| 증상 | 원인/대응 |
|---|---|
| 모든 요청 500 + `missing` 키 목록 | 환경변수 누락 — 4개 Confluence 키 확인 |
| 401 지속 | 클라이언트 `x-api-key`와 `MCP_API_KEY` 불일치 |
| `search_wiki` 결과 0건 | CQL `space` 숫자 ID 확인. 0건 지속 시 `space_key` 인자로 스페이스 키 시도 |
| `get_page` `isError: Page not found` | 잘못된 page_id 또는 서비스 계정 권한 없음 |
| CORS 오류(브라우저 클라이언트) | `MCP_ALLOWED_ORIGIN`을 호출 origin으로 설정 |
| Lambda import 오류 | 핸들러가 `index.handler`인지, ZIP 루트에 `index.mjs`가 있는지 확인 |
