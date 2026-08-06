# AI 기초교육 Lesson Player 개발 설계 계획서

> 문서 상태: 개발 기준안  
> 대상 시스템: Confluence 기반 AI Wiki의 `Lesson` 영역  
> 핵심 제약: 별도 콘텐츠 DB 없음, Confluence가 원본 저장소  
> 핵심 경험: 세로 문서가 아닌 좌우 전환형 강의 장면  
> 권장 기본 기술: 개발되어 있는 기술 스펙 사용

## 문서 목적

이 문서는 Confluence의 AI 기초교육 문서를 Wiki 화면에서 영상 강의나 프레젠테이션처럼 보여 주는 시스템의 구현 기준을 정의한다.

단순한 블로그 뷰어나 Confluence 페이지 스킨이 목표가 아니다. 교육 콘텐츠 관리 에이전트가 일정한 규격으로 작성한 문서를 검증하고, Wiki가 이를 장면 단위로 변환하여 사용자가 강사의 설명 없이도 순서대로 이해할 수 있게 만드는 것이 목표다.

완성된 시스템은 다음 과정을 일관되게 수행해야 한다.

`교육 목표 → 커리큘럼 → 레슨 → 장면 → 의미 블록 → 화면 컴포넌트 → 인터랙션과 모션`

콘텐츠가 늘어나더라도 이 연결이 깨지지 않아야 하며, 새로운 Wiki 문서가 생겼다는 이유만으로 기초교육 과정에 무분별하게 포함되어서는 안 된다.

## 핵심 설계 결정

| 항목 | 결정 |
|---|---|
| 원본 저장소 | Confluence |
| 교육 트리 루트 | 기존 `Lesson` 페이지 |
| 별도 콘텐츠 DB | 사용하지 않음 |
| 문서 형식 | 사람이 읽을 수 있는 Confluence 본문 + 기계가 읽는 Content Property |
| 화면 단위 | Page가 아니라 Scene |
| 기본 이동 | 좌우 전환 |
| 세로 스크롤 | Lesson Player 내부에서는 사용하지 않음 |
| 렌더링 방식 | 임의 HTML 변환이 아닌 허용된 Scene 컴포넌트 조합 |
| 애니메이션 | 사전에 정의한 Motion Preset만 사용 |
| 진도 저장 | 초기 버전은 브라우저 `localStorage` |
| 문서 갱신 | 에이전트가 초안 작성·검증 후 Confluence에 반영 |
| 화면 안전성 | 콘텐츠 예산을 넘으면 글자를 줄이지 않고 Scene을 분리 |
| 접근성 | 키보드, 포커스, 모션 축소, 대체 텍스트를 기본 제공 |

## 개발 목표

### 학습 목표

모든 기초 레슨을 순서대로 학습한 직원은 다음 상태가 되어야 한다.

- AI가 무엇을 잘하고 무엇을 잘하지 못하는지 설명할 수 있다.
- 모델, 프롬프트, 컨텍스트, 도구, 에이전트 같은 기본 개념을 서로 구분할 수 있다.
- AI의 답변이 틀리거나 달라지는 이유를 기초 개념으로 해석할 수 있다.
- 실제 업무 개선 실습에 들어가기 전에 필요한 공통 언어와 사고방식을 갖춘다.
- 이후 자동화·업무 도구·알림 서비스 개발 교육을 이해할 준비가 된다.

이 시스템 자체가 실습 교육을 대체하지는 않는다. 현재 범위는 실습 이전에 반드시 필요한 기초 이해를, 강사의 추가 설명 없이 콘텐츠만으로 형성하는 것이다.

### 사용자 경험 목표

- 첫 화면에서 현재 과정, 레슨, 학습 위치를 즉시 파악한다.
- 한 장면에는 하나의 질문 또는 하나의 핵심 개념만 보인다.
- 설명은 글만 나열하지 않고 도형, 관계, 흐름, 비교, 강조로 표현한다.
- 다음 행동이 항상 명확하다.
- 화면을 넘길 때 학습 흐름이 끊기지 않는다.
- 장식이 아니라 이해를 돕는 움직임만 사용한다.
- 큰 모니터에서도 중심 내용이 작아 보이지 않는다.
- 마우스 없이도 전체 과정을 이용할 수 있다.

### 운영 목표

- 콘텐츠 관리 에이전트가 빈 상태에서도 전체 기초교육 목표를 기준으로 커리큘럼을 생성할 수 있다.
- Wiki의 성장 내용을 평가해 기존 레슨 개선, 신규 레슨 후보, 심화 자료 중 하나로 분류할 수 있다.
- Confluence에서 사람이 읽고 수정할 수 있다.
- 잘못된 속성이나 지원하지 않는 표현이 있어도 전체 과정이 중단되지 않는다.
- 디자인 변경과 콘텐츠 변경을 분리한다.

## 비목표

- 모든 Confluence 문서를 자동으로 고품질 강의로 바꾸지 않는다.
- 에이전트가 임의 HTML, CSS, JavaScript를 생성해 화면에 실행하지 않는다.
- 최신 뉴스가 생길 때마다 기초 커리큘럼의 순서를 자동 변경하지 않는다.
- 한 Scene 안에서 문서 전체를 스크롤하게 만들지 않는다.
- 시각 효과의 수나 화려함을 품질 지표로 사용하지 않는다.
- 사용자별 학습 분석, 수료증, 결제, 조직별 권한 관리는 초기 범위에 포함하지 않는다.

## 시스템 경계

### 구성 요소

| 구성 요소 | 책임 |
|---|---|
| 콘텐츠 관리 에이전트 | 커리큘럼 설계, 레슨 작성, 속성 생성, 품질 검증, 갱신 제안 |
| Confluence | 과정·레슨 원본, 계층, 메타데이터, 수정 이력 저장 |
| Wiki Backend | Confluence 조회, 파싱, 정규화, 검증, 캐시, Lesson API 제공 |
| Lesson Compiler | ADF와 속성을 `Lesson AST`로 변환 |
| Lesson Player | Scene 렌더링, 이동, Reveal, 모션, 진도 관리 |
| Wiki 검색 | 관련 자료 탐색 및 교육 후보 공급 |
| 브라우저 저장소 | 사용자 마지막 위치, 완료 상태, UI 환경 설정 저장 |

### 처리 흐름

1. 에이전트가 `Lesson` 하위에 과정 Index와 레슨 페이지를 작성한다.
2. 각 페이지 본문은 사람이 읽을 수 있게 구성한다.
3. 각 페이지의 Content Property에 과정·레슨·Scene 정보를 기록한다.
4. Wiki Backend가 Confluence REST API로 페이지와 속성을 읽는다.
5. Lesson Compiler가 ADF를 의미 블록으로 변환한다.
6. 스키마와 콘텐츠 예산을 검증한다.
7. Lesson Player가 허용된 컴포넌트와 모션으로 Scene을 렌더링한다.
8. 사용자의 Reveal과 Scene 위치를 로컬에 저장한다.
9. 페이지 버전이 바뀌면 캐시와 저장된 위치를 안전하게 조정한다.

## Confluence 정보 구조

### 권장 페이지 계층

```text
Lesson
└── AI 기초교육 Index
    ├── AI를 이해하는 첫 번째 관점
    ├── AI 모델은 무엇인가
    ├── 질문이 답변을 바꾸는 이유
    ├── 컨텍스트와 기억의 한계
    ├── 파일과 지식은 어떻게 사용되는가
    ├── AI가 틀리는 이유
    ├── 도구를 사용하는 AI
    ├── 에이전트는 어떻게 일하는가
    └── 기초교육 마무리
```

`Lesson` 바로 아래에 모든 콘텐츠 페이지를 평면적으로 만들지 않는다. `과정 Index`를 중간 부모로 사용해야 과정이 추가되더라도 계층과 권한, 정렬, 상태를 독립적으로 관리할 수 있다.

### 페이지 역할

