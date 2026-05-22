# Confluence 메타데이터 정의

## 개요

Confluence 페이지에 부착하는 콘텐츠 속성(content property)이다.
위키 앱이 페이지 공개 범위, 분류, 문서 관계, 검색 보조 정보를 결정하는 유일한 진실 원천이다.

- **속성 키**: `wiki.metadata`
- **대상 스페이스**: `63111172` (AI Agent Wiki)

---

## 스키마

```json
{
  "docType": "nav",
  "audience": "beginner",
  "status": "published",
  "prerequisites": [],
  "next": [],
  "related": [],
  "lastReviewedAt": "2026-05-12",
  "reviewCycleDays": 90,
  "keywords": []
}
```

---

## 필드 정의

| 필드 | 타입 | 허용값 | 필수 | 역할 |
| --- | --- | --- | --- | --- |
| `docType` | string | 아래 표 참고 | 필수 | 검색·추천·라우팅의 1차 분류 기준 |
| `audience` | string | `beginner`, `intermediate`, `advanced` | 필수 | 대상 독자 수준 |
| `status` | string | `draft`, `reviewed`, `published` | 필수 | 문서 상태 |
| `prerequisites` | string[] | Confluence 페이지 ID | 필수 | 먼저 읽어야 하는 선행 문서 그래프 |
| `next` | string[] | Confluence 페이지 ID | 필수 | 다음에 읽을 학습·진행 경로 |
| `related` | string[] | Confluence 페이지 ID | 필수 | 관련 문서 그래프 |
| `lastReviewedAt` | string | ISO 8601 날짜 (`YYYY-MM-DD`) | 필수 | 마지막 검토일 — 문서 신선도 관리 |
| `reviewCycleDays` | number | 양의 정수 (예: `90`) | 필수 | 재검토 주기(일) |
| `keywords` | string[] | 자유 텍스트 키워드 | 필수 | AI 검색·라우팅 보조 키워드 |

---

## docType 허용값

| 값 | 의미 | 앱 카테고리 |
| --- | --- | --- |
| `nav` | Index, Getting Started, 최상위 탐색 문서 | (비노출) |
| `guide` | 사용자가 목적을 가지고 따라가는 스토리형·종합형·단계형 문서 | guides |
| `page` | 설치, 설정, 실행, 설명이 있는 단위 문서 | guides |
| `faq` | 자주 묻는 질문과 짧은 답변 문서 | faq |
| `policy` | AI 사용 정책, 보안 기준, 비용 처리, 승인 기준 — 공개 위키 제외, AI 숨김 컨텍스트로만 사용 | (비노출) |
| `library` | 기본 지침서, 템플릿, 참고 자료 모음 | library |
| `playbook` | 문제 해결 절차, 운영 시나리오, 내부 실행 절차 — 공개 위키 및 AI 컨텍스트 모두 제외 | (비노출) |
| `ops` | Wiki 운영, metadata, recompile, update rule 문서 — 공개 위키 및 AI 컨텍스트 모두 제외 | (비노출) |

---

## 공개 노출 조건

다음 조건을 모두 충족해야 사용자에게 노출된다.

- 대상 Confluence 스페이스(`63111172`)에 속할 것
- Confluence 페이지 상태가 `current`일 것
- `status = published`
- `docType`이 `ops`, `policy`, `nav`, `playbook`이 아닐 것
- 앱 카테고리가 `guides`, `library`, `faq` 중 하나일 것 (`guide`, `page` → guides / `faq` → faq / `library` → library)
- 제목·슬러그가 온보딩 Q&A 패턴(`s*-***`)에 해당하지 않을 것

---

## 비노출 처리 규칙

### `docType = policy`
- AI Ask 및 AI 검색의 **숨김 컨텍스트**로 로드된다.
- 공개 검색 결과, 추천 카드, 섹션 목록에 노출하지 않는다.

### `docType = ops`
- 공개 위키 레코드에서 제외된다.
- AI 프롬프트 컨텍스트에도 포함하지 않는다.

### `docType = playbook`
- 공개 위키 레코드에서 제외된다.
- AI 프롬프트 컨텍스트에도 포함하지 않는다.
- Confluence 내부 운영 전용 문서(문제 해결 절차, 운영 시나리오)로만 사용한다.

### `docType = nav`
- 위키 본문 노출에서 제외된다.
- 페이지 검색 인덱스 확장 단계(`getIndexFirstSearchWikiDocumentsIn`)에서 하위 페이지 후보를 찾는 용도로만 사용된다.
- AI 프롬프트의 답변 생성 컨텍스트(`searchResults`)에 포함하지 않는다. AI가 nav 문서를 답변 본문이나 `confluenceData`에 인용하지 않도록 서버에서 제거한다.

### 온보딩 Q&A 문서
- 제목 또는 슬러그가 `s*-***` 패턴과 일치하는 페이지는 읽기 모델에서 완전히 제외된다.
- 해당 페이지를 `parentId`로 갖는 자식 페이지도 함께 제외된다(부모 차단 전파).

---

## 유효성 오류 종류

| 오류 코드 | 설명 |
| --- | --- |
| `missing_metadata` | `wiki.metadata` 속성 없음 |
| `invalid_enum` | 허용값 범위 초과 |
| `broken_reference` | `prerequisites`, `next`, `related`가 존재하지 않는 페이지 ID를 가리킴 |
| `inaccessible_reference` | 참조 페이지가 공개 범위 밖에 있음 |
| `stale_review` | `lastReviewedAt` + `reviewCycleDays` 초과 |
