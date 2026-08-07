# Lesson 진행 UI (코스 로드맵 / 이중 진행률 / 학습 흐름 드로어) — 설계

> 문서 상태: 승인 대기
> 관련 참고 문서: `docs/superpowers/specs/2026-07-30-lesson-entry-and-progress-design.md`(1차 Lesson 기능 설계), `docs/tasks/lesson-entry-and-progress/`(1차 구현 결과)
> 비교 레퍼런스: `https://ai-work-education.leedh84.chatgpt.site/`(고정 콘텐츠로 만든 동일 목적의 사내 교육 사이트 — 화면 수준 비교 대상)

## 1. 배경과 목적

1차 세션에서 Lesson 기능의 핵심 골격(docType 격리, H2 장면 분리, 좌우 리더, localStorage 진도)을 구현했다. 이후 사용자가 동일한 목적으로 이미 완성된 레퍼런스 사이트와 비교한 결과, 진행 상황을 보여주는 UI(코스 개요, 진행률, 전체 학습 흐름 탐색)의 완성도 격차가 가장 크게 드러났다. 이 문서는 그 격차 중 "진행 UI" 영역만 좁히는 설계다.

레퍼런스 사이트는 콘텐츠와 화면이 하나로 고정된 정적 사이트이고, 이 프로젝트는 Confluence 콘텐츠와 렌더링을 분리한 유연한 구조라는 차이가 있다 — 이번 설계도 콘텐츠 관리 에이전트가 코드 변경 없이 레슨을 계속 추가할 수 있다는 전제를 유지한다.

## 2. 범위

### 포함
- `packages/wiki-core`에 코스 전체 개요(레슨×장면 트리, 예상 소요시간, 전체 장면 수)를 계산하는 순수 함수 추가.
- `/lesson` 인덱스 페이지를 코스 로드맵 그리드로 개편(레슨 카드: 순번·제목·요약·예상 시간, 통계 요약 라인, 완료 배지·이어서 학습하기/시작하기 유지).
- `/lesson/:slug` 리더 헤더에 이중 진행률(전체 진행 / 레슨 내 진행) 추가.
- 리더에 "학습 흐름" 드로어(전체 레슨×장면 트리, 장면 클릭 시 즉시 이동) 신규 추가 — 포커스 트랩/ESC 닫기/배경 클릭 닫기 포함.

### 제외 (다음 순서로 예정된 별도 스코프)
- Scene 시각 컴포넌트(카드형 비교, 사람↔AI 노드 다이어그램 등).
- "진행자 도우미" 4단 구조(이 장면이 필요한 이유/설명 흐름/확인 질문/다음 연결) — 현재의 단순 "대본 보기" 토글은 유지.
- 장면 전환/다이어그램 모션·애니메이션.
- SFOOD 위키 홈 화면(최상단) 진입 카드 변경 — 지금처럼 간단하게 유지.
- 레퍼런스 사이트의 색상/브랜드(네이비·틸) 채택 — 기존 SFOOD 위키 디자인 토큰만 사용, 레이아웃 구조만 참고.

## 3. 예상 소요시간 산정

콘텐츠 관리 에이전트가 별도로 입력하지 않아도 되도록, `wiki.metadata`에 필드를 추가하지 않고 **장면 수 기반으로 자동 계산**한다.

```
estimatedMinutes = Math.max(1, Math.round(scenes.length * 1.5))
```

장면당 1.5분은 임의 상수이며, 실제 학습 시간과 다를 수 있다는 점을 감안한 근사치다. 후속에 실측 데이터가 쌓이면 계수를 조정하거나 `wiki.metadata`에 명시적 필드를 추가하는 것으로 전환할 수 있다(이번 스코프에서는 하지 않음).

## 4. 데이터 레이어 (`packages/wiki-core`)

### 4.1 코스 개요 계산

```ts
export type CourseOutlineScene = {
  id: string;
  title: string;
};

export type CourseOutlineLesson = {
  lessonId: string;
  slug: string;
  title: string;
  summary: string;
  scenes: CourseOutlineScene[];
  estimatedMinutes: number;
};

export type CourseOutline = {
  lessons: CourseOutlineLesson[];
  totalScenes: number;
  totalEstimatedMinutes: number;
};

export function buildCourseOutline(documents: WikiDocument[]): CourseOutline;
```

