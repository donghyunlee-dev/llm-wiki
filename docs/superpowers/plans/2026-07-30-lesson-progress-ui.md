# Lesson 진행 UI (코스 로드맵 / 이중 진행률 / 학습 흐름 드로어) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lesson 기능의 "진행 UI" 격차(코스 로드맵, 이중 진행률, 전체 학습 흐름 드로어)를 좁혀 레퍼런스 사이트(`ai-work-education.leedh84.chatgpt.site`)와 구조적으로 유사한 탐색 경험을 제공한다. 시각 컴포넌트/모션/진행자 도우미는 이번 스코프에서 제외한다.

**Architecture:** `packages/wiki-core`에 순수 함수(`buildCourseOutline`, `getGlobalScenePosition`)를 추가해 코스 전체의 레슨×장면 구조와 예상 소요시간을 계산하고, `apps/web`의 `LessonIndexPage`(코스 로드맵 그리드로 개편)와 `LessonReaderPage`(이중 진행률 + 신규 `LessonOutlineDrawer`)가 이를 소비한다.

**Tech Stack:** React 19.2 / TypeScript 5.9 / React Router 7 / Tailwind CSS 4 / Vitest + Testing Library / Playwright MCP(수동 검증, 레퍼런스 사이트와 스크린샷 비교)

---

## 참고 문서

- `docs/superpowers/specs/2026-07-30-lesson-progress-ui-design.md` — 이 계획이 구현하는 설계
- `docs/tasks/lesson-entry-and-progress/` — 1차 Lesson 기능 구현(이번 작업의 전제)

## Task 0: 태스크 문서 워크스페이스 생성

**Files:**
- Create: `docs/tasks/lesson-progress-ui/spec.md`
- Create: `docs/tasks/lesson-progress-ui/plan.md`
- Create: `docs/tasks/lesson-progress-ui/tasks.md`

- [ ] **Step 1: spec.md 작성**

```markdown
# Lesson 진행 UI — Spec

전체 설계: `docs/superpowers/specs/2026-07-30-lesson-progress-ui-design.md`

## 범위

### 포함
- 코스 전체 개요(레슨×장면 트리, 예상 소요시간) 계산 함수
- `/lesson` 인덱스 → 코스 로드맵 그리드 개편
- `/lesson/:slug` 리더 이중 진행률(전체/레슨 내)
- "학습 흐름" 드로어(전체 장면 트리, 장면 클릭 이동, 포커스 트랩/ESC/배경 클릭 닫기)

### 제외 (후속 스코프)
- Scene 시각 컴포넌트(카드형 비교, 노드 다이어그램)
- 진행자 도우미 4단 구조(현재의 단순 "대본 보기" 토글 유지)
- 모션/전환 애니메이션
- 홈 화면(SFOOD 위키 최상단) 진입 카드 변경
- 레퍼런스 사이트의 색상/브랜드 채택(레이아웃 구조만 참고, 색상은 기존 SFOOD 토큰 유지)
```

- [ ] **Step 2: plan.md 작성**

```markdown
# Lesson 진행 UI — Plan

구현 계획 원본: `docs/superpowers/plans/2026-07-30-lesson-progress-ui.md`

이 파일은 원본 계획 문서를 가리키는 포인터다. 태스크별 진행 상황은 `tasks.md`에서 추적한다.
```

- [ ] **Step 3: tasks.md 작성**

```markdown
# Tasks

- [ ] Task 1: 코스 개요 계산 함수(buildCourseOutline/getGlobalScenePosition)
- [ ] Task 2: /lesson 인덱스 → 코스 로드맵 그리드
- [ ] Task 3: /lesson/:slug 리더 이중 진행률
- [ ] Task 4: 학습 흐름 드로어(LessonOutlineDrawer) 신규 및 연결
- [ ] Task 5: 전체 검증(테스트/타입체크/Playwright/레퍼런스 비교/Codex) 및 문서화
```

- [ ] **Step 4: Commit**

```bash
git add docs/tasks/lesson-progress-ui/
git commit -m "Add task workspace for lesson progress UI"
```

---

## Task 1: 코스 개요 계산 함수 (`courseOutline`)

**Files:**
- Create: `packages/wiki-core/src/lib/courseOutline.ts`
- Test: `packages/wiki-core/src/lib/courseOutline.test.ts`
- Modify: `packages/wiki-core/src/index.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`packages/wiki-core/src/lib/courseOutline.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import type { WikiDocument } from "./wikiDocuments";
import { buildCourseOutline, getGlobalScenePosition } from "./courseOutline";

function lessonDocument(overrides: Partial<WikiDocument> = {}): WikiDocument {
  return {
    id: "lesson-1",
    slug: "lesson-1",
    title: "레슨 1",
    summary: "레슨 1 요약",
    updatedAt: "2026-07-30",
    metadata: {
      docType: "lesson",
      audience: "beginner",
      status: "published",
      prerequisites: [],
      next: [],
      related: [],
    },
    headings: [],
    contentHtml: "<h2 id=\"a\">장면 A</h2><p>본문</p>",
    ...overrides,
  };
}

