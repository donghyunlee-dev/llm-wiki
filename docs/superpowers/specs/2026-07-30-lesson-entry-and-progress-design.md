# Lesson 진입점, docType 격리, 학습 진도 — 설계

> 문서 상태: 승인 대기
> 관련 참고 문서: AI 기초교육 Lesson Player 개발 설계 계획서(대화 중 전달, 파일 미보관), `docs/prd/architecture.md`, `docs/prd/confluence-metadata.md`, `CLAUDE.md`(Frozen Behaviors — Surface별 docType 노출 규칙)

## 1. 문제와 목적

Wiki 메인 화면에는 아직 AI 기초교육(Lesson) 영역으로 들어가는 진입 경로가 없다. Confluence 콘텐츠 관리 측에서 `docType: "lesson"`을 새로 도입할 예정이며, 이 문서는 다음을 정의한다.

- 홈 화면 하단에서 Lesson 영역으로 진입하는 UI
- `docType: "lesson"`을 기존 검색·가이드·페이지·라이브러리 노출 체계에서 완전히 격리하는 방법
- 로그인 계정이 없는 환경에서 `localStorage` 기반으로 학습 진도를 저장하고 "이어서 학습하기"를 제공하는 방법
- Lesson 문서를 세로 스크롤이 아닌 좌우 전환형 "장면(Scene)" 단위로 읽고, 장면마다 숨겨진 강사 대본을 버튼으로 볼 수 있는 리더 화면

## 2. 범위

### 포함
- `docType: "lesson"` 스키마 등록(`confluence-metadata.md`, `WikiDocument` 타입, `CLAUDE.md` Frozen 표) 및 snapshot 픽스처
- 홈 하단 Lesson 진입 섹션(카드 1개)
- `/lesson` 인덱스 페이지(레슨 목록, 이어서 학습하기/학습 시작하기)
- `/lesson/:slug` 리더 페이지(H2 기준 장면 분리, 좌우 이동, 장면별 대본 토글)
- Confluence Expand 매크로 → 장면별 "숨겨진 대본" 변환 로직
- `localStorage` 진도 저장/복구
- 검색·가이드·페이지·라이브러리에 영향 없음을 증명하는 회귀 테스트
- Playwright 및 Codex 크리티컬 리뷰

### 제외 (후속 단계)
- ADF 기반 Lesson Compiler, `LessonAst`, `lesson.presentation`/`lesson.course` Content Property 스키마
- Motion Preset 시스템(자유로운 애니메이션), 마우스 휠/스와이프 탐색
- Knowledge Check, Context Window 등 인터랙티브 컴포넌트
- Confluence 실연동(현재는 `snapshot` 픽스처로 개발, 이후 세션에서 실제 페이지 연동)
- 다중 Course 관리(Course Manifest) — 이번 스코프는 단일 고정 course(`ai-foundation`)만 다룸

## 3. docType 격리

### 3.1 스키마
`docs/prd/confluence-metadata.md`의 `docType` 허용값 표에 아래 행을 추가한다.

| 값 | 의미 | 앱 카테고리 |
| --- | --- | --- |
| `lesson` | AI 기초교육 등 좌우 전환형 학습 콘텐츠 | (비노출 — `/lesson` 전용) |

"공개 노출 조건" 절의 "앱 카테고리가 guides/library/faq 중 하나일 것" 규칙은 그대로 유지한다 — `lesson`은 이 셋 중 어디에도 속하지 않으므로 규칙을 바꾸지 않고도 자동으로 제외된다.

### 3.2 코드
- `packages/wiki-core/src/lib/wikiDocuments.ts`의 `WikiDocument.metadata.docType` 유니온에 `"lesson"` 추가.
- `getWikiDocumentSection()`은 `lesson`에 대해 분기를 추가하지 않는다 — 기존 else 경로가 `null`을 반환해 `guides`/`faq`/`library` 그룹과 `getWikiDocumentHref()`에서 자동 제외된다.
- `rankSearchDocumentsIn()`의 명시적 제외 필터(`ops`/`policy`/`playbook`)에 `lesson`을 추가해 의도를 명시한다(현재도 section이 없어 결과에 나타나지 않지만, 향후 스코어링 로직이 section 매핑과 분리될 경우를 대비해 명시적으로 방어).
- `buildFeaturedGuides()`(홈 추천 가이드), `CategoryPage`의 guides 필터, `isIndexWikiDocument()` 등 기존 docType 비교 로직은 전부 `=== "guide"` 또는 `=== "nav"` 같은 명시적 비교라 `lesson` 문서가 끼어들 여지가 없다 — 코드 수정 없이 안전.