| 역할 | 설명 |
|---|---|
| Lesson Root | Wiki가 교육 과정을 탐색하는 고정 진입점 |
| Course Index | 과정 목표, 대상, 레슨 순서, 전체 버전을 가진 Manifest |
| Lesson Page | 실제 교육 본문과 Scene 정의 |
| Reference Page | 자세한 설명이나 출처. 정규 학습 흐름에서는 분리 |
| Draft Page | 에이전트가 만든 검토 전 페이지. Player 기본 목록에서 제외 |

### 정렬 규칙

- 화면 순서는 Confluence 제목이나 생성 날짜가 아니라 Course Manifest의 `lessonIds`가 결정한다.
- Confluence 계층은 탐색과 권한의 기준이고, Manifest는 학습 순서의 기준이다.
- Manifest에 없는 페이지는 정규 과정에 포함하지 않는다.
- Manifest가 손상되면 Confluence 하위 페이지 목록으로 복구 화면을 만들되 자동 게시하지 않는다.

## 메타데이터 계약

Confluence 본문은 설명을 담당하고 Content Property는 렌더링 계약을 담당한다.

### 과정 속성

권장 키: `lesson.course`

```json
{
  "schemaVersion": "1.0",
  "courseId": "ai-foundation",
  "title": "AI 기초교육",
  "description": "업무에서 AI를 올바르게 이해하기 위한 공통 기초 과정",
  "audience": ["ai-beginner", "employee"],
  "status": "published",
  "version": 3,
  "lessonIds": [
    "ai-foundation-01",
    "ai-foundation-02",
    "ai-foundation-03"
  ],
  "completionRule": {
    "type": "all-lessons",
    "requireKnowledgeChecks": true
  },
  "updatedAt": "2026-07-30T10:00:00+09:00"
}
```

### 레슨 공통 속성

권장 키: `wiki.metadata`

```json
{
  "schemaVersion": "1.0",
  "docType": "lesson",
  "courseId": "ai-foundation",
  "lessonId": "ai-foundation-04",
  "chapter": "AI와 대화하기",
  "order": 4,
  "status": "published",
  "version": 2,
  "audience": ["ai-beginner"],
  "estimatedMinutes": 8,
  "prerequisites": ["ai-foundation-03"],
  "learningObjectives": [
    "컨텍스트의 의미를 설명한다",
    "AI가 앞선 내용을 놓치는 이유를 설명한다"
  ]
}
```

### 화면 속성

권장 키: `lesson.presentation`

```json
{
  "schemaVersion": "1.0",
  "lessonId": "ai-foundation-04",
  "theme": "foundation-light",
  "scenes": [
    {
      "sceneId": "memory-question",
      "anchor": "분명-앞에서-말했는데",
      "type": "hook",
      "layout": "visual-split",
      "motion": "step-reveal",
      "reveal": "manual",
      "visual": {
        "kind": "context-window",
        "emphasis": "overflow"
      }
    },
    {
      "sceneId": "context-definition",
      "anchor": "컨텍스트란",
      "type": "mental-model",
      "layout": "horizontal-flow",
      "motion": "path-draw",
      "reveal": "manual"
    }
  ]
}
```

### 속성 관리 원칙

- `schemaVersion`은 반드시 포함한다.
- ID는 제목과 분리한다. 제목 변경으로 링크가 깨지지 않아야 한다.
- 허용된 Enum 외의 `type`, `layout`, `motion` 값은 게시 검증에서 거부한다.
- 속성에 본문 전체를 중복 저장하지 않는다.
- Content Property 크기 제한에 가까워지면 레슨을 나눈다.
- 게시 상태는 `draft`, `review`, `published`, `archived` 중 하나다.
- Player는 기본적으로 `published`만 노출한다.

## Confluence 레슨 작성 규격

### 기본 문서 구조

```markdown
# 컨텍스트와 기억의 한계

> 분명 앞에서 말했는데, 왜 기억하지 못할까?

## 분명 앞에서 말했는데

도입 설명

[시각 자료 또는 의미 블록]

## 컨텍스트란

핵심 설명

[흐름 또는 비교]

## 기억처럼 보이는 이유

설명

## 컨텍스트 창이 가득 차면

설명과 예시

## 무엇을 기억시켜야 할까

업무 적용 전의 판단 기준

## 확인하기

간단한 이해 확인

## 마무리

학습 목표와 연결되는 결론
```

### Scene 경계

- 레슨 제목인 H1은 페이지에 하나만 사용한다.
- H2 하나가 Scene 하나의 경계다.
- H3는 Scene 내부의 보조 구분이며 새로운 Scene을 만들지 않는다.
- 한 Scene이 콘텐츠 예산을 넘으면 H2를 추가해 분리한다.
- 의미 없는 "내용 1", "추가 설명" 같은 제목은 금지한다.
- Scene 제목은 질문, 판단, 변화, 핵심 개념 중 하나를 드러내야 한다.

### ADF 의미 매핑

| Confluence 요소 | 의미 | 기본 화면 변환 |
|---|---|---|
| H2 | Scene 시작 | Scene title |
| 일반 문단 | 설명 | Body copy |
| 굵게 | 핵심 용어 | Keyword emphasis |
| Blockquote | 질문·도입 | Hook statement |
| Bullet list | 병렬 정보 | Bullet reveal |
| Numbered list | 순서·절차 | Step flow |
| Table | 비교·대응 | Comparison component |
| Panel: info | 보충 설명 | Info callout |
| Panel: warning | 주의·오해 | Misconception callout |
| Expand | 선택적 상세 | Side detail 또는 별도 Reference |
| Image/Media | 시각 설명 | Visual stage |
| Link | 출처·추가 정보 | Reference action |
| Status | 검토 상태 | 편집 화면 전용 |

### 지원하지 않는 요소

- 임의 HTML과 Script
- iframe 자동 실행
- 중첩 깊이가 과도한 표
- 다섯 단계 이상의 중첩 목록
- Scene 내부의 세로 스크롤 영역
- 화면 전체를 채우는 원문 코드 블록
- 출처가 없는 외부 이미지

지원하지 않는 요소는 삭제하지 않는다. 읽기 전용 `unsupported` 블록으로 변환하고 편집자에게 검증 오류를 제공한다.

## 콘텐츠 예산

세로 스크롤을 없애려면 디자인보다 먼저 콘텐츠의 양을 통제해야 한다.

| 항목 | 권장 | 하드 제한 |
|---|---:|---:|
| Scene 제목 | 한 줄 | 두 줄 |
| 핵심 주장 | 1개 | 1개 |
| 본문 문단 | 1~2개 | 3개 |
| 문단 길이 | 45~90자 | 140자 |
| Bullet | 3개 | 5개 |
| 핵심 개념 | 1~2개 | 3개 |
| 주요 시각 자료 | 1개 | 1개 |
| 보조 시각 자료 | 0~1개 | 2개 |
| Reveal 단계 | 2~4개 | 6개 |
| 표 | 2~4열 | 5열 |

하드 제한을 넘으면 다음 순서로 처리한다.

- 자동 축소하지 않는다.
- 내부 스크롤을 만들지 않는다.
- 정보 우선순위를 다시 평가한다.
- 보충 설명을 Reference로 이동한다.
- 서로 다른 질문이나 개념을 별도 Scene으로 분리한다.
- 분리 후에도 학습 흐름이 자연스러운지 검증한다.

## 교육 콘텐츠 설계 기준

### 레슨의 역할

각 레슨은 독립적인 글이 아니라 전체 과정에서 하나의 인지 변화를 책임진다.

레슨은 다음 질문에 답해야 한다.

- 학습자가 시작할 때 무엇을 모르거나 오해하는가?
- 이 레슨을 마치면 무엇을 자기 말로 설명할 수 있는가?
- 앞 레슨에서 어떤 개념을 가져오는가?
- 다음 레슨을 이해하는 데 무엇을 넘겨주는가?
- 이 내용이 없으면 이후 업무 개선 실습에서 어떤 판단을 잘못하는가?

### 레슨 서사

권장 서사는 다음과 같다.

