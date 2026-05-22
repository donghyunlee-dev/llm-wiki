# Plan: Playbook 검색 로깅

## 영향 범위

| 파일 | 변경 유형 |
|---|---|
| `packages/wiki-core/src/lib/confluenceClient.ts` | 확장 — Confluence 쓰기 API 추가 |
| `packages/wiki-core/src/lib/playbookLogger.ts` | 신규 — 로깅 로직 |
| `packages/wiki-core/src/index.ts` | 확장 — playbookLogger 내보내기 추가 |
| `apps/web/vite.config.ts` | 확장 — 검색 응답 후 비동기 로그 호출 추가 |
| `apps/web/.env.example` | 확장 — `CONFLUENCE_PLAYBOOK_PAGE_ID` 항목 추가 |

## 기술 접근

### Confluence 쓰기 API (confluenceClient.ts 확장)

필요한 호출:
1. `GET /wiki/api/v2/pages/{playbook-id}/children` — 일별 페이지 존재 여부 확인
2. `GET /wiki/api/v2/pages/{page-id}?body-format=storage` — 기존 페이지 버전 + 본문 조회
3. `POST /wiki/api/v2/pages` — 신규 일별 페이지 생성
4. `PUT /wiki/api/v2/pages/{page-id}` — 기존 페이지에 항목 추가 (버전 +1)

### playbookLogger.ts

```
logSearchToPlaybook(config, entry)
  └─ buildDailyPageTitle(date)              // "Playbook - 2026-05-19"
  └─ findDailyPlaybookPage(config, title)   // children 조회
  └─ if 없음: createDailyPlaybookPage()     // 신규 생성 + 로그 테이블 생성
  └─ if 있음: appendPlaybookEntryRow()      // 버전 조회 → 기존 tbody에 행 추가
```

### 충분도 판단 로직

```
부족 조건 (하나라도 해당):
  - unsupportedClaims.length > 0
  - recommendedDocuments.length < 2

충분: 위 조건 모두 불해당
```

### 부족 키워드 추출

`unsupportedClaims`가 있으면 해당 텍스트에서 명사/핵심어를 그대로 사용.
없고 부족(문서 1개 이하)이면 질문 원문을 그대로 표기.

### Confluence Storage Format 본문 구조

```xml
<table>
  <thead>
    <tr>
      <th>검색 일시</th>
      <th>질문</th>
      <th>응답 요약</th>
      <th>추천 문서</th>
      <th>충분도</th>
      <th>부족 키워드</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>YYYY-MM-DD HH:mm</td>
      <td>...</td>
      <td>...</td>
      <td>문서1, 문서2</td>
      <td>충분 / 부족</td>
      <td>...</td>
    </tr>
  </tbody>
</table>
```

### 환경변수

`CONFLUENCE_PLAYBOOK_PAGE_ID=62750737` — .env.local에 추가 필요

### 비동기 처리 (vite.config.ts)

```typescript
response.end(JSON.stringify(responsePayload));
// fire-and-forget — 응답 반환 후 실행
logSearchToPlaybook(...).catch((err) => console.error("[playbook]", err));
```

## 검증 계획

1. 로컬 dev 서버에서 검색 실행 → Confluence Playbook 일별 하위 페이지 생성 확인
2. 같은 날 재검색 → 기존 페이지의 단일 로그 테이블에 행이 추가됨 확인
3. Confluence 쓰기 실패 시 검색 응답에 영향 없음 확인
4. `pnpm typecheck`, `pnpm test` 통과

## 리스크

- Confluence API 토큰 쓰기 권한 미보유 시 → silent fail (콘솔 로그)
- 일별 페이지 동시 생성 경합(같은 초에 두 요청) → 실사용에서 발생 가능성 낮음, 현재 미처리