### 3.3 CLAUDE.md Frozen Behavior 갱신
"Surface별 docType 노출 규칙" 표에 아래 행을 추가한다(사용자 승인 완료).

| Surface | lesson |
|---|---|
| 홈 추천 가이드 | ❌ |
| `/guides` 목록 | ❌ |
| 검색 답변 내 추천/관련 페이지 | ❌ |
| 답변 본문 내 인라인 링크 | ❌ |
| 홈 하단 Lesson 진입 카드(신규) | ✅ (진입 카드 자체만, 개별 레슨 문서 링크 아님) |
| `/lesson`, `/lesson/:slug`(신규) | ✅ |

### 3.4 순서
Course 내 레슨 순서는 별도 `order` 필드를 추가하지 않고 기존 `metadata.next` 체인을 재사용한다. 픽스처의 첫 레슨부터 `next`를 따라가며 순서를 만들고, 체인이 끊기면(다음 레슨 없음) 그 지점에서 목록을 종료한다.

## 4. 대본(스크립트)

- Confluence 저자는 각 H2 장면 안에 Confluence "펼치기(Expand)" 매크로로 대본을 작성한다. 이번 스코프에서 실제 대본 콘텐츠는 만들지 않고, 파싱·바인딩 메커니즘만 구현한다.
- `packages/wiki-core/src/lib/confluenceCleanHtml.ts`에 Expand 매크로(`ac:structured-macro[ac:name="expand"]`) 변환을 추가한다. 일반 문서(guide/page 등)에서는 현재 동작(무변환 통과 또는 텍스트 그대로 노출)을 유지하기 위해, 이 변환은 렌더링 시점이 아니라 **레슨 장면 분리 단계에서만** 적용한다(즉 cleanHtml 자체에 전역 Expand 규칙을 추가하지 않고, 레슨 전용 파서가 H2 섹션의 raw HTML에서 Expand 블록을 추출).
- 추출된 대본 블록은 장면 데이터의 `scriptHtml` 필드로 분리되고, 본문(`bodyHtml`)에서는 제거된다.
- 리더 화면은 장면마다 "대본 보기" 토글 버튼을 렌더링하고, 클릭 시 `scriptHtml`을 노출/숨김 처리한다. 대본이 없는 장면은 버튼을 렌더링하지 않는다.

## 5. 홈 화면 진입 섹션

- `HomePage.tsx`에 `RecommendedGuidesSection` 아래(최하단) 새 섹션 컴포넌트를 추가한다.
- 톤: 기존 `home-card`/`home-guides-card`와 동일한 시맨틱 토큰 기반 카드 스타일(하드코딩 색상 금지, `@sfood/ui` 토큰 우선).
- 카드 문구(초안, 최종안은 구현 전 확인):
  - 제목: "AI, 이제 기초부터 이해해 보세요"
  - 설명: "실습 전에 알아야 할 개념을 짧은 장면으로 정리했습니다."
  - 버튼: "교육 시작하기"
- 클릭 시 `/lesson`으로 이동.
- Lesson 문서가 하나도 없을 때(픽스처가 비었을 때)는 섹션 자체를 렌더링하지 않는다(기존 `RecommendedGuidesSection`의 로딩/빈 상태 처리 패턴과 동일).

## 6. 라우팅과 화면

### 6.1 `/lesson` (인덱스)
- `docType: "lesson"` 문서를 `next` 체인 순서로 나열.
- `localStorage`에 진행 중인 진도가 있으면 "이어서 학습하기"(마지막 레슨/장면으로 이동) 버튼을, 없으면 "학습 시작하기"(첫 레슨 첫 장면) 버튼을 노출.
- 완료한 레슨은 목록에서 완료 표시(체크 아이콘 등, 색상 아닌 아이콘+텍스트로 구분 — 접근성 원칙 준수).