| 단계 | 목적 | 대표 Scene |
|---|---|---|
| 문제 인식 | 익숙한 경험으로 궁금증 생성 | Hook |
| 기존 생각 확인 | 초보자의 오해를 드러냄 | Misconception |
| 핵심 모델 제시 | 머릿속에 구조를 만듦 | Mental model |
| 작동 원리 설명 | 원인과 결과를 연결 | Process |
| 차이 구분 | 비슷한 개념을 분리 | Comparison |
| 친숙한 예시 | 추상 개념을 일상 언어로 변환 | Example |
| 다시 설명 | 핵심을 다른 표현으로 재구성 | Summary |
| 이해 확인 | 기억이 아닌 설명 가능 여부 확인 | Knowledge check |
| 다음 연결 | 다음 레슨의 필요성을 만듦 | Closing |

모든 레슨이 모든 Scene 유형을 사용할 필요는 없다. 그러나 `문제 인식 → 핵심 이해 → 확인 → 다음 연결`은 유지한다.

### 설명 품질 기준

- 용어보다 경험을 먼저 제시한다.
- 정의를 제시한 뒤 예시를 붙이는 데 그치지 않고, 예시가 정의의 어떤 부분을 보여 주는지 연결한다.
- 한 문장에서 새로운 전문 용어를 두 개 이상 도입하지 않는다.
- 비유는 이해를 돕는 범위와 실제 개념이 다른 지점을 함께 설명한다.
- "쉽게 말하면"이라는 표현 대신 실제로 쉬운 문장을 작성한다.
- 기술적으로 정확하지만 초보자에게 필요 없는 세부사항은 Reference로 이동한다.
- 정답을 외우는 질문보다 "왜 그런가"를 설명하게 하는 확인 문제를 사용한다.
- 최신 뉴스는 기초 개념을 설명하는 안정적인 사례일 때만 정규 레슨에 포함한다.

## Scene 모델

### 지원 Scene 유형

| Type | 학습 역할 | 권장 Layout | 권장 Motion |
|---|---|---|---|
| `hook` | 질문과 문제 인식 | `focus`, `visual-split` | `fade`, `step-reveal` |
| `mental-model` | 핵심 구조 형성 | `horizontal-flow`, `full-visual` | `path-draw`, `morph` |
| `concept` | 개념 설명 | `visual-split` | `step-reveal` |
| `process` | 순서와 작동 원리 | `horizontal-flow`, `timeline` | `path-draw`, `stagger` |
| `comparison` | 차이와 선택 기준 | `side-by-side`, `grid` | `highlight` |
| `example` | 실제 상황 연결 | `visual-split`, `screenshot-hotspot` | `zoom-focus` |
| `screenshot` | 화면 기반 설명 | `full-visual`, `screenshot-hotspot` | `zoom-focus` |
| `misconception` | 오해 교정 | `side-by-side` | `morph`, `highlight` |
| `knowledge-check` | 이해 확인 | `focus`, `grid` | `feedback` |
| `summary` | 기억 구조 정리 | `horizontal-flow`, `grid` | `stagger` |
| `closing` | 다음 레슨 연결 | `focus` | `fade` |

### 지원 Layout

| Layout | 구조 | 사용 조건 |
|---|---|---|
| `focus` | 중앙 질문 또는 결론 | 텍스트가 짧고 강한 장면 |
| `visual-split` | 텍스트 40%, 시각 60% | 개념과 그림을 함께 설명 |
| `horizontal-flow` | 좌→우 흐름 | 원인, 입력, 처리, 결과 |
| `side-by-side` | 좌우 비교 | 두 개념의 차이 |
| `timeline` | 시간 또는 단계 축 | 순차 과정 |
| `grid` | 2×2 또는 3열 | 병렬 범주 |
| `full-visual` | 시각 자료 중심 | 복잡한 구조 또는 화면 |
| `screenshot-hotspot` | 이미지와 강조점 | 제품 사용 화면 설명 |

### 지원 Motion Preset

에이전트는 모션 이름만 선택한다. 시간, 거리, easing은 프런트엔드 토큰이 결정한다.

| Preset | 동작 | 사용 목적 |
|---|---|---|
| `fade` | 투명도 전환 | 장면 진입·종료 |
| `slide` | 수평 이동 | 이전·다음 방향 표현 |
| `step-reveal` | 요소를 순서대로 공개 | 설명 속도 제어 |
| `stagger` | 병렬 요소 순차 등장 | 범주 인식 |
| `morph` | 같은 개념의 상태 변화 | 오해→정확한 모델 |
| `zoom-focus` | 관심 영역 확대 | 화면·이미지 세부 설명 |
| `path-draw` | 선과 관계 순차 표시 | 흐름과 인과 |
| `highlight` | 색·외곽선·명도 강조 | 비교와 핵심 구분 |
| `feedback` | 선택 결과 표시 | 이해 확인 |

### 모션 토큰 권장값

```ts
export const motionTokens = {
  duration: {
    instant: 0.12,
    fast: 0.22,
    normal: 0.36,
    scene: 0.52,
  },
  distance: {
    small: 12,
    medium: 32,
    scene: 72,
  },
  easing: {
    enter: [0.22, 1, 0.36, 1],
    exit: [0.4, 0, 1, 1],
  },
  stagger: {
    tight: 0.06,
    normal: 0.1,
  },
} as const;
```

- 장면 전환은 600ms를 넘기지 않는다.
- 장식 요소의 반복 애니메이션은 사용하지 않는다.
- 학습자가 입력하면 현재 모션을 즉시 완료할 수 있어야 한다.
- `prefers-reduced-motion`에서는 이동·확대 대신 짧은 투명도 전환을 사용한다.
- 모션이 없어도 정보 구조와 의미가 동일해야 한다.

## 도메인 모델

```ts
type PublicationStatus = "draft" | "review" | "published" | "archived";

type SceneType =
  | "hook"
  | "mental-model"
  | "concept"
  | "process"
  | "comparison"
  | "example"
  | "screenshot"
  | "misconception"
  | "knowledge-check"
  | "summary"
  | "closing";

type SceneLayout =
  | "focus"
  | "visual-split"
  | "horizontal-flow"
  | "side-by-side"
  | "timeline"
  | "grid"
  | "full-visual"
  | "screenshot-hotspot";

type MotionPreset =
  | "fade"
  | "slide"
  | "step-reveal"
  | "stagger"
  | "morph"
  | "zoom-focus"
  | "path-draw"
  | "highlight"
  | "feedback";

interface CourseManifest {
  schemaVersion: string;
  courseId: string;
  title: string;
  description: string;
  audience: string[];
  status: PublicationStatus;
  version: number;
  lessonIds: string[];
  completionRule: {
    type: "all-lessons";
    requireKnowledgeChecks: boolean;
  };
  updatedAt: string;
}

interface LessonManifest {
  schemaVersion: string;
  courseId: string;
  lessonId: string;
  title: string;
  chapter: string;
  order: number;
  status: PublicationStatus;
  version: number;
  audience: string[];
  estimatedMinutes: number;
  prerequisites: string[];
  learningObjectives: string[];
}

interface SceneDefinition {
  sceneId: string;
  anchor: string;
  type: SceneType;
  layout: SceneLayout;
  motion: MotionPreset;
  reveal: "manual" | "on-enter";
  visual?: VisualDefinition;
}

interface LessonAst {
  manifest: LessonManifest;
  scenes: CompiledScene[];
  references: ReferenceItem[];
  diagnostics: Diagnostic[];
}

interface CompiledScene {
  id: string;
  title: string;
  type: SceneType;
  layout: SceneLayout;
  motion: MotionPreset;
  blocks: SemanticBlock[];
  revealSteps: RevealStep[];
}
```

### 의미 블록

```ts
type SemanticBlock =
  | { kind: "hook"; text: string }
  | { kind: "paragraph"; runs: InlineRun[] }
  | { kind: "bullets"; items: RichText[] }
  | { kind: "steps"; items: StepItem[] }
  | { kind: "comparison"; columns: ComparisonColumn[] }
  | { kind: "callout"; tone: "info" | "warning"; content: RichText[] }
  | { kind: "image"; src: string; alt: string; caption?: string }
  | { kind: "hotspots"; image: ImageRef; points: Hotspot[] }
  | { kind: "knowledgeCheck"; question: string; options: CheckOption[] }
  | { kind: "unsupported"; sourceType: string; fallbackText: string };
```

