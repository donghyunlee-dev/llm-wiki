# 데이터 명세

## 진실 원천 규칙

Confluence 페이지 콘텐츠와 계층 구조가 진실 원천이다. 제품은 위키 콘텐츠를 위한 별도의 관계형 애플리케이션 데이터 저장소를 만들지 않는다.

## 콘텐츠 종류

- 가이드 (Guide)
- 프로젝트 예시 (Project Example)
- 라이브러리 리소스 (Library Resource)
- FAQ
- 정책 참고 (Policy Reference)
- 운영 정책 (Operations Policy)

## 정식 메타데이터 키

Confluence 콘텐츠 속성 키: `wiki.metadata`

```json
{
  "docType": "overview",
  "visibility": "public",
  "audience": "intermediate",
  "status": "published",
  "prerequisites": [],
  "next": [],
  "related": []
}
```

## 필드 규칙

| 필드 | 타입 | 허용값 | 필수 |
| --- | --- | --- | --- |
| `docType` | string | 아래 표 참고 | 필수 |
| `visibility` | string | `public`, `internal` | 필수 |
| `audience` | string | `beginner`, `intermediate`, `advanced` | 필수 |
| `status` | string | `draft`, `reviewed`, `published` | 필수 |
| `prerequisites` | string[] | Confluence 페이지 ID | 필수 |
| `next` | string[] | Confluence 페이지 ID | 필수 |
| `related` | string[] | Confluence 페이지 ID | 필수 |

### docType 허용값

| 값 | 의미 | 카테고리 분류 |
| --- | --- | --- |
| `overview` | 개요 문서 | guides |
| `concept` | 개념 설명 문서 | guides |
| `tutorial` | 단계별 튜토리얼 | guides |
| `howto` | 방법론 문서 | guides |
| `index` | 가이드 계열 진입 인덱스 페이지 | guides |
| `reference` | 레퍼런스 문서 | library |
| `router` | 라우팅 전용 페이지 | library |
| `registry` | 레지스트리 페이지 | library |
| `troubleshooting` | 문제 해결 문서 | faq |
| `example` | 프로젝트 예시 문서 | projects |
| `ops` | 운영 내부 문서 — 공개 위키에서 제외, AI 컨텍스트에도 미사용 | (비노출) |
| `policy` | 내부 정책 문서 — 공개 위키에서 제외, AI 답변 숨김 컨텍스트로 사용 | (비노출) |

## 공개 범위 규칙

다음 조건을 모두 충족해야 사용자에게 노출된다.

- 설정된 Confluence 스페이스(`63111172`)에 속할 것
- Confluence 페이지 상태가 `current`일 것
- `wiki.metadata.visibility = public`
- `wiki.metadata.status = published`
- `wiki.metadata.docType`이 `ops` 또는 `policy`가 아닐 것
- 페이지 카테고리가 `guides`, `projects`, `library`, `faq` 중 하나이거나, 제목이 `Playbook`일 것
- 제목과 슬러그가 온보딩 Q&A 패턴에 해당하지 않을 것

## 숨김 처리 대상

### policy 문서
- `docType = policy` 페이지는 AI Ask와 AI 검색의 숨김 답변 생성 컨텍스트로 로드된다.
- 공개 검색 결과, 추천 페이지 카드, 공개 섹션 목록에 노출하지 않는다.

### ops 문서
- `docType = ops` 페이지는 공개 위키 레코드에서 제외된다.
- AI 프롬프트 컨텍스트에도 포함하지 않는다.

### 온보딩 Q&A 문서
- 제목 또는 슬러그가 `s*-***` 패턴과 일치하는 페이지는 읽기 모델에서 완전히 제외된다.
- 해당 페이지를 `parentId`로 갖는 자식 페이지도 함께 제외된다 (부모 차단 전파).

## 핵심 애플리케이션 모델

### WikiDocument

위키 본문 페이지의 정규화된 읽기 모델이다. Confluence 원시 페이지를 정규화한 결과물로, SPA와 검색·AI Ask 흐름에서 사용된다.

```
WikiDocument
- id                     Confluence 페이지 ID
- parentId?              상위 페이지 ID (선택)
- slug                   URL 슬러그
- category               guides | projects | library | faq
- title                  페이지 제목
- summary                본문 앞부분에서 추출한 요약
- updatedAt              마지막 수정일 (YYYY-MM-DD)
- sourceUrl?             Confluence 원본 URL (선택)
- metadata
    - docType            위의 docType 허용값 참고
    - visibility         "public" (고정 — 공개 문서만 읽기 모델에 포함)
    - audience           beginner | intermediate | advanced
    - status             "published" (고정 — published 문서만 포함)
    - prerequisites[]    선행 문서 페이지 ID 목록
    - next[]             다음 문서 페이지 ID 목록
    - related[]          관련 문서 페이지 ID 목록
- headings[]
    - id                 앵커 ID
    - level              헤딩 레벨 (1–6)
    - text               헤딩 텍스트
- contentHtml            정제된 본문 HTML
```

### PolicyDocument

AI 답변 생성에 사용하는 숨김 정책 문서 모델이다.

```
PolicyDocument
- id                     Confluence 페이지 ID
- version                Confluence 버전 번호
- title                  페이지 제목
- summary                본문 첫 문장 (최대 240자)
- contentText            평문 변환 본문 (최대 4000자)
- sourceUrl?             Confluence 원본 URL (선택)
- cacheKey               "{id}:{version}:policy" 형식의 캐시 키
- sourceKind             "policy" (고정 — ops 문서는 현재 포함하지 않음)
```

### GraphEdge

문서 간 관계 엣지 모델이다. 현재 UI에서 메타데이터 참조 용도로만 사용한다.

```
GraphEdge
- sourcePageId
- targetPageId
- type    prerequisite | next | related | parent
```

## 유효성 오류 종류

- `missing_metadata` — `wiki.metadata` 속성 없음
- `invalid_enum` — 허용값 범위 초과
- `broken_reference` — `prerequisites`, `next`, `related`가 존재하지 않는 페이지 ID를 가리킴
- `inaccessible_reference` — 참조 페이지가 공개 범위 밖에 있음
- `stale_review` — 검토 주기 초과 (미구현)

## MVP 저장 정책

- RDBMS 스키마 없음
- 로컬 콘텐츠 복제본을 제품 진실 원천으로 사용하지 않음
- 선택적 메모리 캐시만 허용 (개발 서버: 5분 TTL, 프로덕션: 서버리스 무상태)
- 첨부파일 참조는 Confluence에 유지하며 필요할 때 조회