- `listLessonDocumentsFrom(documents)`로 순서를 얻고, 각 레슨의 `contentHtml`을 `splitLessonContentIntoScenes`로 장면 분리해 `scenes`(id, title만 추출 — 본문/대본은 필요 없음)를 구성한다.
- `totalScenes`/`totalEstimatedMinutes`는 각 레슨 값의 합.
- 레슨이 0개면 `{ lessons: [], totalScenes: 0, totalEstimatedMinutes: 0 }`을 반환한다(예외를 던지지 않는다).

### 4.2 전체 장면 위치 계산

```ts
export function getGlobalScenePosition(
  outline: CourseOutline,
  lessonSlug: string,
  sceneIndex: number,
): { globalIndex: number; totalScenes: number } | null;
```

- 대상 레슨을 찾지 못하면 `null`을 반환한다(리더가 폴백 처리).
- `globalIndex`는 1부터 시작하는 사람이 읽는 순번(레퍼런스의 "01" 표기에 대응)이며, 이전 레슨들의 장면 수 합 + 현재 레슨 내 `sceneIndex`(0-based) + 1로 계산한다.

## 5. `/lesson` 인덱스 — 코스 로드맵 그리드

### 5.1 레이아웃

- 헤더: 기존 제목/부제 아래에 통계 요약 라인 추가 — 예: `"3개 레슨 · 12개 장면 · 약 18분"`(`buildCourseOutline` 결과로 조합, 레슨이 1개뿐이면 "N개 레슨" 대신 자연스러운 단수 표현은 만들지 않고 그대로 "1개 레슨"으로 표기 — 별도 단/복수 처리 로직을 추가하지 않는다).
- 이어서 학습하기/학습 시작하기 버튼: 기존 로직 그대로 유지.
- 레슨 목록: 기존 `<ol>` 세로 리스트를 2열 반응형 그리드 카드로 교체(`sm:grid-cols-1 md:grid-cols-2`).
  - 카드 내용: 순번(`01`, `02`, ...), 제목(`stripTitleTypePrefix`), `document.summary`(이미 `WikiDocument`에 있는 요약 필드, 140자 컷 — 새 필드 추가 없음), 예상 시간(`"약 N분"`), 완료 시 "완료" 배지(기존 로직 유지).
  - 색상/보더/라운드는 기존 `.lesson-index-list-link`와 동일한 토큰(`bg-card-bg`, `border-panel-border`, `text-page-fg`, `text-muted-fg`)을 재사용하고, 그리드 레이아웃만 새로 추가한다.

### 5.2 접근성/반응형

- 그리드는 모바일(`< sm`)에서 1열로 자연스럽게 쌓인다(기존 카드 스타일이 이미 반응형 유틸리티를 쓰므로 별도 미디어쿼리 불필요, Tailwind 그리드 브레이크포인트로 처리).
- 각 카드는 `<Link>` 하나로 전체가 클릭 가능(기존 `.lesson-index-list-link` 패턴 유지).

## 6. `/lesson/:slug` 리더 — 이중 진행률

- 기존 `{sceneIndex + 1} / {scenes.length}` 표기는 "레슨 내 진행"으로 유지.
- 그 옆(또는 위)에 "전체 진행" 표기 추가: `getGlobalScenePosition`으로 계산한 `"{globalIndex} / {totalScenes}"`.
- 두 표기를 시각적으로 구분하기 위해 전체 진행은 작은 라벨(`전체`)을, 레슨 내 진행은 라벨(`이 레슨`)을 붙인다 — 색상으로만 구분하지 않는다(접근성 원칙).
- `buildCourseOutline`은 `documents` 전체를 대상으로 매 렌더마다 다시 계산하지 않도록 `useMemo(() => buildCourseOutline(documents), [documents])`로 캐싱한다.

## 7. "학습 흐름" 드로어 (신규 컴포넌트)

### 7.1 컴포넌트: `LessonOutlineDrawer`

- 리더 헤더에 "학습 흐름" 버튼 추가 → 클릭 시 화면 오른쪽에서 슬라이드인하는 드로어를 연다.
- 드로어 내용: `buildCourseOutline` 결과를 레슨별로 그룹핑해 표시 — 레슨 제목 + 예상 시간, 그 아래 장면 제목 목록(순번 포함). 현재 보고 있는 장면은 강조 표시(텍스트 굵기/보더, 색상 단독 사용 금지).
- 장면 클릭 시 해당 레슨의 해당 장면으로 이동(다른 레슨의 장면이면 `/lesson/{slug}?scene={index}`로 네비게이션, 같은 레슨이면 상태만 변경).
- 닫기: 우측 상단 X 버튼, `Escape` 키, 배경(backdrop) 클릭.