`LessonAst`는 화면 컴포넌트와 Confluence ADF 사이의 방화벽이다. Player는 ADF를 직접 해석하지 않고 검증이 끝난 `LessonAst`만 받는다.

## Lesson Compiler 설계

### 처리 단계

| 단계 | 입력 | 출력 | 실패 처리 |
|---|---|---|---|
| Fetch | Page ID | ADF, properties, version | 권한·네트워크 오류 화면 |
| Parse | ADF | Raw node tree | 알 수 없는 노드 보존 |
| Segment | Node tree | H2 기반 Scene 후보 | H2 없으면 단일 fallback |
| Normalize | Scene 후보 | Semantic blocks | 지원하지 않는 요소 진단 |
| Enrich | Properties | Scene type/layout/motion | 기본 preset 적용 |
| Validate | Lesson AST | 오류·경고 | 게시 오류와 표시 경고 분리 |
| Compile | Valid AST | Render model | 안전한 fallback 생성 |
| Cache | Render model | Versioned response | 버전 불일치 시 재조회 |

### 파서 원칙

- ADF 노드는 재귀적으로 순회하되 렌더러가 이해하는 의미 타입으로 즉시 정규화한다.
- 원본 위치를 `sourcePath`로 보존해 오류가 어느 블록에서 발생했는지 알려 준다.
- 빈 문단과 편집 과정에서 생긴 의미 없는 노드는 제거한다.
- 링크 URL, 이미지 URL, 텍스트는 별도의 sanitizer 정책을 적용한다.
- 스타일 Marks는 허용 목록만 처리한다.
- 같은 H2 Anchor와 Content Property의 `anchor`를 정규화해 연결한다.
- 연결되지 않은 Scene 속성은 오류로 기록한다.
- 속성이 없는 H2는 규칙 기반 기본 Scene으로 렌더링하되 게시 검증에서는 경고한다.

### 기본 추론 규칙

속성이 없을 때만 제한적으로 사용한다.

| 본문 특징 | 기본 Type | 기본 Layout |
|---|---|---|
| Blockquote로 시작 | `hook` | `focus` |
| Numbered list 중심 | `process` | `horizontal-flow` |
| 2열 또는 3열 표 | `comparison` | `side-by-side` |
| 이미지 중심 | `screenshot` | `full-visual` |
| Warning panel 포함 | `misconception` | `side-by-side` |
| 질문과 선택지 | `knowledge-check` | `focus` |
| 그 외 | `concept` | `visual-split` |

이 규칙은 초안 미리보기를 위한 것이며, 게시된 레슨은 명시적 Scene 속성을 갖는 것이 원칙이다.

### 검증 수준

| 수준 | 의미 | 동작 |
|---|---|---|
| Error | 학습 순서나 렌더링을 보장할 수 없음 | 게시 차단 |
| Warning | 렌더링 가능하지만 품질 기준 위반 | 게시 전 확인 |
| Info | 개선 권장 | 보고서에 기록 |

대표 Error:

- 중복 `courseId`, `lessonId`, `sceneId`
- Manifest가 참조하는 레슨 누락
- 지원하지 않는 필수 Enum
- Scene Anchor 누락
- 학습 목표 없음
- 빈 Scene
- 이미지 대체 텍스트 없음
- 출처가 필요한 자료의 출처 누락

대표 Warning:

- 콘텐츠 예산 초과
- Scene이 15개 초과
- 레슨 예상 시간이 15분 초과
- 전문 용어가 정의 전에 등장
- 비교 표가 5열 초과
- Reveal 단계가 6개 초과
- 시작 Hook 또는 마지막 확인 장면 누락

## Wiki Backend API

### 권장 Endpoint

```http
GET /api/lesson-courses
GET /api/lesson-courses/{courseId}
GET /api/lesson-courses/{courseId}/lessons/{lessonId}
GET /api/lesson-courses/{courseId}/lessons/{lessonId}/diagnostics
POST /api/lesson-preview/compile
```

### 과정 응답

```json
{
  "course": {
    "courseId": "ai-foundation",
    "title": "AI 기초교육",
    "version": 3
  },
  "lessons": [
    {
      "lessonId": "ai-foundation-04",
      "title": "컨텍스트와 기억의 한계",
      "order": 4,
      "estimatedMinutes": 8,
      "sceneCount": 9,
      "version": 2
    }
  ]
}
```

### 레슨 응답

```json
{
  "courseId": "ai-foundation",
  "lessonId": "ai-foundation-04",
  "version": 2,
  "compiledAt": "2026-07-30T11:00:00+09:00",
  "lesson": {
    "title": "컨텍스트와 기억의 한계",
    "objectives": ["컨텍스트의 의미를 설명한다"],
    "scenes": []
  },
  "navigation": {
    "previousLessonId": "ai-foundation-03",
    "nextLessonId": "ai-foundation-05"
  }
}
```

### API 원칙

- 브라우저가 Confluence Token을 직접 가지지 않는다.
- Backend가 사용자 또는 서비스 계정의 권한으로 Confluence를 조회한다.
- 응답에는 Confluence 저장 형식이 아니라 `LessonAst`만 포함한다.
- `ETag` 또는 `courseVersion:lessonVersion`을 캐시 키로 사용한다.
- 초안 진단 Endpoint는 편집 권한이 있는 사용자만 호출한다.
- 권한이 없는 페이지의 존재를 응답으로 노출하지 않는다.

## 캐시와 데이터 갱신

별도 영구 DB 없이 다음 계층을 사용할 수 있다.

| 계층 | 데이터 | 무효화 |
|---|---|---|
| Confluence | 원본과 버전 | 페이지 수정 |
| Backend memory/cache | Compiled Lesson AST | 페이지 버전 변경 |
| CDN/HTTP cache | Published API 응답 | ETag 변경 |
| Browser cache | 현재·인접 레슨 | 과정 버전 변경 |
| localStorage | 개인 진도 | 레슨 ID·Scene ID 기준 보정 |

초기 구현에서는 Backend 메모리 캐시만으로 시작할 수 있다. 여러 서버 인스턴스에서 캐시 일관성이 필요해질 때 공유 캐시를 추가하되, 콘텐츠의 원본은 계속 Confluence로 유지한다.

### 갱신 감지

- 과정 진입 시 Course Index의 버전을 확인한다.
- 현재 레슨의 Confluence 버전과 캐시 버전을 비교한다.
- 게시 에이전트가 Wiki 캐시 무효화 Endpoint를 호출할 수 있게 한다.
- 무효화 호출이 실패해도 짧은 TTL과 ETag로 최종 일관성을 확보한다.

## Frontend 구성

### 화면 영역

| 영역 | 기능 |
|---|---|
| Global Header | Wiki 브랜드, 과정명, 과정 지도 버튼 |
| Lesson Header | 현재 장·레슨 제목, 진행 상태 |
| Stage | 현재 Scene의 핵심 콘텐츠 |
| Scene Navigation | 이전, 다음, Scene 번호, Reveal 상태 |
| Course Map Drawer | 전체 레슨, 완료 상태, 현재 위치 |
| Reference Layer | 출처·상세 설명을 방해 없이 표시 |
| Accessibility Layer | Live region, focus target, skip action |

### 컴포넌트 구조

```text
LessonRoute
└── LessonDataBoundary
    ├── LessonLoading
    ├── LessonError
    └── LessonPlayer
        ├── PlayerHeader
        ├── SceneViewport
        │   └── SceneRenderer
        │       ├── HookScene
        │       ├── ConceptScene
        │       ├── ProcessScene
        │       ├── ComparisonScene
        │       ├── ScreenshotScene
        │       ├── KnowledgeCheckScene
        │       └── ClosingScene
        ├── PlayerControls
        ├── CourseMapDrawer
        ├── ReferencePanel
        └── PlayerAnnouncer
```

### 파일 구조 예시