describe("buildCourseOutline", () => {
  it("returns an empty outline when there are no lesson documents", () => {
    expect(buildCourseOutline([])).toEqual({
      lessons: [],
      totalScenes: 0,
      totalEstimatedMinutes: 0,
    });
  });

  it("builds an ordered outline with per-lesson scenes and estimated minutes", () => {
    const documents = [
      lessonDocument({
        id: "l1",
        slug: "lesson-1",
        summary: "첫 번째 레슨",
        metadata: { ...lessonDocument().metadata, next: ["l2"] },
        contentHtml: "<h2 id=\"a\">장면 A</h2><p>본문 A</p><h2 id=\"b\">장면 B</h2><p>본문 B</p>",
      }),
      lessonDocument({
        id: "l2",
        slug: "lesson-2",
        title: "레슨 2",
        summary: "두 번째 레슨",
        metadata: { ...lessonDocument().metadata, next: [] },
        contentHtml: "<h2 id=\"c\">장면 C</h2><p>본문 C</p>",
      }),
    ];

    const outline = buildCourseOutline(documents);

    expect(outline.lessons).toHaveLength(2);
    expect(outline.lessons[0]).toMatchObject({
      lessonId: "l1",
      slug: "lesson-1",
      summary: "첫 번째 레슨",
      estimatedMinutes: 3,
    });
    expect(outline.lessons[0].scenes).toEqual([
      { id: "a", title: "장면 A" },
      { id: "b", title: "장면 B" },
    ]);
    expect(outline.lessons[1]).toMatchObject({ lessonId: "l2", estimatedMinutes: 2 });
    expect(outline.totalScenes).toBe(3);
    expect(outline.totalEstimatedMinutes).toBe(5);
  });

  it("rounds estimated minutes up to at least 1", () => {
    const documents = [
      lessonDocument({ id: "l1", slug: "lesson-1", contentHtml: "<p>H2가 없는 본문</p>" }),
    ];

    const outline = buildCourseOutline(documents);

    expect(outline.lessons[0].estimatedMinutes).toBeGreaterThanOrEqual(1);
  });
});