### 7.2 접근성 (기존 설계 문서의 Player 접근성 원칙 그대로 적용)

- `role="dialog"`, `aria-modal="true"`, `aria-label="학습 흐름"`.
- 열릴 때 드로어 내부 첫 포커스 가능 요소(닫기 버튼)로 포커스 이동, 포커스 트랩(Tab 순환이 드로어 내부에서만 돌게).
- 닫히면 포커스를 원래 "학습 흐름" 트리거 버튼으로 복귀.
- 배경 스크롤 잠금(드로어 열린 동안 `body` 스크롤 방지)은 이번 스코프에 포함 — 별도 라이브러리 없이 `overflow: hidden` 토글로 처리.

### 7.3 스타일

- 우측 고정 패널(`fixed inset-y-0 right-0`), 기존 톤 유지(`bg-page-bg` 또는 `bg-card-bg`, `border-panel-border`).
- 배경 오버레이는 반투명 검정(`bg-black/40` 또는 다크모드에서도 어색하지 않은 톤) — 기존 프로젝트에 유사 오버레이 사례가 없어 새로 정의하되, 과도한 그림자/글로우 없이 단순하게 유지(No AI-cliché accent bar 원칙 준수).

## 8. 도메인 모델 요약 (변경/추가)

```ts
// packages/wiki-core 신규 export
export type CourseOutlineScene = { id: string; title: string };
export type CourseOutlineLesson = {
  lessonId: string; slug: string; title: string; summary: string;
  scenes: CourseOutlineScene[]; estimatedMinutes: number;
};
export type CourseOutline = { lessons: CourseOutlineLesson[]; totalScenes: number; totalEstimatedMinutes: number };
export function buildCourseOutline(documents: WikiDocument[]): CourseOutline;
export function getGlobalScenePosition(outline: CourseOutline, lessonSlug: string, sceneIndex: number): { globalIndex: number; totalScenes: number } | null;
```

`wiki.metadata` 스키마 변경 없음 — 기존 `next` 체인과 장면 분리 로직만 재사용한다.

## 9. 테스트 계획

- `buildCourseOutline`: 레슨 0/1/N개, 장면 수에 따른 예상 시간 계산, `next` 체인 순서 반영.
- `getGlobalScenePosition`: 첫 레슨/중간 레슨/마지막 레슨 각각의 전체 인덱스 계산, 존재하지 않는 레슨 슬러그에 대해 `null`.
- `LessonIndexPage`: 통계 요약 라인 렌더, 카드 그리드에 순번·요약·예상시간 표시, 레슨 0개일 때 기존 빈 상태 유지.
- `LessonReaderPage`: 이중 진행률 표기, "학습 흐름" 버튼 클릭 시 드로어 열림/장면 목록 표시/장면 클릭 시 이동/현재 장면 강조.
- `LessonOutlineDrawer`: ESC로 닫힘, 배경 클릭으로 닫힘, 닫을 때 트리거 버튼으로 포커스 복귀, 포커스 트랩(Tab이 드로어 밖으로 나가지 않음).
- Playwright: 라이트/다크 + 데스크톱(1280)/모바일(390)에서 로드맵 그리드, 이중 진행률, 드로어 열기/닫기/장면 이동을 실제 화면으로 확인. 레퍼런스 사이트 스크린샷과 나란히 비교해 구조적 유사도(로드맵 카드 배치, 진행률 이중 표기, 드로어 트리 구조)를 육안으로 검토.
- Codex 크리티컬 리뷰(6c).

## 10. 위험 및 미해결 사항

- 예상 소요시간(장면당 1.5분 가정)은 실제 학습 시간과 차이가 클 수 있다 — 콘텐츠가 쌓인 뒤 계수를 재조정하거나 명시적 필드로 전환하는 것을 후속 과제로 남긴다.
- 드로어는 이번 세션에서 처음 만드는 컴포넌트라 기존 프로젝트에 참고할 패턴이 없었다 — 접근성 요구사항(포커스 트랩 등)을 수동으로 구현하므로 Playwright로 반드시 실제 키보드 동작을 확인해야 한다.
- 레퍼런스 사이트와의 "구조적 유사도" 검토는 정성적 판단이라, Codex 리뷰나 자동화 테스트로 완전히 대체되지 않는다 — Task 9 단계에서 스크린샷 비교를 사용자에게도 공유해 확인받는 것을 권장.