```text
src/features/lesson-player/
├── api/
│   ├── lessonApi.ts
│   └── lessonQueries.ts
├── compiler/
│   ├── parseAdf.ts
│   ├── segmentScenes.ts
│   ├── normalizeBlocks.ts
│   ├── validateLesson.ts
│   └── compileLesson.ts
├── domain/
│   ├── lessonTypes.ts
│   ├── lessonSchemas.ts
│   └── diagnostics.ts
├── player/
│   ├── LessonPlayer.tsx
│   ├── playerReducer.ts
│   ├── navigationPolicy.ts
│   └── progressStore.ts
├── scenes/
│   ├── SceneRenderer.tsx
│   ├── HookScene.tsx
│   ├── ConceptScene.tsx
│   ├── ProcessScene.tsx
│   └── ...
├── motion/
│   ├── motionTokens.ts
│   ├── sceneVariants.ts
│   └── useReducedLessonMotion.ts
├── interactions/
│   ├── useWheelNavigation.ts
│   ├── useKeyboardNavigation.ts
│   └── useSwipeNavigation.ts
└── testing/
    ├── fixtures/
    └── builders/
```

기존 Wiki가 React가 아니라면 도메인 모델, Compiler, 상태 전이 계약은 유지하고 UI 계층만 현재 프레임워크에 맞춘다.

## Player 상태 모델

### 핵심 상태

```ts
interface PlayerState {
  status: "loading" | "ready" | "transitioning" | "error";
  courseId: string;
  lessonId: string;
  lessonIndex: number;
  sceneIndex: number;
  revealIndex: number;
  direction: "forward" | "backward";
  courseMapOpen: boolean;
  referenceOpen: boolean;
  reducedMotion: boolean;
}
```

### 이벤트

```ts
type PlayerEvent =
  | { type: "LOAD_SUCCESS"; lesson: LessonAst }
  | { type: "LOAD_FAILURE"; error: PlayerError }
  | { type: "NEXT" }
  | { type: "PREVIOUS" }
  | { type: "GOTO_SCENE"; sceneIndex: number }
  | { type: "GOTO_LESSON"; lessonId: string }
  | { type: "TRANSITION_END" }
  | { type: "OPEN_COURSE_MAP" }
  | { type: "CLOSE_COURSE_MAP" }
  | { type: "OPEN_REFERENCE"; referenceId: string }
  | { type: "CLOSE_REFERENCE" }
  | { type: "ANSWER_CHECK"; optionId: string };
```

### NEXT 정책

`NEXT`는 항상 다음 Scene으로 이동하는 명령이 아니다.

1. 현재 Scene에 공개되지 않은 Reveal 단계가 있으면 다음 단계를 공개한다.
2. Reveal이 끝났으면 다음 Scene으로 이동한다.
3. 마지막 Scene이면 현재 레슨을 완료 처리한다.
4. 다음 레슨이 있으면 레슨 전환 화면을 보여 준다.
5. 마지막 레슨이면 과정 완료 화면을 보여 준다.

### PREVIOUS 정책

1. 현재 Scene의 Reveal이 일부 진행됐다면 직전 Reveal 상태로 돌아간다.
2. 첫 Reveal 상태라면 이전 Scene의 완료 상태로 이동한다.
3. 첫 Scene이면 이전 레슨으로 이동할지 확인한다.
4. 사용자가 이미 답한 Knowledge Check 결과는 Scene 이동만으로 지우지 않는다.

### 전환 잠금

- Scene 전환 중 추가 `NEXT/PREVIOUS` 입력은 큐에 쌓지 않는다.
- 전환 종료 후 새로운 입력만 받는다.
- 빠른 연속 휠 입력은 하나의 의도로 합친다.
- `TRANSITION_END`가 누락되는 상황에 대비해 제한 시간 후 잠금을 해제한다.

## 입력과 탐색

### 키보드

| 입력 | 동작 |
|---|---|
| `ArrowRight`, `Space`, `PageDown` | 다음 Reveal 또는 Scene |
| `ArrowLeft`, `Shift+Space`, `PageUp` | 이전 Reveal 또는 Scene |
| `Home` | 현재 레슨 첫 Scene |
| `End` | 현재 레슨 마지막 Scene |
| `M` | Course Map 열기 |
| `Esc` | Drawer, Reference, Modal 닫기 |
| `Enter` | 현재 포커스 요소 선택 |

입력 필드나 버튼에 포커스가 있을 때 Space와 방향키를 강제로 가로채지 않는다.

### 마우스 휠과 트랙패드

- 세로 휠 입력을 좌우 Scene 탐색 의도로 해석할 수 있다.
- `deltaY`의 누적 절댓값이 임계치에 도달했을 때 한 번만 실행한다.
- 권장 초기 임계치: 일반 휠 `80`, 트랙패드 `120`.
- 실행 후 450ms 동안 같은 방향 입력을 잠근다.
- 반대 방향 입력은 누적값을 초기화한다.
- Drawer, Modal, Reference Panel 안에서는 Player 휠 탐색을 중지한다.
- OS 또는 브라우저 확대 제스처는 가로채지 않는다.
- 휠만으로 이용해야 하는 기능은 만들지 않는다.

### 터치

- 수평 이동 48px 이상이며 수직 편차가 제한 이내일 때 Swipe로 판정한다.
- 인터랙티브 도형 내부의 Pan과 Scene Swipe를 구분한다.
- 화면 가장자리 클릭 영역은 모바일에서 사용하지 않는다.
- Swipe 중 다음 Scene의 일부를 미리 보여 방향성을 전달할 수 있다.

### 클릭

- 하단의 이전·다음 버튼을 항상 제공한다.
- Stage의 빈 좌우 영역 클릭 이동은 보조 기능으로만 제공한다.
- 텍스트, 링크, 선택지, Hotspot 위에서는 Stage 클릭 이동을 막는다.

## 화면 레이아웃

### 데스크톱 기준

- Header: 56~64px
- Lesson context bar: 44~52px
- Stage: 남은 높이에서 Controls 영역을 제외한 전체
- Controls: 64~80px
- 본문 최대 폭: 1440px
- 안전 여백: 좌우 최소 48px
- 기본 제목: `clamp(36px, 3.2vw, 64px)`
- 본문: `clamp(19px, 1.35vw, 26px)`
- 보조 텍스트: 최소 16px

### 큰 모니터

- 콘텐츠 폭만 무한히 늘리지 않는다.
- 도형과 텍스트 크기를 함께 확장한다.
- 중앙 Stage는 시각적 중심을 유지한다.
- 좌우 빈 공간은 방향 표시와 Course Map 진입에 활용하되 장식을 과도하게 배치하지 않는다.

### 태블릿

- `visual-split` 비율을 45:55로 조정한다.
- Course Map은 Overlay Drawer로 표시한다.
- 복잡한 3열 Grid는 2열로 변경하되 세로 스크롤은 만들지 않고 Reveal 단계로 나눈다.

### 모바일

- 모바일에서도 Scene 단위 좌우 이동 원칙을 유지한다.
- 두 영역을 동시에 보여 주기 어려우면 Reveal을 통해 텍스트와 시각 자료를 순차 표시한다.
- 본문을 축소해 한 화면에 밀어 넣지 않는다.
- 하단 Controls는 Safe Area를 반영한다.
- 과정 전체 탐색은 Full-screen Sheet로 제공한다.

## 시각 시스템

### 기본 원칙

- 한 Scene의 시각적 주인공은 하나다.
- 도형은 관계, 순서, 범위, 차이를 설명할 때 사용한다.
- 의미 없는 장식 카드의 반복을 피한다.
- 그림자, 그라데이션, 유리 효과는 정보 계층을 해치지 않는 범위에서만 사용한다.
- 강조 색은 상태와 의미를 일관되게 표현한다.
- 동일 개념은 과정 전체에서 동일한 형태와 색으로 유지한다.

### 의미 색상 예시

| 의미 | 토큰 |
|---|---|
| 현재 입력·사용자 요청 | `--lesson-accent-current` |
| AI 모델·처리 | `--lesson-accent-model` |
| 컨텍스트·참고 정보 | `--lesson-accent-context` |
| 누락·한계·주의 | `--lesson-accent-warning` |
| 올바른 연결·완료 | `--lesson-accent-success` |
| 비활성·지난 정보 | `--lesson-muted` |

색만으로 상태를 전달하지 않고 라벨, 아이콘, 선 모양을 함께 사용한다.

### 이미지 처리

