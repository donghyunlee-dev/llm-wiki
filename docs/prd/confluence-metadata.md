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
| `lesson` | AI 기초교육 등 좌우 전환형 학습 콘텐츠 — 홈 진입 카드와 `/lesson` 전용 화면에서만 노출 | (비노출 — 별도 Lesson 화면 전용) |

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

### `docType = lesson`
- 검색 결과, 추천 카드, `guides`/`library`/`faq` 목록에 노출하지 않는다.
- 홈 하단 진입 카드와 `/lesson`, `/lesson/:slug` 화면에서만 노출한다.
- AI 프롬프트 컨텍스트에 포함하지 않는다.
- 실제 학습 콘텐츠는 `bodyHtml`이 아니라 별도 Content Property `lesson.presentation`에 있다. `bodyHtml`은 Confluence 편집기 안에서 사람이 읽기 위한 미러 텍스트일 뿐이며 앱은 이를 파싱하지 않는다.
- **Course Manifest(코스 순서)는 `wiki.metadata`에 평탄화된 필드로 결정한다.** `courseId`+`order`가 없는 레슨은 코스 개요/`/lesson` 목록에서 제외된다(더 이상 `next` 체인 폴백은 없다).

```json
{
  "docType": "lesson",
  "courseId": "ai-foundation",
  "order": 1,
  "chapter": "AI 이해의 시작",
  "estimatedMinutes": 5,
  "learningObjectives": ["AI를 업무에 적용하기 전에 이해·설명·확인의 흐름을 따라야 하는 이유를 설명한다"],
  "lastReviewedAt": "2026-08-04"
}
```

| 필드 | 타입 | 역할 |
| --- | --- | --- |
| `courseId` | string | 같은 값을 가진 레슨끼리 하나의 과정으로 묶는다 — 없으면 이 레슨은 코스 개요에서 제외된다 |
| `order` | number | 과정 내 정렬 순서(오름차순) |
| `chapter` | string(선택) | `/lesson` 학습 흐름 드로어에서 챕터 그룹 헤더로 표시된다 |
| `estimatedMinutes` | number(선택) | 있으면 이 값을 그대로 쓰고, 없으면 Scene 수 기반 추정치(Scene당 1.5분)로 대체한다 |
| `learningObjectives` | string[](선택) | 학습자 화면에는 노출하지 않는다(저작/QA 참고용) |
| `lastReviewedAt` | string(선택) | 콘텐츠 최종 검토일 — 학습자 화면에는 노출하지 않는다 |

### `lesson.presentation` Content Property

`wiki.metadata`와는 별개인 Content Property다(같은 페이지에 두 속성이 공존). lesson docType 문서에만 존재하며, 없으면 해당 레슨은 코스 개요/리더 화면에서 제외된다.

```json
{
  "schemaVersion": 1,
  "lessonId": "today-route",
  "theme": "ai-foundation",
  "scenes": [
    {
      "sceneId": "today-route-main",
      "anchor": "AI를 이해하고 업무에 적용하는 흐름을 알아야 합니다.",
      "type": "concept",
      "layout": "visual-split",
      "motion": "step-reveal",
      "narration": "오늘은 AI를 업무에 쓰기 전에 무엇을 먼저 이해해야 하는지부터 짚어보겠습니다...",
      "blocks": [
        { "order": 1, "kind": "hook", "content": "AI를 업무에 쓰기 전에 무엇을 이해해야 할까요?" },
        { "order": 2, "kind": "explanation", "content": "일은 많고 시간·인력·전문성이 부족해 실행이 막힐 때 AI를 활용해서 해결할 수 있습니다." },
        {
          "order": 3,
          "kind": "visual",
          "visualKind": "step-cards",
          "html": "<div class=\"visual-today-route-main\">...</div>",
          "css": ".visual-today-route-main{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}"
        }
      ],
      "interaction": { "kind": "step-reveal", "steps": ["이해 카드 공개", "설명 카드 공개", "확인 카드 공개"] },
      "completionEvidence": "학습자가 AI를 업무에 적용하려면 이해·설명·확인의 흐름을 따라야 한다는 것을 자신의 말로 설명한다",
      "transitionToNext": "먼저 AI가 무엇을 학습하고 어떻게 배우는지 알아보겠습니다."
    }
  ]
}
```

| 필드 | 타입 | 허용값 | 역할 |
| --- | --- | --- | --- |
| `schemaVersion` | number | `1` | 이 값이 아니면 레슨 전체를 조용히 제외한다(향후 스키마 변경 시 별도 마이그레이션 필요) |
| `scenes[].sceneId` | string | 자유 텍스트 | Scene 고유 식별자 |
| `scenes[].anchor` | string | 자유 텍스트(보통 페이지 제목과 동일) | 리더 화면 제목(H1)과 학습 흐름 드로어에 표시된다 |
| `scenes[].type` | string | 기존 `SceneType` enum(`concept`/`comparison`/`example`/`closing` 등) | Scene의 학습 역할 — CSS 클래스로만 반영(예: `.lesson-scene-concept`) |
| `scenes[].layout` | string | 기존 `SceneLayout` enum(`visual-split`/`grid`/`side-by-side`/`focus` 등) | Scene 레이아웃 CSS 클래스 |
| `scenes[].motion` | string(선택) | `step-reveal`/`stagger`/`fade`/`highlight` 등 | 캡처만 하고 현재 렌더링에는 반영하지 않는다(향후 확장 지점) |
| `scenes[].narration` | string | 자유 텍스트 | "대본 보기" 토글에 표시되는 내레이션 |
| `scenes[].blocks[].kind` | string | `hook`/`explanation`/`example`/`visual` | `hook`→큰 강조 문구, `explanation`→본문, `example`→강조 카드, `visual`→`html`+`css`를 sandbox iframe으로 렌더링. 인식하지 못하는 `kind`는 조용히 무시한다 |
| `scenes[].interaction` | object(선택) | `{ "kind": string, "steps": string[] }` | 캡처만 하고 클릭 게이팅에는 연결하지 않는다 — 참고 사이트 실측 확인 결과 `reveal: "manual"`이 있어도 Scene은 진입 즉시 모든 블록을 보여준다 |
| `scenes[].completionEvidence` | string(선택) | 자유 텍스트 | 학습자 화면에는 노출하지 않는다(저작/QA 참고용) |
| `scenes[].transitionToNext` | string(선택) | 자유 텍스트 | Scene 하단에 강조 배너로 노출된다 |

**주의**: `hook`/`explanation`/`example` 블록의 `content`는 순수 텍스트다(HTML 태그를 넣어도 그대로 에스케이프되어 문자 그대로 표시된다) — 링크나 서식이 필요하면 `visual` 블록의 `html`/`css`를 사용한다. `visual` 블록은 sandbox iframe(`allow-same-origin`만, `allow-scripts` 없음) 안에서 렌더링되므로, 그 안의 링크를 클릭해도 부모 페이지의 참고 자료 패널로 연결되지 않는다(iframe은 별도 브라우징 컨텍스트).

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