describe("getGlobalScenePosition", () => {
  const documents = [
    lessonDocument({
      id: "l1",
      slug: "lesson-1",
      metadata: { ...lessonDocument().metadata, next: ["l2"] },
      contentHtml: "<h2 id=\"a\">장면 A</h2><p>A</p><h2 id=\"b\">장면 B</h2><p>B</p>",
    }),
    lessonDocument({
      id: "l2",
      slug: "lesson-2",
      metadata: { ...lessonDocument().metadata, next: [] },
      contentHtml: "<h2 id=\"c\">장면 C</h2><p>C</p>",
    }),
  ];
  const outline = buildCourseOutline(documents);

  it("computes the global 1-based index for a scene in the first lesson", () => {
    expect(getGlobalScenePosition(outline, "lesson-1", 1)).toEqual({
      globalIndex: 2,
      totalScenes: 3,
    });
  });

  it("computes the global 1-based index for a scene in a later lesson", () => {
    expect(getGlobalScenePosition(outline, "lesson-2", 0)).toEqual({
      globalIndex: 3,
      totalScenes: 3,
    });
  });

  it("returns null for an unknown lesson slug", () => {
    expect(getGlobalScenePosition(outline, "missing-lesson", 0)).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `pnpm --filter @sfood/wiki-core test -- courseOutline`
Expected: FAIL — `Cannot find module './courseOutline'`

- [ ] **Step 3: 구현**

`packages/wiki-core/src/lib/courseOutline.ts`:

```typescript
import { listLessonDocumentsFrom } from "./lessonDocuments";
import { splitLessonContentIntoScenes } from "./lessonScenes";
import type { WikiDocument } from "./wikiDocuments";

const MINUTES_PER_SCENE = 1.5;

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

export function buildCourseOutline(documents: WikiDocument[]): CourseOutline {
  const lessons = listLessonDocumentsFrom(documents).map((lesson) => {
    const scenes = splitLessonContentIntoScenes(lesson.contentHtml).map((scene) => ({
      id: scene.id,
      title: scene.title,
    }));
    const estimatedMinutes = Math.max(1, Math.round(scenes.length * MINUTES_PER_SCENE));

    return {
      lessonId: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      summary: lesson.summary,
      scenes,
      estimatedMinutes,
    };
  });

  return {
    lessons,
    totalScenes: lessons.reduce((sum, lesson) => sum + lesson.scenes.length, 0),
    totalEstimatedMinutes: lessons.reduce((sum, lesson) => sum + lesson.estimatedMinutes, 0),
  };
}

export function getGlobalScenePosition(
  outline: CourseOutline,
  lessonSlug: string,
  sceneIndex: number,
): { globalIndex: number; totalScenes: number } | null {
  let precedingScenes = 0;

  for (const lesson of outline.lessons) {
    if (lesson.slug === lessonSlug) {
      return {
        globalIndex: precedingScenes + sceneIndex + 1,
        totalScenes: outline.totalScenes,
      };
    }

    precedingScenes += lesson.scenes.length;
  }

  return null;
}
```

- [ ] **Step 4: 테스트 재실행 — 통과 확인**

Run: `pnpm --filter @sfood/wiki-core test -- courseOutline`
Expected: PASS

- [ ] **Step 5: 패키지 공개 export에 추가**

`packages/wiki-core/src/index.ts`에 추가:

```typescript
export * from "./lib/courseOutline";
```

- [ ] **Step 6: 전체 typecheck 확인**

Run: `pnpm -r typecheck`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/wiki-core/src/lib/courseOutline.ts \
  packages/wiki-core/src/lib/courseOutline.test.ts \
  packages/wiki-core/src/index.ts
git commit -m "Add course outline calculation (scene tree, estimated minutes, global position)"
```

---

## Task 2: `/lesson` 인덱스 → 코스 로드맵 그리드

**Files:**
- Modify: `apps/web/src/ui/pages/LessonIndexPage.tsx`
- Modify: `apps/web/src/ui/pages/LessonIndexPage.test.tsx`
- Modify: `apps/web/src/styles.css`

- [ ] **Step 1: 실패하는 테스트로 교체**

`apps/web/src/ui/pages/LessonIndexPage.test.tsx`를 아래 내용으로 전체 교체(기존 3개 테스트의 의도를 유지하되 새 그리드/통계 구조에 맞춘 어서션으로 갱신):

```typescript
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { WikiDocument } from "@sfood/wiki-core";
import { LessonIndexPage } from "./LessonIndexPage";
import { LESSON_COURSE_ID } from "../../data/lessonProgress";

const useWikiDataMock = vi.fn();

vi.mock("../../data/WikiDataProvider", () => ({
  useWikiData: () => useWikiDataMock(),
}));

function lessonDocument(overrides: Partial<WikiDocument> = {}): WikiDocument {
  return {
    id: "lesson-1",
    slug: "ai-first-perspective",
    title: "AI를 이해하는 첫 번째 관점",
    summary: "AI의 기본 개념을 처음 접하는 관점에서 설명합니다.",
    updatedAt: "2026-07-30",
    metadata: {
      docType: "lesson",
      audience: "beginner",
      status: "published",
      prerequisites: [],
      next: ["lesson-2"],
      related: [],
    },
    headings: [],
    contentHtml: "<h2>장면 1</h2><p>본문</p><h2>장면 2</h2><p>본문</p>",
    ...overrides,
  };
}

describe("LessonIndexPage", () => {
  beforeEach(() => {
    useWikiDataMock.mockReset();
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows a stats line and a start button when there is no saved progress", () => {
    useWikiDataMock.mockReturnValue({
      documents: [
        lessonDocument({ id: "lesson-1", slug: "ai-first-perspective", metadata: { ...lessonDocument().metadata, next: ["lesson-2"] } }),
        lessonDocument({
          id: "lesson-2",
          slug: "context-and-memory",
          title: "컨텍스트와 기억의 한계",
          summary: "컨텍스트 창의 한계를 설명합니다.",
          metadata: { ...lessonDocument().metadata, next: [] },
          contentHtml: "<h2>장면</h2><p>본문</p>",
        }),
      ],
      errorMessage: null,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <LessonIndexPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("2개 레슨 · 3개 장면 · 약 5분")).toBeInTheDocument();
    expect(screen.getByText("학습 시작하기")).toBeInTheDocument();
  });

  it("renders each lesson as a card with order, title, summary, and estimated minutes", () => {
    useWikiDataMock.mockReturnValue({
      documents: [lessonDocument()],
      errorMessage: null,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <LessonIndexPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("AI를 이해하는 첫 번째 관점")).toBeInTheDocument();
    expect(screen.getByText("AI의 기본 개념을 처음 접하는 관점에서 설명합니다.")).toBeInTheDocument();
    expect(screen.getByText("약 3분")).toBeInTheDocument();
  });

  it("shows a continue button when progress is saved", () => {
    window.localStorage.setItem(
      `lesson-progress:${LESSON_COURSE_ID}`,
      JSON.stringify({
        lastLessonSlug: "ai-first-perspective",
        lastSceneIndex: 1,
        completedLessonSlugs: ["ai-first-perspective"],
      }),
    );

    useWikiDataMock.mockReturnValue({
      documents: [lessonDocument()],
      errorMessage: null,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <LessonIndexPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("이어서 학습하기")).toBeInTheDocument();
    expect(screen.getByText("완료")).toBeInTheDocument();
  });

  it("shows an empty state when there are no lesson documents", () => {
    useWikiDataMock.mockReturnValue({ documents: [], errorMessage: null, isLoading: false });

    render(
      <MemoryRouter>
        <LessonIndexPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("등록된 교육 콘텐츠가 없습니다.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `pnpm --filter @sfood/web test -- LessonIndexPage`
Expected: FAIL (통계 라인/카드 순번/요약/예상시간 텍스트가 아직 없음)

- [ ] **Step 3: 구현**

`apps/web/src/ui/pages/LessonIndexPage.tsx` 전체를 아래로 교체:

```typescript
import { buildCourseOutline, listLessonDocumentsFrom, stripTitleTypePrefix } from "@sfood/wiki-core";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useWikiData } from "../../data/WikiDataProvider";
import { LESSON_COURSE_ID, loadLessonProgress } from "../../data/lessonProgress";
import { WikiStatePanel } from "./WikiStatePanel";

export function LessonIndexPage() {
  const { documents, errorMessage, isLoading } = useWikiData();
  const lessons = useMemo(() => listLessonDocumentsFrom(documents), [documents]);
  const outline = useMemo(() => buildCourseOutline(documents), [documents]);
  const progress = loadLessonProgress(LESSON_COURSE_ID);

  if (isLoading) {
    return <WikiStatePanel title="불러오는 중" body="교육 콘텐츠를 불러오고 있습니다." />;
  }

  if (errorMessage) {
    return <WikiStatePanel title="문제가 발생했습니다" body={errorMessage} tone="error" />;
  }

  if (lessons.length === 0) {
    return <WikiStatePanel title="AI 기초교육" body="등록된 교육 콘텐츠가 없습니다." />;
  }

  const continueLesson = progress
    ? lessons.find((lesson) => lesson.slug === progress.lastLessonSlug)
    : undefined;
  const entryHref = continueLesson
    ? `/lesson/${continueLesson.slug}?scene=${progress?.lastSceneIndex ?? 0}`
    : `/lesson/${lessons[0].slug}`;

  return (
    <section className="lesson-index-shell">
      <header className="lesson-index-header">
        <h1 className="lesson-index-title">AI 기초교육</h1>
        <p className="lesson-index-subtitle">
          실습 전에 알아야 할 기본 개념을 순서대로 학습합니다.
        </p>
        <p className="lesson-index-stats">
          {outline.lessons.length}개 레슨 · {outline.totalScenes}개 장면 · 약 {outline.totalEstimatedMinutes}분
        </p>
        <Link to={entryHref} className="lesson-index-primary-button">
          {continueLesson ? "이어서 학습하기" : "학습 시작하기"}
        </Link>
      </header>

      <div className="lesson-index-grid">
        {lessons.map((lesson, index) => {
          const outlineLesson = outline.lessons[index];
          const orderLabel = String(index + 1).padStart(2, "0");

          return (
            <Link key={lesson.id} to={`/lesson/${lesson.slug}`} className="lesson-index-card">
              <div className="lesson-index-card-header">
                <span className="lesson-index-card-order">{orderLabel}</span>
                {progress?.completedLessonSlugs.includes(lesson.slug) ? (
                  <span className="lesson-index-card-status">완료</span>
                ) : null}
              </div>
              <span className="lesson-index-card-title">{stripTitleTypePrefix(lesson.title)}</span>
              <span className="lesson-index-card-summary">{lesson.summary}</span>
              <span className="lesson-index-card-meta">약 {outlineLesson.estimatedMinutes}분</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: 스타일 교체**

`apps/web/src/styles.css`에서 `.lesson-index-list`, `.lesson-index-list-item`, `.lesson-index-list-link`, `.lesson-index-list-title`, `.lesson-index-list-status` 5개 블록(약 1900~1918번째 줄, `.lesson-index-primary-button` 다음부터 `.lesson-reader-shell` 이전까지)을 아래로 통째로 교체:

```css
  .lesson-index-stats {
    @apply text-[13px] text-muted-fg;
  }

  .lesson-index-grid {
    @apply grid grid-cols-1 gap-3 sm:grid-cols-2;
  }

  .lesson-index-card {
    @apply flex flex-col gap-2 rounded-[var(--radius-lg)] border border-panel-border bg-card-bg p-4 no-underline transition hover:border-accent/40 hover:bg-card-hover-bg;
  }

  .lesson-index-card-header {
    @apply flex items-center justify-between gap-2;
  }

  .lesson-index-card-order {
    @apply text-[12px] font-semibold text-accent;
  }

  .lesson-index-card-status {
    @apply text-[12px] font-semibold text-muted-fg;
  }

  .lesson-index-card-title {
    @apply text-[15px] font-semibold text-page-fg;
  }

  .lesson-index-card-summary {
    @apply text-[13px] leading-5 text-muted-fg;
  }

  .lesson-index-card-meta {
    @apply text-[12px] text-muted-fg;
  }
```

주의: `.lesson-index-header` 블록 안(제목/부제 다음, primary-button 이전)에 통계 라인을 위한 `<p className="lesson-index-stats">`가 이미 컴포넌트 코드에 추가되어 있으므로, 이 CSS 블록은 `.lesson-index-primary-button` 블록 바로 다음에 위치해야 한다(기존 위치 그대로 대체).

- [ ] **Step 5: 테스트 재실행 — 통과 확인**

Run: `pnpm --filter @sfood/web test -- LessonIndexPage`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/ui/pages/LessonIndexPage.tsx \
  apps/web/src/ui/pages/LessonIndexPage.test.tsx \
  apps/web/src/styles.css
git commit -m "Turn /lesson index into a course roadmap grid with stats and estimated minutes"
```

---

## Task 3: `/lesson/:slug` 리더 — 이중 진행률

**Files:**
- Modify: `apps/web/src/ui/pages/LessonReaderPage.tsx`
- Modify: `apps/web/src/ui/pages/LessonReaderPage.test.tsx`
- Modify: `apps/web/src/styles.css`

- [ ] **Step 1: 실패하는 테스트 추가**

`apps/web/src/ui/pages/LessonReaderPage.test.tsx`의 기존 `describe("LessonReaderPage", ...)` 블록 안, 첫 번째 `it(...)`("shows the first scene and position indicator on load") 바로 다음에 아래 테스트를 추가한다:

```typescript
  it("shows the overall course progress alongside the in-lesson position", () => {
    useWikiDataMock.mockReturnValue({
      documents: [
        { ...lessonDocument(), metadata: { ...lessonDocument().metadata, next: ["lesson-2"] } },
        {
          ...lessonDocument(),
          id: "lesson-2",
          slug: "context-and-memory",
          metadata: { ...lessonDocument().metadata, next: [] },
          contentHtml: "<h2>장면</h2><p>본문</p>",
        },
      ],
      errorMessage: null,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("이 레슨")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(screen.getByText("전체")).toBeInTheDocument();
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });
```

(참고: 이 시점의 `useParams` 목은 항상 `{ slug: "ai-first-perspective" }`를 반환하므로, 위 테스트의 두 번째 문서(`lesson-2`)는 전체 장면 수 계산에만 기여하고 실제로 렌더링되는 레슨은 여전히 `lesson-1`이다. `lessonDocument()`는 기존 테스트 파일에 이미 정의된 헬퍼로, `ai-first-perspective` 슬러그에 장면 2개짜리 본문을 반환한다.)

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `pnpm --filter @sfood/web test -- LessonReaderPage`
Expected: FAIL — "전체" 텍스트를 찾을 수 없음

- [ ] **Step 3: 구현**

`apps/web/src/ui/pages/LessonReaderPage.tsx` 상단 import를 아래로 교체:

```typescript
import {
  buildCourseOutline,
  getGlobalScenePosition,
  getLessonDocumentFrom,
  getNextLessonSlugFrom,
  splitLessonContentIntoScenes,
  stripTitleTypePrefix,
} from "@sfood/wiki-core";
```

`const { documents, errorMessage, isLoading } = useWikiData();` 다음 줄에 추가:

```typescript
  const outline = useMemo(() => buildCourseOutline(documents), [documents]);
```

기존 `<header className="lesson-reader-header">` 블록 전체를 아래로 교체:

```typescript
      <header className="lesson-reader-header">
        <Link to="/lesson" className="lesson-reader-back-link">
          ← 교육 목록
        </Link>
        <div className="lesson-reader-progress">
          <span className="lesson-reader-progress-item">
            <span className="lesson-reader-progress-label">이 레슨</span>
            {sceneIndex + 1} / {scenes.length}
          </span>
          {globalPosition ? (
            <span className="lesson-reader-progress-item">
              <span className="lesson-reader-progress-label">전체</span>
              {globalPosition.globalIndex} / {globalPosition.totalScenes}
            </span>
          ) : null}
        </div>
      </header>
```

`const scene = scenes[sceneIndex];` 바로 위에 추가:

```typescript
  const globalPosition = getGlobalScenePosition(outline, slug, sceneIndex);
```

- [ ] **Step 4: 스타일 추가**

`apps/web/src/styles.css`의 `.lesson-reader-position` 블록을 아래로 교체(이 클래스는 더 이상 쓰이지 않으므로 제거하고 새 클래스로 대체):

```css
  .lesson-reader-progress {
    @apply flex items-center gap-4;
  }

  .lesson-reader-progress-item {
    @apply flex items-center gap-1.5 font-medium;
  }

  .lesson-reader-progress-label {
    @apply text-[11px] font-semibold uppercase tracking-wide text-muted-fg;
  }
```

- [ ] **Step 5: 테스트 재실행 — 통과 확인**

Run: `pnpm --filter @sfood/web test -- LessonReaderPage`
Expected: PASS (신규 테스트 포함 기존 8개 테스트 전부)

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/ui/pages/LessonReaderPage.tsx \
  apps/web/src/ui/pages/LessonReaderPage.test.tsx \
  apps/web/src/styles.css
git commit -m "Show overall course progress alongside in-lesson scene position"
```

---

## Task 4: "학습 흐름" 드로어 (`LessonOutlineDrawer`)

**Files:**
- Create: `apps/web/src/ui/pages/LessonOutlineDrawer.tsx`
- Test: `apps/web/src/ui/pages/LessonOutlineDrawer.test.tsx`
- Modify: `apps/web/src/ui/pages/LessonReaderPage.tsx`
- Modify: `apps/web/src/ui/pages/LessonReaderPage.test.tsx`
- Modify: `apps/web/src/styles.css`

- [ ] **Step 1: 드로어 단독 실패하는 테스트 작성**

`apps/web/src/ui/pages/LessonOutlineDrawer.test.tsx`:

```typescript
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import type { CourseOutline } from "@sfood/wiki-core";
import { LessonOutlineDrawer } from "./LessonOutlineDrawer";

afterEach(() => {
  cleanup();
});

const outline: CourseOutline = {
  lessons: [
    {
      lessonId: "l1",
      slug: "lesson-1",
      title: "레슨 1",
      summary: "요약 1",
      scenes: [
        { id: "a", title: "장면 A" },
        { id: "b", title: "장면 B" },
      ],
      estimatedMinutes: 3,
    },
    {
      lessonId: "l2",
      slug: "lesson-2",
      title: "레슨 2",
      summary: "요약 2",
      scenes: [{ id: "c", title: "장면 C" }],
      estimatedMinutes: 2,
    },
  ],
  totalScenes: 3,
  totalEstimatedMinutes: 5,
};

function renderDrawer(overrides: Partial<Parameters<typeof LessonOutlineDrawer>[0]> = {}) {
  const triggerRef = createRef<HTMLButtonElement>();
  const onClose = vi.fn();
  const onSelectScene = vi.fn();

  render(
    <div>
      <button ref={triggerRef}>trigger</button>
      <LessonOutlineDrawer
        outline={outline}
        currentLessonSlug="lesson-1"
        currentSceneIndex={0}
        open
        onClose={onClose}
        onSelectScene={onSelectScene}
        triggerRef={triggerRef}
        {...overrides}
      />
    </div>,
  );

  return { triggerRef, onClose, onSelectScene };
}

describe("LessonOutlineDrawer", () => {
  it("does not render when closed", () => {
    render(
      <LessonOutlineDrawer
        outline={outline}
        currentLessonSlug="lesson-1"
        currentSceneIndex={0}
        open={false}
        onClose={vi.fn()}
        onSelectScene={vi.fn()}
        triggerRef={createRef<HTMLButtonElement>()}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lists every lesson and scene from the outline", () => {
    renderDrawer();

    expect(screen.getByText("레슨 1")).toBeInTheDocument();
    expect(screen.getByText("레슨 2")).toBeInTheDocument();
    expect(screen.getByText("장면 A")).toBeInTheDocument();
    expect(screen.getByText("장면 B")).toBeInTheDocument();
    expect(screen.getByText("장면 C")).toBeInTheDocument();
    expect(screen.getByText("약 3분")).toBeInTheDocument();
  });

  it("marks the current scene as current", () => {
    renderDrawer();

    expect(screen.getByText("장면 A").closest("button")).toHaveAttribute("aria-current", "true");
    expect(screen.getByText("장면 B").closest("button")).not.toHaveAttribute("aria-current");
  });

  it("calls onSelectScene with the lesson slug and scene index when a scene is clicked", () => {
    const { onSelectScene } = renderDrawer();

    fireEvent.click(screen.getByText("장면 C"));

    expect(onSelectScene).toHaveBeenCalledWith("lesson-2", 0);
  });

  it("closes on Escape and returns focus to the trigger button", () => {
    const { onClose, triggerRef } = renderDrawer();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalled();
    expect(document.activeElement).toBe(triggerRef.current);
  });

  it("closes when the backdrop is clicked but not when the panel itself is clicked", () => {
    const { onClose } = renderDrawer();

    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("dialog").parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalled();
  });

  it("moves focus to the close button when opened", () => {
    renderDrawer();

    expect(document.activeElement).toBe(screen.getByLabelText("학습 흐름 닫기"));
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `pnpm --filter @sfood/web test -- LessonOutlineDrawer`
Expected: FAIL — `Cannot find module './LessonOutlineDrawer'`

- [ ] **Step 3: 드로어 구현**

`apps/web/src/ui/pages/LessonOutlineDrawer.tsx`:

```typescript
import type { CourseOutline } from "@sfood/wiki-core";
import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export type LessonOutlineDrawerProps = {
  outline: CourseOutline;
  currentLessonSlug: string;
  currentSceneIndex: number;
  open: boolean;
  onClose: () => void;
  onSelectScene: (lessonSlug: string, sceneIndex: number) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
};

export function LessonOutlineDrawer({
  outline,
  currentLessonSlug,
  currentSceneIndex,
  open,
  onClose,
  onSelectScene,
  triggerRef,
}: LessonOutlineDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    closeButtonRef.current?.focus();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );

      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      triggerRef.current?.focus();
    };
  }, [open, onClose, triggerRef]);

  if (!open) {
    return null;
  }

  return (
    <div className="lesson-outline-backdrop" onClick={onClose}>
      <div
        ref={panelRef}
        className="lesson-outline-panel"
        role="dialog"
        aria-modal="true"
        aria-label="학습 흐름"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="lesson-outline-panel-header">
          <span className="lesson-outline-panel-title">학습 흐름</span>
          <button
            type="button"
            ref={closeButtonRef}
            className="lesson-outline-close-button"
            onClick={onClose}
            aria-label="학습 흐름 닫기"
          >
            ×
          </button>
        </header>

        <nav className="lesson-outline-list">
          {outline.lessons.map((lesson) => (
            <div key={lesson.lessonId}>
              <p className="lesson-outline-lesson-title">
                <span>{lesson.title}</span>
                <span className="lesson-outline-lesson-minutes">약 {lesson.estimatedMinutes}분</span>
              </p>
              <ol className="lesson-outline-scene-list">
                {lesson.scenes.map((scene, index) => {
                  const isCurrent = lesson.slug === currentLessonSlug && index === currentSceneIndex;

                  return (
                    <li key={scene.id}>
                      <button
                        type="button"
                        className={
                          isCurrent
                            ? "lesson-outline-scene-button lesson-outline-scene-button-current"
                            : "lesson-outline-scene-button"
                        }
                        onClick={() => onSelectScene(lesson.slug, index)}
                        aria-current={isCurrent ? "true" : undefined}
                      >
                        <span className="lesson-outline-scene-index">{index + 1}</span>
                        <span>{scene.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 드로어 스타일 추가**

`apps/web/src/styles.css`의 `.lesson-reader-nav-button-primary` 블록 다음(파일 끝)에 추가:

```css
  .lesson-reader-outline-button {
    @apply rounded-[var(--radius-lg)] border border-panel-border bg-card-bg px-3 py-1.5 text-[12px] font-semibold text-muted-fg transition hover:border-accent/40 hover:text-page-fg;
  }

  .lesson-outline-backdrop {
    @apply fixed inset-0 z-40 bg-black/40;
  }

  .lesson-outline-panel {
    @apply fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col gap-4 overflow-y-auto border-l border-panel-border bg-page-bg p-5;
  }

  .lesson-outline-panel-header {
    @apply flex items-center justify-between;
  }

  .lesson-outline-panel-title {
    @apply text-[15px] font-semibold text-page-fg;
  }

  .lesson-outline-close-button {
    @apply rounded-[var(--radius-lg)] border border-panel-border bg-card-bg px-2 py-1 text-[13px] text-muted-fg hover:text-page-fg;
  }

  .lesson-outline-list {
    @apply flex flex-col gap-5;
  }

  .lesson-outline-lesson-title {
    @apply flex items-center justify-between text-[13px] font-semibold text-page-fg;
  }

  .lesson-outline-lesson-minutes {
    @apply text-[11px] font-normal text-muted-fg;
  }

  .lesson-outline-scene-list {
    @apply mt-2 flex flex-col gap-1;
  }

  .lesson-outline-scene-button {
    @apply flex w-full items-center gap-2 rounded-[var(--radius-lg)] px-2 py-1.5 text-left text-[13px] text-muted-fg transition hover:bg-card-hover-bg hover:text-page-fg;
  }

  .lesson-outline-scene-button-current {
    @apply bg-card-hover-bg font-semibold text-page-fg;
  }

  .lesson-outline-scene-index {
    @apply text-[11px] font-semibold text-accent;
  }
```

- [ ] **Step 5: 드로어 테스트 실행 — 통과 확인**

Run: `pnpm --filter @sfood/web test -- LessonOutlineDrawer`
Expected: PASS (7개 테스트)

- [ ] **Step 6: `LessonReaderPage`에 드로어 연결 — 실패하는 테스트 추가**

`apps/web/src/ui/pages/LessonReaderPage.test.tsx`의 마지막 `it(...)` 다음에 추가:

```typescript
  it("opens the outline drawer, jumps to a different lesson, and closes the drawer", () => {
    useWikiDataMock.mockReturnValue({
      documents: [
        { ...lessonDocument(), metadata: { ...lessonDocument().metadata, next: ["lesson-2"] } },
        {
          ...lessonDocument(),
          id: "lesson-2",
          slug: "context-and-memory",
          title: "컨텍스트와 기억의 한계",
          metadata: { ...lessonDocument().metadata, next: [] },
          contentHtml: "<h2>다른 레슨 장면</h2><p>본문</p>",
        },
      ],
      errorMessage: null,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("학습 흐름"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("다른 레슨 장면")).toBeInTheDocument();

    fireEvent.click(screen.getByText("다른 레슨 장면"));

    expect(navigateMock).toHaveBeenCalledWith("/lesson/context-and-memory?scene=0");
  });

  it("jumps within the same lesson without navigating", () => {
    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("학습 흐름"));
    fireEvent.click(screen.getByText("두 번째 장면"));

    expect(navigateMock).not.toHaveBeenCalled();
    expect(screen.getByText("두 번째 장면")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
```

- [ ] **Step 7: 테스트 실행 — 실패 확인**

Run: `pnpm --filter @sfood/web test -- LessonReaderPage`
Expected: FAIL — "학습 흐름" 버튼/드로어가 아직 연결되지 않음

- [ ] **Step 8: `LessonReaderPage`에 드로어 연결**

`apps/web/src/ui/pages/LessonReaderPage.tsx` 상단 import에 추가:

```typescript
import { useEffect, useMemo, useRef, useState } from "react";
import { LessonOutlineDrawer } from "./LessonOutlineDrawer";
```

(기존 `import { useEffect, useMemo, useState } from "react";`를 `useRef` 포함하도록 교체.)

`const [scriptVisible, setScriptVisible] = useState(false);` 다음 줄에 추가:

```typescript
  const [outlineOpen, setOutlineOpen] = useState(false);
  const outlineTriggerRef = useRef<HTMLButtonElement>(null);
```

`goNext`/`goPrevious` 함수 정의 다음(키보드 `useEffect` 이전)에 추가:

```typescript
  function handleSelectScene(targetLessonSlug: string, targetSceneIndex: number) {
    setOutlineOpen(false);

    if (targetLessonSlug === slug) {
      setSceneIndex(targetSceneIndex);
      return;
    }

    navigate(`/lesson/${targetLessonSlug}?scene=${targetSceneIndex}`);
  }
```

키보드 `useEffect`의 `handleKeyDown` 함수 맨 앞(`const target = ...` 다음)에 드로어가 열려 있으면 장면 이동 단축키를 가로채지 않도록 가드 추가:

```typescript
      if (outlineOpen) {
        return;
      }
```

헤더의 `<div className="lesson-reader-progress">` 블록 다음(같은 `<header>` 안, 닫는 태그 이전)에 버튼 추가:

```typescript
        <button
          type="button"
          ref={outlineTriggerRef}
          className="lesson-reader-outline-button"
          onClick={() => setOutlineOpen(true)}
        >
          학습 흐름
        </button>
```

`</section>`(최상위 반환 블록의 닫는 태그) 바로 앞에 드로어 렌더 추가:

```typescript
      <LessonOutlineDrawer
        outline={outline}
        currentLessonSlug={slug}
        currentSceneIndex={sceneIndex}
        open={outlineOpen}
        onClose={() => setOutlineOpen(false)}
        onSelectScene={handleSelectScene}
        triggerRef={outlineTriggerRef}
      />
```

- [ ] **Step 9: 테스트 재실행 — 통과 확인**

Run: `pnpm --filter @sfood/web test -- LessonReaderPage`
Expected: PASS (기존 8개 + 신규 2개 = 10개)

- [ ] **Step 10: 전체 typecheck/test 확인**

Run: `pnpm -r typecheck && pnpm -r test`
Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add apps/web/src/ui/pages/LessonOutlineDrawer.tsx \
  apps/web/src/ui/pages/LessonOutlineDrawer.test.tsx \
  apps/web/src/ui/pages/LessonReaderPage.tsx \
  apps/web/src/ui/pages/LessonReaderPage.test.tsx \
  apps/web/src/styles.css
git commit -m "Add course outline drawer with focus trap and cross-lesson scene navigation"
```

---

## Task 5: 전체 검증 및 문서화

**Files:**
- Modify: `docs/tasks/lesson-progress-ui/test-result.md` (신규 작성)
- Modify: `docs/tasks/lesson-progress-ui/result.md` (신규 작성)
- Modify: `docs/prd/implementation-status.md`

- [ ] **Step 1: 전체 테스트/타입체크/빌드**

Run:
```bash
pnpm -r typecheck
pnpm -r test
pnpm --filter @sfood/web build
```
Expected: 전체 PASS.

- [ ] **Step 2: Playwright 실사용 검증 + 레퍼런스 사이트 비교**

Playwright MCP로 dev 서버(`snapshot` 모드)를 띄우고 라이트/다크 × 데스크톱(1280)/모바일(390)에서 확인한다.

- `/lesson` 인덱스: 통계 라인, 카드 그리드(순번/제목/요약/예상시간), 완료 배지, 이어서 학습하기/시작하기 버튼.
- `/lesson/:slug` 리더: "이 레슨"/"전체" 이중 진행률 표기, "학습 흐름" 버튼.
- "학습 흐름" 드로어: 열기 → 전체 레슨×장면 트리 확인 → 다른 레슨 장면 클릭 시 해당 레슨/장면으로 이동 → 같은 레슨 장면 클릭 시 드로어만 닫히고 즉시 이동 → Esc로 닫힘 → 배경 클릭으로 닫힘 → 닫힌 뒤 포커스가 "학습 흐름" 버튼으로 돌아오는지 키보드로 직접 확인(Tab으로 드로어 밖으로 포커스가 나가지 않는지도 확인).
- 레퍼런스 사이트(`https://ai-work-education.leedh84.chatgpt.site/`)를 나란히 열어 두고, 코스 로드맵 그리드 배치·이중 진행률 표기·전체 학습 흐름 트리 구조가 구조적으로 유사한 형태인지 스크린샷으로 비교한다. 색상/브랜드는 의도적으로 다르다는 점을 감안하고, 레이아웃 구조와 정보 위계(순번/제목/요약/시간, 전체/레슨 내 진행 이중 표기, 트리형 전체 탐색)가 대응되는지 확인한다.

- [ ] **Step 3: Codex 크리티컬 리뷰**

전체 diff(`docs/superpowers/plans/2026-07-30-lesson-progress-ui.md` 관련 커밋 전체)를 Codex에 전달해 크리티컬 리뷰를 받는다. 발견된 이슈는 즉시 수정하고 재검증한다.

- [ ] **Step 4: `test-result.md` 작성**

```markdown
# Test Result

## 실행한 명령과 결과
- `pnpm -r typecheck`: (결과)
- `pnpm -r test`: (결과, 통과 개수)
- `pnpm --filter @sfood/web build`: (결과)

## Playwright 실사용 검증
- (코스 로드맵, 이중 진행률, 드로어 열기/닫기/포커스/이동 각 항목별 결과)

## 레퍼런스 사이트 비교
- (구조적 유사도 판단 결과와 남은 차이)

## Codex 크리티컬 리뷰
- (발견 사항과 조치)

## 스킵한 검증
- (있다면 사유 명시, 없으면 "없음")
```

- [ ] **Step 5: `result.md` 작성**

전달 범위 요약, 주요 결정, 검증 결과, 남은 갭(Scene 시각 컴포넌트/진행자 도우미/모션은 후속 스코프)을 기록한다.

- [ ] **Step 6: `implementation-status.md` 갱신**

"Latest Completed Work" 최상단에 이번 작업 항목을 추가한다.

- [ ] **Step 7: Commit**

```bash
git add docs/tasks/lesson-progress-ui/test-result.md \
  docs/tasks/lesson-progress-ui/result.md \
  docs/prd/implementation-status.md
git commit -m "Record validation results and update implementation status for lesson progress UI"
```