- 원본 크기와 비율을 보존한다.
- 핵심 영역이 작은 스크린샷은 Hotspot과 확대 View를 제공한다.
- 이미지 안에 긴 설명 문장을 넣지 않는다.
- 이미지가 로드되지 않아도 대체 텍스트와 핵심 설명이 남아야 한다.
- 에이전트가 생성한 이미지는 생성 사실, 용도, 검토 상태를 메타데이터로 남긴다.

## 인터랙티브 컴포넌트

### Context Window

사용자가 AI에 전달되는 정보의 한계를 이해하도록 다음 상태를 표현한다.

- 지침, 이전 대화, 파일, 새 요청이 하나의 제한된 영역에 들어간다.
- 새 정보가 들어오면 오래된 정보의 명도 또는 위치가 변한다.
- Overflow가 발생하면 사라지는 정보와 남는 정보를 시각적으로 구분한다.
- Hover 시 각 정보가 답변에 어떤 영향을 주는지 짧게 표시한다.

### Process Flow

- 단계는 한 번에 모두 등장하지 않고 설명 순서대로 Reveal한다.
- 현재 단계만 강조하고 앞 단계는 맥락으로 유지한다.
- 선의 움직임은 정보 이동 방향을 설명할 때만 사용한다.

### Comparison

- 공통 비교 축을 고정한다.
- 좌우 항목의 문장 구조를 맞춘다.
- Hover 또는 키보드 포커스로 같은 행을 동시에 강조한다.
- 단순 표가 더 명확하면 화려한 Slider를 사용하지 않는다.

### Screenshot Hotspot

- Hotspot은 숫자 또는 짧은 라벨을 가진다.
- 선택 시 확대 영역과 설명을 같은 Scene 안에서 교체한다.
- 확대 때문에 전체 위치를 잃지 않도록 Mini-map 또는 원본 윤곽을 유지한다.
- 모든 Hotspot은 키보드로 이동할 수 있어야 한다.

### Knowledge Check

- 한 Scene에는 하나의 판단만 묻는다.
- 선택 직후 정답 여부보다 이유를 먼저 보여 준다.
- 틀린 선택지가 왜 그럴듯한지 설명한다.
- 정답을 맞혀야만 다음으로 이동하게 만들지는 않는다.
- 필수 확인 여부는 Course Manifest가 결정한다.

## 접근성

- Player 전체를 키보드로 사용할 수 있어야 한다.
- Scene 전환 후 제목으로 포커스를 옮기고 Screen Reader에 현재 위치를 알린다.
- 자동으로 계속 넘어가는 Carousel 동작은 사용하지 않는다.
- 자동 Reveal이 있다면 사용자가 일시정지하거나 즉시 완료할 수 있어야 한다.
- `prefers-reduced-motion`을 존중한다.
- 텍스트와 배경 대비는 WCAG 2.2 AA 기준을 목표로 한다.
- 버튼은 아이콘만 사용하지 않고 접근 가능한 이름을 제공한다.
- 진행 점은 시각적 점만 나열하지 않고 `4 / 12` 같은 텍스트를 함께 제공한다.
- Drawer가 열리면 포커스를 내부에 가두고 닫은 뒤 원래 버튼으로 돌려보낸다.
- Scene 전환 애니메이션 중 DOM에서 중요한 내용을 조기에 제거하지 않는다.
- 대체 텍스트는 이미지의 생김새보다 학습상 역할을 설명한다.

## 진도 저장

### localStorage 키

```text
lesson-progress:{courseId}:{userScope}
```

### 저장 데이터

```json
{
  "courseVersion": 3,
  "updatedAt": "2026-07-30T11:10:00+09:00",
  "lessons": {
    "ai-foundation-04": {
      "lessonVersion": 2,
      "lastSceneId": "context-definition",
      "completedSceneIds": ["memory-question"],
      "knowledgeChecks": {
        "check-context-01": {
          "selectedOptionId": "b",
          "answeredAt": "2026-07-30T11:08:00+09:00"
        }
      },
      "completed": false
    }
  }
}
```

### 버전 변경 처리

- `sceneIndex`가 아니라 안정적인 `sceneId`를 저장한다.
- 저장된 Scene이 삭제되면 이전에 완료한 가장 가까운 Scene으로 이동한다.
- 레슨의 학습 목표가 크게 바뀌면 에이전트가 `progressReset: true`를 명시할 수 있다.
- 단순 오탈자나 시각 수정은 완료 상태를 유지한다.
- 여러 기기 동기화가 필요해질 때만 사용자 진도 Backend를 별도 범위로 설계한다.

## 오류와 Fallback

| 상황 | 사용자 화면 | 운영 진단 |
|---|---|---|
| Confluence 권한 없음 | 접근 불가 안내 | Page ID와 권한 코드 |
| 페이지 없음 | 과정 지도 복귀 | Manifest 불일치 |
| 속성 없음 | 기본 문서형 Scene | Property missing |
| 지원하지 않는 블록 | 안전한 텍스트 Fallback | Source path |
| 이미지 실패 | 대체 텍스트와 재시도 | Media URL |
| 다음 레슨 누락 | 과정 지도 표시 | Broken lesson link |
| 컴파일 실패 | 마지막 정상 캐시 또는 오류 화면 | Compiler stage |
| 네트워크 단절 | 현재 레슨 유지 | Retry state |

Fallback 화면도 세로로 원문 전체를 무조건 노출하지 않는다. 편집자에게는 Confluence 원문 링크를 제공하고, 학습자에게는 이용 가능한 이전·다음 위치를 제공한다.

## 보안

- Confluence 인증 정보는 Server Side에만 둔다.
- ADF에서 임의 HTML을 렌더링하지 않는다.
- 텍스트, 링크, 미디어 URL은 허용 정책으로 검증한다.
- 외부 링크는 프로토콜과 도메인을 검증한다.
- 임베드 콘텐츠는 명시된 제공자만 허용한다.
- 에이전트가 생성한 JSON도 신뢰하지 않고 Runtime Schema로 검증한다.
- 오류 응답에 Token, 내부 URL, 권한 상세를 노출하지 않는다.
- 초안과 진단 API는 편집 권한을 확인한다.
- Confluence 권한보다 넓은 Wiki 접근 권한을 만들지 않는다.

## 성능

### 목표 예산

| 항목 | 목표 |
|---|---:|
| 첫 Scene 콘텐츠 표시 | 정상 네트워크에서 2.5초 이내 |
| Scene 전환 입력 반응 | 100ms 이내 |
| 다음 Scene 준비 | 현재 Scene 표시 중 완료 |
| 레이아웃 이동 | 최소화 |
| 한 레슨 초기 이미지 | 현재 Scene 중심 |

### 전략

- 과정 Index를 먼저 가져오고 현재 레슨만 우선 컴파일한다.
- 다음·이전 레슨의 메타데이터를 Prefetch한다.
- 현재 Scene 주변 이미지 두 장까지만 우선 로드한다.
- 큰 이미지는 적절한 크기로 변환해 제공한다.
- Scene 컴포넌트는 필요 시 Lazy Load한다.
- Motion 요소 수를 제한한다.
- Compile 결과는 Page Version 단위로 캐시한다.
- Course Map 전체를 열기 전에는 상세 본문을 가져오지 않는다.

## 콘텐츠 관리 에이전트 연동

### 에이전트의 책임

- 빈 `Lesson` 영역에서 기초교육의 최종 학습 상태를 정의한다.
- 최종 상태에 필요한 선수 개념을 역으로 분해한다.
- A부터 Z까지 하나의 학습 서사로 Course Manifest를 만든다.
- 레슨별 학습 목표, 시작 오해, 핵심 모델, 확인 기준을 먼저 작성한다.
- Confluence 본문과 Presentation Property를 함께 생성한다.
- Wiki 검색에서 성장한 내용을 교육 가치에 따라 평가한다.
- 기존 레슨을 망가뜨리지 않고 수정 후보를 만든다.
- Compiler 검증 결과를 해결한 뒤 `review` 상태로 전환한다.

### 신규 Wiki 내용 분류