### 6.2 `/lesson/:slug` (리더)
- 문서 `contentHtml`을 H2 기준으로 장면(Scene) 목록으로 분리하는 순수 함수 추가(`packages/wiki-core`에 위치, UI와 독립적으로 단위 테스트 가능).
- 각 장면은 `{ id, title, bodyHtml, scriptHtml? }` 형태.
- 화면 구성: 상단에 레슨 제목/장면 위치(`2 / 5` 텍스트), 중앙에 현재 장면 본문, 하단에 이전/다음 버튼 + 대본 토글.
- 키보드: `ArrowRight`/`ArrowLeft`로 장면 이동, `Home`/`End`로 첫/마지막 장면. 입력 필드에 포커스가 있을 때는 가로채지 않는다.
- 마지막 장면에서 "다음"을 누르면 레슨 완료 처리 후 다음 레슨(체인상 `next`)으로 이동하거나, 마지막 레슨이면 `/lesson` 인덱스로 복귀.
- 접근성: 장면 전환 시 제목에 포커스 이동, `aria-live`로 위치 안내. Motion/Reduced-motion 처리는 이번 스코프에서 애니메이션 자체가 없으므로 해당 없음(즉시 전환).

## 7. 진도 저장 (localStorage)

키: `lesson-progress:ai-foundation` (course id는 이번 스코프에서 고정 문자열).

```json
{
  "lastLessonSlug": "context-and-memory",
  "lastSceneIndex": 2,
  "completedLessonSlugs": ["ai-first-perspective"]
}
```

- 장면 이동 시마다 `lastLessonSlug`/`lastSceneIndex` 갱신.
- 레슨의 마지막 장면을 완료하면 `completedLessonSlugs`에 slug 추가(중복 없이).
- 저장된 레슨 slug가 더 이상 존재하지 않으면(픽스처 변경 등) 진도를 무시하고 "학습 시작하기"로 폴백 — 에러를 던지지 않는다.
- 버전 관리(`courseVersion`, `lessonVersion`)는 이번 스코프에서 구현하지 않는다. 콘텐츠가 아직 픽스처 단계이므로 불필요.

## 8. 테스트 계획

- `wikiDocuments`: `lesson` docType이 `getWikiDocumentSection`/검색 랭킹/`buildFeaturedGuides`/guides 카테고리 목록 어디에도 나타나지 않음을 증명하는 회귀 테스트.
- `confluenceCleanHtml` 또는 신규 lesson 파서: Expand 매크로 → `scriptHtml` 분리, 대본 없는 장면 처리.
- 신규 장면 분리 함수: H2 개수만큼 장면 생성, 헤딩 없는 문서는 단일 장면 폴백.
- 진도 저장/복구: 저장 → 새로고침 시뮬레이션 → 복구, 존재하지 않는 slug 폴백.
- 컴포넌트: 홈 진입 카드 렌더링, `/lesson` 이어서 학습하기 버튼 조건부 렌더, 리더 키보드 네비게이션, 대본 토글.
- Playwright: 홈 → `/lesson` → 리더 진입, 좌우 이동, 대본 토글, 새로고침 후 위치 복구 — 라이트/다크 + 데스크톱(1280)/모바일(390).
- Playwright UI/UX 실사용 검증(자동화된 통과/실패 어설션과 별개로, 실제 화면을 띄워놓고 육안 확인):
  - 각 화면(홈 진입 카드, `/lesson` 인덱스, 리더)이 사용자 관점에서 이해하기 쉬운 구성인지 확인 — 문구·버튼 위치·다음 행동이 명확한지.
  - 장면 전환, 대본 토글 같은 인터랙티브 효과가 실제로 자연스럽게 동작하는지(끊김, 깜빡임, 잘못된 위치 이동 없는지) 확인.
  - 텍스트와 컴포넌트(버튼, 카드, 장면 컨테이너) 간 크기 비율이 라이트/다크·데스크톱/모바일 각 조합에서 어색하지 않은지 확인 — 텍스트가 컴포넌트에 비해 과도하게 작거나 커서 잘리거나 남는 여백이 어색하지 않은지.
  - 위 항목에서 문제가 발견되면 코드만 보고 추정하지 않고 실제 스크린샷/스냅샷으로 재확인 후 수정.
- Codex 크리티컬 리뷰(6c) 수행.

## 9. 위험 및 미해결 사항

- Expand 매크로가 레슨 문서에만 특별 취급되므로, 향후 실제 Confluence 콘텐츠 작성 시 저자가 다른 문서 타입에서 실수로 Expand를 대본처럼 쓰면 혼동될 수 있음 — 레슨 작성 가이드 문서화 필요(후속 세션, 콘텐츠 관리 에이전트 연동 시).
- 단일 course 고정(`ai-foundation`)은 향후 다중 과정이 생기면 재작업 필요 — 원 설계 문서의 Course Manifest 개념으로 이전할 때 데이터 구조 일부 재사용 가능하도록 이름을 맞춰둔다(`courseId`, `lessonSlug`).