| 분류 | 조건 | 처리 |
|---|---|---|
| 기초 필수 | 이후 여러 레슨의 이해에 필요 | 정규 커리큘럼 반영 검토 |
| 기존 레슨 강화 | 현재 개념을 더 쉽게 설명 | 예시·시각 자료 개선 후보 |
| 심화 | 특정 도구·기술에 한정 | Reference 또는 심화 과정 |
| 최신 사례 | 개념의 좋은 실제 사례 | 안정성과 수명 검토 후 예시 |
| 중복 | 기존 내용과 학습 효과 동일 | 통합, 새 레슨 생성 금지 |
| 부적합 | 홍보성·검증 부족·기초 목표 무관 | 교육 과정 제외 |

### 콘텐츠 변경 판단

에이전트는 새 정보마다 다음을 확인한다.

- 이 정보가 기초교육의 최종 학습 상태에 필요한가?
- 기존 학습 순서를 바꿀 만큼 선수 관계가 있는가?
- 기존 설명보다 더 쉽고 정확한가?
- 사례가 없어져도 핵심 개념은 유지되는가?
- 추가하면 한 Scene에 두 개의 핵심 주장이 생기지 않는가?
- 신규 레슨보다 기존 레슨 수정이 더 적절하지 않은가?
- 초보자에게 새 용어 부담을 만들지 않는가?

하나라도 불분명하면 자동 게시하지 않고 개선 후보로 남긴다.

### 작성 실행 순서

1. Course 목표와 현재 Manifest를 읽는다.
2. 전체 레슨의 학습 목표와 선수 관계를 읽는다.
3. Wiki의 신규·변경 내용을 수집한다.
4. 기초 필수성, 정확성, 안정성, 중복성을 평가한다.
5. 변경 대상 레슨과 학습 영향 범위를 결정한다.
6. Scene 단위 수정안을 작성한다.
7. 본문과 `lesson.presentation`을 함께 갱신한다.
8. Lesson Compiler Preview를 실행한다.
9. Error를 모두 해결하고 Warning을 검토한다.
10. 시각 Preview와 이해 가능성 검토를 수행한다.
11. `review` 상태로 저장한다.
12. 승인 후 `published`와 버전을 갱신한다.
13. Wiki 캐시를 무효화한다.

### 자동 게시 제한

다음 변경은 사람의 승인을 필수로 한다.

- 레슨 추가·삭제·순서 변경
- 학습 목표 변경
- 기존 Scene ID 삭제
- Knowledge Check 정답 변경
- 기초 개념의 정의 변경
- 외부 출처가 필요한 주장 추가
- 생성 이미지의 핵심 설명 사용
- 진행 상태 Reset

오탈자, 링크 수정, 대체 텍스트 보완 같은 낮은 위험 변경은 정책에 따라 자동 게시할 수 있다.

## 미리보기와 편집자 도구

에이전트가 만든 Confluence 페이지를 게시 전에 실제 Player와 동일하게 확인해야 한다.

### Preview 화면

- 왼쪽: Confluence Page 및 Scene 목록
- 중앙: 실제 Lesson Player
- 오른쪽: 속성, 콘텐츠 예산, 진단
- 상단: Desktop, Large Monitor, Tablet, Mobile Viewport 전환
- 하단: 키보드·휠·Reduced Motion 테스트

### 진단 항목

- Anchor 연결 상태
- Scene Type/Layout/Motion 유효성
- 글자 수와 예상 줄 수
- 이미지 비율과 대체 텍스트
- Reveal 순서
- 색상 대비
- 키보드 이동
- 레슨 간 이전·다음 연결
- Course Manifest 포함 여부
- 출처와 수정 버전

## 테스트 전략

비즈니스 규칙은 UI보다 먼저 순수 함수와 Reducer로 구현하고 테스트한다.

### 단위 테스트

- ADF 노드별 Semantic Block 변환
- H2 Scene 분할
- Anchor 정규화
- Content Property 스키마 검증
- 기본 Scene 추론
- 콘텐츠 예산 계산
- Course Manifest 정렬
- NEXT/PREVIOUS Reveal 정책
- 버전 변경 시 진도 복구
- Reduced Motion 변환

### Contract 테스트

- 실제 Confluence ADF Fixture를 저장해 파서 회귀 테스트
- Confluence API 응답과 내부 모델의 경계 테스트
- 알 수 없는 ADF 노드가 들어와도 정보가 유실되지 않는지 확인
- Property Schema 버전별 Migration 테스트

### 컴포넌트 테스트

- 각 Scene Type이 의미 블록을 올바르게 표시
- 키보드 포커스 순서
- Knowledge Check 피드백
- Course Map 열기·닫기
- Reference Panel과 Player 입력 충돌 방지
- 긴 제목과 제한 경계

### E2E 테스트

- Course Index 진입 → 레슨 완료 → 다음 레슨 이동
- 휠로 Reveal → Scene 이동
- 방향키만으로 과정 이동
- 새로고침 후 위치 복구
- 레슨 버전 변경 후 Scene ID 복구
- Confluence 권한 오류
- 이미지 로딩 실패
- Reduced Motion 환경
- 모바일 Swipe

### 시각 회귀 테스트

최소 Viewport:

- 1440×900
- 1920×1080
- 2560×1440
- 1024×768
- 768×1024
- 390×844

대표 Scene Type마다 Screenshot 기준 이미지를 관리한다. 글자가 잘리거나 내부 Scroll이 생기거나 Controls와 겹치면 실패로 처리한다.

### 접근성 테스트

- 자동 검사 도구와 수동 키보드 테스트를 함께 수행한다.
- Screen Reader로 Scene 제목과 진행 위치가 읽히는지 확인한다.
- Focus Trap과 Focus Restore를 확인한다.
- 200% 확대에서도 핵심 기능을 사용할 수 있어야 한다.
- 색상을 제거해도 비교와 상태가 구분되어야 한다.

## CI 품질 게이트

Merge 전 필수:

- Type Check 통과
- Unit/Contract Test 통과
- Player Reducer 분기 테스트 통과
- 주요 E2E 통과
- 접근성 자동 검사 통과
- Bundle Size 예산 확인
- Scene Schema 호환성 확인
- 시각 회귀 승인

콘텐츠 게시 전 필수:

- Compiler Error 0개
- 미해결 Warning 승인 기록
- 모든 이미지 Alt 존재
- Course Manifest 연결 정상
- 이전·다음 레슨 정상
- Desktop과 Mobile Preview 확인
- 학습 목표와 Knowledge Check 연결 확인

## 관측성과 운영 로그

개인 학습 행동을 과도하게 수집하지 않고 시스템 품질에 필요한 이벤트만 정의한다.

| 이벤트 | 목적 |
|---|---|
| `lesson_load_success` | 로드 성능과 버전 확인 |
| `lesson_load_failure` | 권한·API·Compiler 문제 |
| `scene_view` | 진행 흐름 확인 |
| `scene_navigation_blocked` | 전환 잠금 문제 |
| `unsupported_block_rendered` | 작성 규격 개선 |
| `content_overflow_detected` | 콘텐츠 예산 보완 |
| `asset_load_failure` | 이미지 품질 |
| `progress_recovered` | 버전 변경 복구 |

로그에는 원문 전체, 사용자의 답변 내용, Confluence Token을 넣지 않는다.

## 구현 단계

### 기반 계약

산출물:

- Course/Lesson/Scene TypeScript 모델
- Runtime Schema
- Content Property 예시
- ADF Fixture
- Compiler Error/Warning 규격
- 레슨 작성 템플릿

완료 조건:

- 샘플 Confluence 레슨 하나가 안정적인 `LessonAst`로 변환된다.
- 잘못된 속성이 명확한 진단으로 반환된다.

### 정적 Player

산출물:

- Player Shell
- Header, Stage, Controls, Course Map
- 핵심 Layout
- Hook, Concept, Process, Comparison, Summary Scene

완료 조건:

- 샘플 시안 수준의 화면을 1920×1080과 1440×900에서 재현한다.
- 세로 스크롤 없이 모든 샘플 Scene이 표시된다.

### 탐색과 상태

산출물:

- Player Reducer
- Reveal 정책
- 키보드·휠·Swipe
- URL Deep Link
- localStorage 진도

완료 조건:

- 모든 입력 방식이 동일한 상태 전이 규칙을 사용한다.
- 새로고침 후 Scene 위치가 복구된다.

### 모션과 인터랙션

산출물:

- Motion Token
- Scene transition
- Reveal preset
- Context Window, Process Flow, Hotspot, Knowledge Check
- Reduced Motion

완료 조건:

- 모션 제거 후에도 의미가 유지된다.
- 빠른 연속 입력으로 Scene이 건너뛰어지지 않는다.

### Confluence 실연동

산출물:

- Backend Confluence Client
- Page/Property 조회
- Course Manifest 탐색
- Version Cache
- 권한·오류 Fallback

완료 조건:

- `Lesson → AI 기초교육 Index → Lesson Page` 계층을 실제로 로드한다.
- 페이지 버전 변경 시 새 콘텐츠가 반영된다.

### 에이전트 연동

산출물:

- 작성 Prompt/Policy
- 레슨 템플릿 생성
- Content Property 생성
- Preview Compile 호출
- Review 상태 전환

완료 조건:

- 빈 과정에서 Index와 첫 레슨 초안을 생성한다.
- Compiler Error가 있는 페이지를 게시하지 않는다.

### 운영 준비

산출물:

- 접근성 점검
- 시각 회귀
- 성능 측정
- 게시·Rollback 절차
- 편집자 가이드

완료 조건:

- 대표 기초교육 레슨 한 묶음을 실제 사용자 흐름으로 완료할 수 있다.
- 이전 Confluence 페이지 버전으로 복구할 수 있다.

## 우선 개발 범위

### MVP에 포함

- 한 개 과정
- Course Index와 Lesson Manifest
- H2 기반 Scene Compiler
- 다섯 가지 핵심 Scene Type
- 네 가지 핵심 Layout
- Fade, Slide, Step Reveal, Highlight
- 키보드, 버튼, 휠 탐색
- Course Map
- localStorage 진도
- Desktop/Tablet/Mobile 기본 대응
- Preview 진단

### 후속 범위

- Screenshot Hotspot 편집 도구
- 고급 Morph와 Path Draw
- 사용자별 서버 진도 동기화
- 수료와 조직별 대시보드
- 다국어 과정
- 에이전트 자동 이미지 제작 Pipeline
- A/B 설명 품질 비교
- 학습 분석 기반 레슨 개선

## 완료 인수 기준

### 콘텐츠

- 과정의 최종 학습 상태가 명시되어 있다.
- 모든 레슨이 전체 과정에서 맡은 인지 변화를 가진다.
- 모든 레슨에 선수 관계와 다음 연결이 있다.
- 모든 Scene은 하나의 핵심 주장만 가진다.
- 강사의 추가 설명 없이 초보자가 따라갈 수 있다.
- 최신 자료 추가가 기초 과정의 목표와 순서를 훼손하지 않는다.

### 기술

- Confluence 외 별도 콘텐츠 DB 없이 동작한다.
- Confluence 페이지와 Content Property를 읽어 `LessonAst`를 만든다.
- Player가 ADF나 임의 HTML을 직접 렌더링하지 않는다.
- 모든 이동 입력이 동일한 Reducer를 사용한다.
- Scene 간 좌우 이동과 단계별 Reveal이 안정적으로 동작한다.
- 페이지 수정 후 Version 기반으로 캐시가 갱신된다.
- 실패 시 전체 Wiki가 아닌 해당 레슨 범위에서 복구된다.

### 화면

- 기본 화면에 세로 스크롤이 없다.
- 현재 과정, 레슨, Scene 위치가 한눈에 보인다.
- 제목과 본문이 큰 화면에서 충분히 크다.
- 다음 행동이 항상 명확하다.
- 모션이 설명 순서를 돕는다.
- 콘텐츠 초과 시 글자가 축소되지 않는다.

### 접근성

- 키보드만으로 과정 완료가 가능하다.
- 모션 축소 설정에서 불필요한 이동이 제거된다.
- 진행 상태와 Scene 전환이 Screen Reader에 전달된다.
- 이미지와 Hotspot에 대체 설명이 있다.
- 자동 진행 때문에 읽을 시간이 제한되지 않는다.

## 주요 위험과 대응

| 위험 | 영향 | 대응 |
|---|---|---|
| 자유 형식 Confluence 문서 | 화면 품질 불안정 | 작성 계약, Compiler, 게시 검증 |
| 에이전트의 무분별한 추가 | 커리큘럼 붕괴 | Manifest 포함 승인, 기초 필수성 평가 |
| 한 Scene의 정보 과다 | 글자 축소·이해 저하 | 콘텐츠 예산, 자동 진단, Scene 분리 |
| 모션 과다 | 피로·접근성 저하 | Preset 제한, Reduced Motion |
| Page ID·Anchor 변경 | 진도와 링크 손상 | 안정적인 Course/Lesson/Scene ID |
| Confluence API 지연 | 첫 화면 지연 | Version Cache, Prefetch |
| 권한 불일치 | 정보 노출 또는 접근 실패 | Backend 권한 검사, 오류 정보 최소화 |
| 스키마 변경 | 기존 레슨 파손 | `schemaVersion`, Migration, Fixture 테스트 |
| 화면별 Overflow | 콘텐츠 잘림 | Viewport 회귀 테스트, 하드 제한 |
| 생성 이미지 오류 | 오개념 형성 | 사람 검토, 출처·생성 상태 기록 |

## 개발 시작 전 확정할 항목

- 현재 Wiki Frontend 프레임워크와 라우팅 구조
- Confluence 페이지를 조회하는 기존 Backend 위치
- `Lesson` Root의 Page ID
- 사용자 인증이 Confluence 권한과 연결되는 방식
- 현재 사용하는 `wiki.metadata`의 기존 스키마
- 이미지가 제공되는 방식과 허용 도메인
- 에이전트가 Confluence 페이지와 Content Property를 쓰는 권한
- 초안 승인 주체와 게시 Workflow
- 모바일을 MVP 필수로 볼지 여부
- 진도 데이터를 브라우저 단위로만 유지해도 되는 기간

이 항목들은 설계의 방향을 바꾸기보다 실제 인터페이스와 구현 위치를 결정한다. 확정 전에도 Domain Model, Compiler 규격, Player Reducer는 개발할 수 있다.

## 권장 첫 번째 구현 Slice

기능을 가로로 완성하는 첫 Slice는 다음 하나로 제한한다.

`Confluence의 컨텍스트 레슨 1개 → H2 Scene 5개 → Compiler → Lesson AST → 좌우 Player → 키보드·휠 → 진도 복구`

이 Slice에서 반드시 포함할 Scene:

- 질문형 Hook
- Context Window Mental Model
- Overflow Process
- 오해와 실제 Comparison
- Knowledge Check

이 Slice가 실제 Confluence 데이터로 완성되면 이후 Scene Type과 에이전트 기능은 같은 계약 위에 확장한다.

## 참고한 공식 기술 기준

- Atlassian Confluence Cloud REST API v2: <https://developer.atlassian.com/cloud/confluence/rest/>
- Confluence Page API: <https://developer.atlassian.com/cloud/confluence/rest/v2/api-group-page/>
- Atlassian Document Format 구조: <https://developer.atlassian.com/cloud/jira/platform/apis/document/structure/>
- Confluence Content Properties 개념: <https://developer.atlassian.com/cloud/confluence/rest/v1/intro/>
- Motion for React AnimatePresence: <https://motion.dev/docs/react-animate-presence>
- Motion for React Layout Animations: <https://motion.dev/docs/react-layout-animations>
- Motion for React Transitions: <https://motion.dev/docs/react-transitions>
- Motion for React useAnimate: <https://motion.dev/docs/react-use-animate>
- Motion for React Gestures: <https://motion.dev/docs/react-gestures>
- WAI Carousel Tutorial: <https://www.w3.org/WAI/tutorials/carousels/>
- WAI-ARIA Carousel Pattern: <https://www.w3.org/WAI/ARIA/apg/patterns/carousel/>
- WCAG 2.2: <https://www.w3.org/TR/WCAG22/>
