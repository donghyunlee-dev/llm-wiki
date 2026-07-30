# Lesson 진입점, docType 격리, 학습 진도 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Confluence `docType: "lesson"` 콘텐츠를 검색/가이드/페이지에서 완전히 격리하면서, 홈 하단 진입 카드 → `/lesson` 목록 → `/lesson/:slug` 좌우 장면(Scene) 리더로 이어지는 흐름과, 계정 없이도 동작하는 `localStorage` 기반 "이어서 학습하기" 진도 저장을 구현한다.

**Architecture:** `packages/wiki-core`에 `lesson` docType과 순수 함수(레슨 순서 정렬, H2 기준 장면 분리, Expand 매크로 → 대본 추출)를 추가하고, `apps/web`에는 브라우저 전용 `localStorage` 진도 저장소와 홈 진입 섹션·`/lesson` 목록·`/lesson/:slug` 리더 화면을 추가한다. 실제 Confluence 콘텐츠는 아직 없으므로 이번 스코프는 `confluenceSnapshots.ts` 픽스처로 개발한다.

**Tech Stack:** React 19.2 / TypeScript 5.9 / React Router 7 / Tailwind CSS 4 (semantic 토큰 클래스) / Vitest + Testing Library / Playwright MCP(수동 검증)

---

## 참고: 관련 설계 문서

- `docs/superpowers/specs/2026-07-30-lesson-entry-and-progress-design.md` — 이 계획이 구현하는 설계
- `docs/prd/confluence-metadata.md` — `docType` 스키마 원본
- `CLAUDE.md` — Frozen Behavior "Surface별 docType 노출 규칙"

## Task 0: 태스크 문서 워크스페이스 생성

**Files:**
- Create: `docs/tasks/lesson-entry-and-progress/spec.md`
- Create: `docs/tasks/lesson-entry-and-progress/plan.md`
- Create: `docs/tasks/lesson-entry-and-progress/tasks.md`

- [ ] **Step 1: spec.md 작성**

`docs/superpowers/specs/2026-07-30-lesson-entry-and-progress-design.md`의 "2. 범위" 절 내용을 그대로 옮겨 적고 상단에 다음 링크를 남긴다.

```markdown
# Lesson 진입점, docType 격리, 학습 진도 — Spec

전체 설계: `docs/superpowers/specs/2026-07-30-lesson-entry-and-progress-design.md`

(이하 "2. 범위" 절 내용 복사 — 포함/제외 목록)
```

- [ ] **Step 2: plan.md 작성**

```markdown
# Lesson 진입점, docType 격리, 학습 진도 — Plan

구현 계획 원본: `docs/superpowers/plans/2026-07-30-lesson-entry-and-progress.md`

이 파일은 원본 계획 문서를 가리키는 포인터다. 태스크별 진행 상황은 `tasks.md`에서 추적한다.
```

- [ ] **Step 3: tasks.md 작성**

```markdown
# Tasks

- [ ] Task 1: docType 스키마/타입에 lesson 추가 + 격리 회귀 테스트
- [ ] Task 2: 레슨 snapshot 픽스처 추가
- [ ] Task 3: 레슨 순서 정렬 함수(lessonDocuments)
- [ ] Task 4: 장면 분리 + 대본 추출 함수(lessonScenes)
- [ ] Task 5: 브라우저 진도 저장소(lessonProgress)
- [ ] Task 6: 홈 하단 진입 섹션
- [ ] Task 7: `/lesson` 인덱스 페이지
- [ ] Task 8: `/lesson/:slug` 리더 페이지
- [ ] Task 9: 전체 검증(테스트/타입체크/Playwright/Codex) 및 문서화
```

- [ ] **Step 4: Commit**

```bash
git add docs/tasks/lesson-entry-and-progress/
git commit -m "Add task workspace for lesson entry and progress tracking"
```

---

## Task 1: docType 스키마/타입에 `lesson` 추가 + 격리 회귀 테스트

**Files:**
- Modify: `docs/prd/confluence-metadata.md`
- Modify: `CLAUDE.md:66-73` (Surface별 docType 노출 규칙 표)
- Modify: `packages/wiki-core/src/lib/wikiDocuments.ts:15`
- Modify: `packages/wiki-core/src/lib/wikiDocuments.ts:203`
- Modify: `packages/wiki-core/src/lib/confluenceReadModel.ts:13`
- Test: `packages/wiki-core/src/lib/wikiDocuments.test.ts`

- [ ] **Step 1: 문서에 `lesson` docType 추가**

`docs/prd/confluence-metadata.md`의 "docType 허용값" 표에 아래 행을 `ops` 행 다음에 추가:

```markdown
| `lesson` | AI 기초교육 등 좌우 전환형 학습 콘텐츠 — 홈 진입 카드와 `/lesson` 전용 화면에서만 노출 | (비노출 — 별도 Lesson 화면 전용) |
```

"공개 노출 조건" 절 아래 "비노출 처리 규칙"에 새 하위 절 추가:

```markdown
### `docType = lesson`
- 검색 결과, 추천 카드, `guides`/`library`/`faq` 목록에 노출하지 않는다.
- 홈 하단 진입 카드와 `/lesson`, `/lesson/:slug` 화면에서만 노출한다.
- AI 프롬프트 컨텍스트에 포함하지 않는다.
```

- [ ] **Step 2: CLAUDE.md Frozen Behavior 표 갱신**

`CLAUDE.md`의 "Surface별 docType 노출 규칙" 표에 행 추가:

```markdown
| 홈 하단 Lesson 진입 카드 | ❌ | ❌ | 진입 카드 자체는 `lesson` 문서 목록이 1개 이상 있을 때만 노출(개별 레슨 문서 링크 아님) |
| `/lesson`, `/lesson/:slug` | ❌ | ❌ | `lesson` 전용 화면 — `guide`/`page`는 노출하지 않음 |
```

표 아래 설명 문단에 다음 문장 추가:

```markdown
`lesson`은 위 표의 어떤 Surface에도 해당하지 않는 완전히 별도의 비노출 docType이다 — 홈 진입 카드와 `/lesson` 전용 화면에서만 노출된다.
```

- [ ] **Step 3: 실패하는 테스트 작성**

`packages/wiki-core/src/lib/wikiDocuments.test.ts` 파일 끝에 추가 (기존 파일의 import/헬퍼 패턴을 그대로 따른다 — 파일 상단에 이미 `WikiDocument` 빌더 헬퍼가 있으면 재사용, 없으면 아래처럼 인라인으로 작성):

```typescript
describe("lesson docType isolation", () => {
  function lessonDocument(overrides: Partial<WikiDocument> = {}): WikiDocument {
    return {
      id: "lesson-1",
      slug: "ai-first-perspective",
      title: "AI를 이해하는 첫 번째 관점",
      summary: "요약",
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
      contentHtml: "<h1>제목</h1><h2>장면 1</h2><p>본문</p>",
      ...overrides,
    };
  }

  it("getWikiDocumentSection returns null for lesson documents", () => {
    expect(getWikiDocumentSection(lessonDocument())).toBeNull();
  });

  it("getWikiDocumentHref returns null for lesson documents", () => {
    expect(getWikiDocumentHref(lessonDocument())).toBeNull();
  });

  it("excludes lesson documents from search results", () => {
    const results = searchWikiDocumentsIn(
      [lessonDocument({ title: "AI 기초교육 첫 장면", contentHtml: "<p>AI 기초교육 첫 장면 내용</p>" })],
      "AI 기초교육",
    );

    expect(results.guides).toHaveLength(0);
    expect(results.faq).toHaveLength(0);
    expect(results.library).toHaveLength(0);
  });

  it("excludes lesson documents from guides section listing", () => {
    const documents = [lessonDocument(), lessonDocument({ id: "lesson-2", slug: "context-and-memory" })];

    expect(listWikiDocumentsBySectionFrom(documents, "guides")).toHaveLength(0);
  });
});
```

파일 상단 import에 `getWikiDocumentHref`, `listWikiDocumentsBySectionFrom`, `searchWikiDocumentsIn`이 없다면 추가한다.

- [ ] **Step 4: 테스트 실행 — 타입 에러로 실패 확인**

Run: `pnpm --filter @sfood/wiki-core test -- wikiDocuments`
Expected: FAIL — `Type '"lesson"' is not assignable to type '"guide" | "page" | ...'`

- [ ] **Step 5: `WikiDocument`/`RawConfluencePage` 타입에 `lesson` 추가**

`packages/wiki-core/src/lib/wikiDocuments.ts:15`:

```typescript
    docType: "guide" | "page" | "faq" | "library" | "policy" | "nav" | "ops" | "playbook" | "lesson";
```

`packages/wiki-core/src/lib/confluenceReadModel.ts:13`:

```typescript
    docType: "guide" | "page" | "faq" | "library" | "policy" | "nav" | "ops" | "playbook" | "lesson";
```

- [ ] **Step 6: 검색 제외 필터에 `lesson` 명시**

`packages/wiki-core/src/lib/wikiDocuments.ts:203` 부근:

```typescript
  return documents
    .filter(
      (document) =>
        document.metadata.docType !== "ops" &&
        document.metadata.docType !== "policy" &&
        document.metadata.docType !== "playbook" &&
        document.metadata.docType !== "lesson",
    )
```

- [ ] **Step 7: 테스트 재실행 — 통과 확인**

Run: `pnpm --filter @sfood/wiki-core test -- wikiDocuments`
Expected: PASS (신규 4개 테스트 포함 전체 통과)

- [ ] **Step 8: Commit**

```bash
git add docs/prd/confluence-metadata.md CLAUDE.md \
  packages/wiki-core/src/lib/wikiDocuments.ts \
  packages/wiki-core/src/lib/wikiDocuments.test.ts \
  packages/wiki-core/src/lib/confluenceReadModel.ts
git commit -m "Add lesson docType and prove isolation from search/guides/faq/library"
```

---

## Task 2: 레슨 snapshot 픽스처 추가

**Files:**
- Modify: `packages/wiki-core/src/lib/confluenceSnapshots.ts`

- [ ] **Step 1: 레슨 픽스처 2건 추가**

`packages/wiki-core/src/lib/confluenceSnapshots.ts`의 `SNAPSHOTS` 배열 마지막 원소(`common-questions`) 다음, 배열을 닫는 `];` 앞에 추가:

```typescript
  {
    slug: "ai-first-perspective",
    page: {
      id: "96000001",
      title: "AI를 이해하는 첫 번째 관점",
      spaceId: SPACE_ID,
      status: "current",
      version: 1,
      updatedAt: "2026-07-30",
      sourceUrl: `${BASE_URL}/96000001`,
      metadata: {
        docType: "lesson",
        audience: "beginner",
        status: "published",
        prerequisites: [],
        next: ["96000002"],
        related: [],
      },
      bodyHtml: `
        <h1>AI를 이해하는 첫 번째 관점</h1>
        <h2 id="scene-why-different">AI는 왜 다르게 대답할까</h2>
        <p>같은 질문도 상황에 따라 다른 답이 나오는 경험을 다뤄봅니다.</p>
        <ac:structured-macro ac:name="expand"><ac:parameter ac:name="title">대본</ac:parameter><ac:rich-text-body><p>여기서는 학습자에게 "왜 다르게 대답했을까요?"라고 질문을 던지고 잠시 기다립니다.</p></ac:rich-text-body></ac:structured-macro>
        <h2 id="scene-model-prompt">모델과 프롬프트의 관계</h2>
        <p>모델은 고정되어 있지만 프롬프트가 답을 바꾼다는 점을 설명합니다.</p>
      `,
    },
  },
  {
    slug: "context-and-memory",
    page: {
      id: "96000002",
      title: "컨텍스트와 기억의 한계",
      spaceId: SPACE_ID,
      status: "current",
      version: 1,
      updatedAt: "2026-07-30",
      sourceUrl: `${BASE_URL}/96000002`,
      metadata: {
        docType: "lesson",
        audience: "beginner",
        status: "published",
        prerequisites: ["96000001"],
        next: [],
        related: [],
      },
      bodyHtml: `
        <h1>컨텍스트와 기억의 한계</h1>
        <h2 id="scene-memory-question">분명 앞에서 말했는데</h2>
        <p>대화가 길어지면 AI가 앞선 내용을 놓치는 경험을 다뤄봅니다.</p>
        <ac:structured-macro ac:name="expand"><ac:parameter ac:name="title">대본</ac:parameter><ac:rich-text-body><p>학습자에게 "왜 방금 말한 걸 잊어버렸을까요?"라고 물어봅니다.</p></ac:rich-text-body></ac:structured-macro>
        <h2 id="scene-context-window">컨텍스트 창이 가득 차면</h2>
        <p>오래된 정보부터 밀려난다는 점을 설명합니다.</p>
      `,
    },
  },
];
```

주의: 이 추가로 인해 기존 `];`가 중복되지 않도록, 파일의 기존 마지막 `];`를 대체하는 형태로 편집한다(Edit 도구 사용 시 `old_string`에 `common-questions` 항목 전체 + 닫는 `];`를 포함해 교체).

- [ ] **Step 2: 타입체크로 픽스처 유효성 확인**

Run: `pnpm --filter @sfood/wiki-core typecheck`
Expected: PASS (별도 테스트 없이 타입체크로 스키마 정합성만 우선 확인 — 파싱/격리 테스트는 Task 3, 4에서 이 픽스처를 사용해 작성)

- [ ] **Step 3: Commit**

```bash
git add packages/wiki-core/src/lib/confluenceSnapshots.ts
git commit -m "Add lesson snapshot fixtures with expand-macro script blocks"
```

---

## Task 3: 레슨 순서 정렬 함수 (`lessonDocuments`)

**Files:**
- Create: `packages/wiki-core/src/lib/lessonDocuments.ts`
- Test: `packages/wiki-core/src/lib/lessonDocuments.test.ts`
- Modify: `packages/wiki-core/src/index.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`packages/wiki-core/src/lib/lessonDocuments.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import type { WikiDocument } from "./wikiDocuments";
import {
  getLessonDocumentFrom,
  getNextLessonSlugFrom,
  listLessonDocumentsFrom,
} from "./lessonDocuments";

function lessonDocument(overrides: Partial<WikiDocument> = {}): WikiDocument {
  return {
    id: "lesson-1",
    slug: "lesson-1",
    title: "레슨 1",
    summary: "요약",
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
    contentHtml: "<h1>레슨 1</h1>",
    ...overrides,
  };
}

describe("listLessonDocumentsFrom", () => {
  it("orders lessons by following the next chain from the root lesson", () => {
    const documents = [
      lessonDocument({ id: "l2", slug: "lesson-2", metadata: { ...lessonDocument().metadata, next: ["l3"] } }),
      lessonDocument({ id: "l1", slug: "lesson-1", metadata: { ...lessonDocument().metadata, next: ["l2"] } }),
      lessonDocument({ id: "l3", slug: "lesson-3", metadata: { ...lessonDocument().metadata, next: [] } }),
    ];

    expect(listLessonDocumentsFrom(documents).map((lesson) => lesson.id)).toEqual(["l1", "l2", "l3"]);
  });

  it("excludes non-lesson documents", () => {
    const documents = [
      lessonDocument({ id: "l1" }),
      lessonDocument({ id: "g1", metadata: { ...lessonDocument().metadata, docType: "guide" } }),
    ];

    expect(listLessonDocumentsFrom(documents).map((lesson) => lesson.id)).toEqual(["l1"]);
  });

  it("returns an empty array when there are no lesson documents", () => {
    expect(listLessonDocumentsFrom([])).toEqual([]);
  });
});

describe("getLessonDocumentFrom", () => {
  it("finds a lesson document by slug", () => {
    const documents = [lessonDocument({ id: "l1", slug: "target" })];
    expect(getLessonDocumentFrom(documents, "target")?.id).toBe("l1");
  });

  it("does not match non-lesson documents with the same slug", () => {
    const documents = [
      lessonDocument({ id: "g1", slug: "target", metadata: { ...lessonDocument().metadata, docType: "guide" } }),
    ];
    expect(getLessonDocumentFrom(documents, "target")).toBeUndefined();
  });
});

describe("getNextLessonSlugFrom", () => {
  it("returns the following lesson's slug", () => {
    const documents = [
      lessonDocument({ id: "l1", slug: "lesson-1", metadata: { ...lessonDocument().metadata, next: ["l2"] } }),
      lessonDocument({ id: "l2", slug: "lesson-2" }),
    ];

    expect(getNextLessonSlugFrom(documents, "lesson-1")).toBe("lesson-2");
  });

  it("returns undefined for the last lesson", () => {
    const documents = [lessonDocument({ id: "l1", slug: "lesson-1" })];
    expect(getNextLessonSlugFrom(documents, "lesson-1")).toBeUndefined();
  });
});
```

- [ ] **Step 2: 테스트 실행 — 모듈 없음으로 실패 확인**

Run: `pnpm --filter @sfood/wiki-core test -- lessonDocuments`
Expected: FAIL — `Cannot find module './lessonDocuments'`

- [ ] **Step 3: 구현**

`packages/wiki-core/src/lib/lessonDocuments.ts`:

```typescript
import type { WikiDocument } from "./wikiDocuments";

export function listLessonDocumentsFrom(documents: WikiDocument[]): WikiDocument[] {
  const lessons = documents.filter((document) => document.metadata.docType === "lesson");
  const lessonIds = new Set(lessons.map((lesson) => lesson.id));
  const referencedIds = new Set(
    lessons.flatMap((lesson) => lesson.metadata.next.filter((id) => lessonIds.has(id))),
  );
  const root = lessons.find((lesson) => !referencedIds.has(lesson.id));

  if (!root) {
    return [];
  }

  const ordered: WikiDocument[] = [];
  const visited = new Set<string>();
  let current: WikiDocument | undefined = root;

  while (current && !visited.has(current.id)) {
    ordered.push(current);
    visited.add(current.id);
    const nextId = current.metadata.next.find((id) => lessonIds.has(id) && !visited.has(id));
    current = nextId ? lessons.find((lesson) => lesson.id === nextId) : undefined;
  }

  return ordered;
}

export function getLessonDocumentFrom(
  documents: WikiDocument[],
  slug: string,
): WikiDocument | undefined {
  return documents.find(
    (document) => document.metadata.docType === "lesson" && document.slug === slug,
  );
}

export function getNextLessonSlugFrom(
  documents: WikiDocument[],
  currentSlug: string,
): string | undefined {
  const ordered = listLessonDocumentsFrom(documents);
  const index = ordered.findIndex((lesson) => lesson.slug === currentSlug);

  if (index === -1) {
    return undefined;
  }

  return ordered[index + 1]?.slug;
}
```

- [ ] **Step 4: 테스트 재실행 — 통과 확인**

Run: `pnpm --filter @sfood/wiki-core test -- lessonDocuments`
Expected: PASS

- [ ] **Step 5: 패키지 공개 export에 추가**

`packages/wiki-core/src/index.ts`에 추가:

```typescript
export * from "./lib/lessonDocuments";
```

- [ ] **Step 6: Commit**

```bash
git add packages/wiki-core/src/lib/lessonDocuments.ts \
  packages/wiki-core/src/lib/lessonDocuments.test.ts \
  packages/wiki-core/src/index.ts
git commit -m "Add lesson ordering helpers (list/get/next) based on the next chain"
```

---

## Task 4: 장면 분리 + 대본 추출 함수 (`lessonScenes`)

**Files:**
- Create: `packages/wiki-core/src/lib/lessonScenes.ts`
- Test: `packages/wiki-core/src/lib/lessonScenes.test.ts`
- Modify: `packages/wiki-core/src/index.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`packages/wiki-core/src/lib/lessonScenes.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { splitLessonContentIntoScenes } from "./lessonScenes";

describe("splitLessonContentIntoScenes", () => {
  it("splits content into one scene per H2 heading", () => {
    const html = `
      <h1>레슨 제목</h1>
      <h2 id="scene-a">첫 번째 장면</h2>
      <p>첫 번째 본문</p>
      <h2 id="scene-b">두 번째 장면</h2>
      <p>두 번째 본문</p>
    `;

    const scenes = splitLessonContentIntoScenes(html);

    expect(scenes).toHaveLength(2);
    expect(scenes[0]).toMatchObject({ id: "scene-a", title: "첫 번째 장면" });
    expect(scenes[0].bodyHtml).toContain("첫 번째 본문");
    expect(scenes[0].bodyHtml).not.toContain("두 번째 본문");
    expect(scenes[1]).toMatchObject({ id: "scene-b", title: "두 번째 장면" });
  });

  it("extracts an expand macro as scriptHtml and removes it from bodyHtml", () => {
    const html = `
      <h2 id="scene-a">장면</h2>
      <p>보이는 본문</p>
      <ac:structured-macro ac:name="expand"><ac:parameter ac:name="title">대본</ac:parameter><ac:rich-text-body><p>숨겨진 대본</p></ac:rich-text-body></ac:structured-macro>
    `;

    const scenes = splitLessonContentIntoScenes(html);

    expect(scenes[0].bodyHtml).toContain("보이는 본문");
    expect(scenes[0].bodyHtml).not.toContain("숨겨진 대본");
    expect(scenes[0].bodyHtml).not.toContain("ac:structured-macro");
    expect(scenes[0].scriptHtml).toContain("숨겨진 대본");
  });

  it("omits scriptHtml when a scene has no expand macro", () => {
    const html = `<h2 id="scene-a">장면</h2><p>본문만 있음</p>`;

    const scenes = splitLessonContentIntoScenes(html);

    expect(scenes[0].scriptHtml).toBeUndefined();
  });

  it("falls back to a single scene when there is no H2 heading", () => {
    const html = `<h1>제목만 있는 문서</h1><p>본문</p>`;

    const scenes = splitLessonContentIntoScenes(html);

    expect(scenes).toHaveLength(1);
    expect(scenes[0].bodyHtml).toContain("본문");
  });
});
```

- [ ] **Step 2: 테스트 실행 — 모듈 없음으로 실패 확인**

Run: `pnpm --filter @sfood/wiki-core test -- lessonScenes`
Expected: FAIL — `Cannot find module './lessonScenes'`

- [ ] **Step 3: 구현**

`packages/wiki-core/src/lib/lessonScenes.ts`:

```typescript
import { htmlToPlainText } from "./confluenceReadModel";

export type LessonScene = {
  id: string;
  title: string;
  bodyHtml: string;
  scriptHtml?: string;
};

const H2_PATTERN = /<h2(?:\s+id="([^"]*)")?[^>]*>([\s\S]*?)<\/h2>/gi;
const EXPAND_MACRO_PATTERN =
  /<ac:structured-macro[^>]*ac:name="expand"[^>]*>([\s\S]*?)<\/ac:structured-macro>/gi;
const RICH_TEXT_BODY_PATTERN = /<ac:rich-text-body[^>]*>([\s\S]*?)<\/ac:rich-text-body>/i;

export function splitLessonContentIntoScenes(contentHtml: string): LessonScene[] {
  const headingMatches = Array.from(contentHtml.matchAll(H2_PATTERN));

  if (headingMatches.length === 0) {
    return [buildScene("scene-1", "학습 내용", contentHtml)];
  }

  return headingMatches.map((match, index) => {
    const id = match[1] || `scene-${index + 1}`;
    const title = htmlToPlainText(match[2]);
    const bodyStart = (match.index ?? 0) + match[0].length;
    const bodyEnd = headingMatches[index + 1]?.index ?? contentHtml.length;
    const rawBody = contentHtml.slice(bodyStart, bodyEnd);

    return buildScene(id, title, rawBody);
  });
}

function buildScene(id: string, title: string, rawBody: string): LessonScene {
  let scriptHtml: string | undefined;

  const bodyHtml = rawBody
    .replace(EXPAND_MACRO_PATTERN, (_match, inner: string) => {
      scriptHtml = inner.match(RICH_TEXT_BODY_PATTERN)?.[1]?.trim();
      return "";
    })
    .trim();

  return scriptHtml ? { id, title, bodyHtml, scriptHtml } : { id, title, bodyHtml };
}
```

- [ ] **Step 4: 테스트 재실행 — 통과 확인**

Run: `pnpm --filter @sfood/wiki-core test -- lessonScenes`
Expected: PASS

- [ ] **Step 5: 패키지 공개 export에 추가**

`packages/wiki-core/src/index.ts`에 추가:

```typescript
export * from "./lib/lessonScenes";
```

- [ ] **Step 6: 픽스처로 통합 확인**

Run:
```bash
pnpm --filter @sfood/wiki-core exec vitest run -t "lesson" --reporter verbose
```
Expected: Task 1/3/4의 lesson 관련 테스트 전부 PASS (픽스처 자체를 대상으로 한 별도 통합 테스트는 만들지 않는다 — 각 함수의 단위 테스트가 이미 픽스처와 동일한 구조의 입력을 사용하므로 중복 회귀 테스트를 추가하지 않는다).

- [ ] **Step 7: Commit**

```bash
git add packages/wiki-core/src/lib/lessonScenes.ts \
  packages/wiki-core/src/lib/lessonScenes.test.ts \
  packages/wiki-core/src/index.ts
git commit -m "Add H2-based scene splitting with expand-macro script extraction"
```

---

## Task 5: 브라우저 진도 저장소 (`lessonProgress`)

**Files:**
- Create: `apps/web/src/data/lessonProgress.ts`
- Test: `apps/web/src/data/lessonProgress.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`apps/web/src/data/lessonProgress.test.ts`:

```typescript
import { beforeEach, describe, expect, it } from "vitest";
import {
  LESSON_COURSE_ID,
  loadLessonProgress,
  markLessonCompleted,
  markSceneVisited,
} from "./lessonProgress";

describe("lessonProgress", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns null when there is no saved progress", () => {
    expect(loadLessonProgress(LESSON_COURSE_ID)).toBeNull();
  });

  it("saves and restores the last visited scene", () => {
    markSceneVisited(LESSON_COURSE_ID, "lesson-1", 2);

    expect(loadLessonProgress(LESSON_COURSE_ID)).toEqual({
      lastLessonSlug: "lesson-1",
      lastSceneIndex: 2,
      completedLessonSlugs: [],
    });
  });

  it("keeps completed lessons when visiting a scene", () => {
    markLessonCompleted(LESSON_COURSE_ID, "lesson-1");
    markSceneVisited(LESSON_COURSE_ID, "lesson-2", 0);

    expect(loadLessonProgress(LESSON_COURSE_ID)?.completedLessonSlugs).toEqual(["lesson-1"]);
  });

  it("does not duplicate a lesson slug marked completed twice", () => {
    markLessonCompleted(LESSON_COURSE_ID, "lesson-1");
    markLessonCompleted(LESSON_COURSE_ID, "lesson-1");

    expect(loadLessonProgress(LESSON_COURSE_ID)?.completedLessonSlugs).toEqual(["lesson-1"]);
  });

  it("returns null when the saved value is corrupted", () => {
    window.localStorage.setItem(`lesson-progress:${LESSON_COURSE_ID}`, "not-json");

    expect(loadLessonProgress(LESSON_COURSE_ID)).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실행 — 모듈 없음으로 실패 확인**

Run: `pnpm --filter @sfood/web test -- lessonProgress`
Expected: FAIL — `Cannot find module './lessonProgress'`

- [ ] **Step 3: 구현**

`apps/web/src/data/lessonProgress.ts`:

```typescript
export const LESSON_COURSE_ID = "ai-foundation";

export type LessonProgress = {
  lastLessonSlug: string;
  lastSceneIndex: number;
  completedLessonSlugs: string[];
};

function storageKey(courseId: string): string {
  return `lesson-progress:${courseId}`;
}

export function loadLessonProgress(courseId: string): LessonProgress | null {
  try {
    const raw = window.localStorage.getItem(storageKey(courseId));

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<LessonProgress>;

    if (
      typeof parsed.lastLessonSlug !== "string" ||
      typeof parsed.lastSceneIndex !== "number" ||
      !Array.isArray(parsed.completedLessonSlugs)
    ) {
      return null;
    }

    return {
      lastLessonSlug: parsed.lastLessonSlug,
      lastSceneIndex: parsed.lastSceneIndex,
      completedLessonSlugs: parsed.completedLessonSlugs,
    };
  } catch {
    return null;
  }
}

function saveLessonProgress(courseId: string, progress: LessonProgress): void {
  try {
    window.localStorage.setItem(storageKey(courseId), JSON.stringify(progress));
  } catch {
    // Private browsing / quota errors: progress simply isn't persisted this session.
  }
}

export function markSceneVisited(courseId: string, lessonSlug: string, sceneIndex: number): void {
  const existing = loadLessonProgress(courseId);

  saveLessonProgress(courseId, {
    lastLessonSlug: lessonSlug,
    lastSceneIndex: sceneIndex,
    completedLessonSlugs: existing?.completedLessonSlugs ?? [],
  });
}

export function markLessonCompleted(courseId: string, lessonSlug: string): void {
  const existing = loadLessonProgress(courseId);
  const completedLessonSlugs = existing?.completedLessonSlugs ?? [];

  if (completedLessonSlugs.includes(lessonSlug)) {
    return;
  }

  saveLessonProgress(courseId, {
    lastLessonSlug: existing?.lastLessonSlug ?? lessonSlug,
    lastSceneIndex: existing?.lastSceneIndex ?? 0,
    completedLessonSlugs: [...completedLessonSlugs, lessonSlug],
  });
}
```

- [ ] **Step 4: 테스트 재실행 — 통과 확인**

Run: `pnpm --filter @sfood/web test -- lessonProgress`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/data/lessonProgress.ts apps/web/src/data/lessonProgress.test.ts
git commit -m "Add localStorage-backed lesson progress store"
```

---

## Task 6: 홈 하단 진입 섹션

**Files:**
- Modify: `apps/web/src/ui/pages/HomePage.tsx`
- Modify: `apps/web/src/ui/pages/HomePage.test.tsx`
- Modify: `apps/web/src/styles.css`

- [ ] **Step 1: 실패하는 테스트 추가**

`apps/web/src/ui/pages/HomePage.test.tsx`의 기존 `describe("HomePage", ...)` 블록 안, 마지막 `it(...)` 다음에 추가(파일 상단의 `document()` 헬퍼를 그대로 재사용):

```typescript
  it("renders the lesson entry section only when a lesson document exists", () => {
    useWikiDataMock.mockReturnValue({
      documents: [document({ id: "guide-1" })],
      errorMessage: null,
      isLoading: false,
    });

    const withoutLesson = renderToStaticMarkup(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(withoutLesson).not.toContain("교육 시작하기");

    useWikiDataMock.mockReturnValue({
      documents: [
        document({ id: "guide-1" }),
        document({
          id: "lesson-1",
          slug: "ai-first-perspective",
          title: "AI를 이해하는 첫 번째 관점",
          metadata: { ...document().metadata, docType: "lesson" },
        }),
      ],
      errorMessage: null,
      isLoading: false,
    });

    const withLesson = renderToStaticMarkup(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(withLesson).toContain("교육 시작하기");
    expect(withLesson).toContain('href="/lesson"');
  });
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `pnpm --filter @sfood/web test -- HomePage`
Expected: FAIL — "교육 시작하기" 텍스트를 찾을 수 없음

- [ ] **Step 3: `LessonEntrySection` 컴포넌트 추가 및 연결**

`apps/web/src/ui/pages/HomePage.tsx` 상단 import에 `listLessonDocumentsFrom` 추가:

```typescript
import {
  HOME_CONTENT,
  getWikiDocumentHref,
  listLessonDocumentsFrom,
  stripTitleTypePrefix,
  type WikiDocument,
} from "@sfood/wiki-core";
```

`RecommendedGuidesSection` 함수 다음에 새 함수 추가:

```typescript
function LessonEntrySection({ hasLessons }: { hasLessons: boolean }) {
  if (!hasLessons) {
    return null;
  }

  return (
    <section className="home-lesson-section">
      <Link to="/lesson" className="home-lesson-card">
        <span className="home-lesson-card-copy">
          <span className="home-lesson-card-title">AI, 이제 기초부터 이해해 보세요</span>
          <span className="home-lesson-card-description">
            실습 전에 알아야 할 개념을 짧은 장면으로 정리했습니다.
          </span>
        </span>
        <span className="home-lesson-card-button">교육 시작하기 →</span>
      </Link>
    </section>
  );
}
```

`export function HomePage()` 본문을 아래로 교체:

```typescript
export function HomePage() {
  const { documents, isLoading } = useWikiData();

  const featuredGuides = useMemo(() => buildFeaturedGuides(documents), [documents]);
  const hasLessons = useMemo(() => listLessonDocumentsFrom(documents).length > 0, [documents]);

  return (
    <>
      <SearchHero />
      <RecommendedGuidesSection guides={featuredGuides} isLoading={isLoading} />
      <LessonEntrySection hasLessons={hasLessons} />
    </>
  );
}
```

- [ ] **Step 4: 톤에 맞춘 스타일 추가**

`apps/web/src/styles.css`의 `.home-guide-card-arrow { ... }` 블록(약 1852번째 줄) 다음에 추가:

```css
  .home-lesson-section {
    @apply px-5 pb-6 pt-0;
  }

  .home-lesson-card {
    @apply mx-auto flex w-full max-w-4xl items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-panel-border bg-card-bg p-5 no-underline transition hover:border-accent/40 hover:bg-card-hover-bg;
  }

  .home-lesson-card-copy {
    @apply flex flex-col gap-1;
  }

  .home-lesson-card-title {
    @apply text-[15px] font-semibold text-page-fg;
  }

  .home-lesson-card-description {
    @apply text-[13px] leading-5 text-muted-fg;
  }

  .home-lesson-card-button {
    @apply whitespace-nowrap text-[13px] font-semibold text-accent;
  }
```

- [ ] **Step 5: 테스트 재실행 — 통과 확인**

Run: `pnpm --filter @sfood/web test -- HomePage`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/ui/pages/HomePage.tsx apps/web/src/ui/pages/HomePage.test.tsx apps/web/src/styles.css
git commit -m "Add home bottom entry section linking to the lesson area"
```

---

## Task 7: `/lesson` 인덱스 페이지

**Files:**
- Create: `apps/web/src/ui/pages/LessonIndexPage.tsx`
- Test: `apps/web/src/ui/pages/LessonIndexPage.test.tsx`
- Modify: `apps/web/src/router.tsx`
- Modify: `apps/web/src/styles.css`

- [ ] **Step 1: 실패하는 테스트 작성**

`apps/web/src/ui/pages/LessonIndexPage.test.tsx`:

```typescript
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
    summary: "요약",
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
    contentHtml: "<h2>장면</h2><p>본문</p>",
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

  it("shows a start button and lists lessons in order when there is no saved progress", () => {
    useWikiDataMock.mockReturnValue({
      documents: [
        lessonDocument({ id: "lesson-1", slug: "ai-first-perspective", metadata: { ...lessonDocument().metadata, next: ["lesson-2"] } }),
        lessonDocument({ id: "lesson-2", slug: "context-and-memory", title: "컨텍스트와 기억의 한계", metadata: { ...lessonDocument().metadata, next: [] } }),
      ],
      errorMessage: null,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <LessonIndexPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("학습 시작하기")).toBeInTheDocument();
    expect(screen.getByText("AI를 이해하는 첫 번째 관점")).toBeInTheDocument();
    expect(screen.getByText("컨텍스트와 기억의 한계")).toBeInTheDocument();
  });

  it("shows a continue button when progress is saved", () => {
    window.localStorage.setItem(
      `lesson-progress:${LESSON_COURSE_ID}`,
      JSON.stringify({
        lastLessonSlug: "ai-first-perspective",
        lastSceneIndex: 1,
        completedLessonSlugs: [],
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
Expected: FAIL — `Cannot find module './LessonIndexPage'`

- [ ] **Step 3: 구현**

`apps/web/src/ui/pages/LessonIndexPage.tsx`:

```typescript
import { listLessonDocumentsFrom, stripTitleTypePrefix } from "@sfood/wiki-core";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useWikiData } from "../../data/WikiDataProvider";
import { LESSON_COURSE_ID, loadLessonProgress } from "../../data/lessonProgress";
import { WikiStatePanel } from "./WikiStatePanel";

export function LessonIndexPage() {
  const { documents, errorMessage, isLoading } = useWikiData();
  const lessons = useMemo(() => listLessonDocumentsFrom(documents), [documents]);
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
        <Link to={entryHref} className="lesson-index-primary-button">
          {continueLesson ? "이어서 학습하기" : "학습 시작하기"}
        </Link>
      </header>

      <ol className="lesson-index-list">
        {lessons.map((lesson) => (
          <li key={lesson.id} className="lesson-index-list-item">
            <Link to={`/lesson/${lesson.slug}`} className="lesson-index-list-link">
              <span className="lesson-index-list-title">{stripTitleTypePrefix(lesson.title)}</span>
              {progress?.completedLessonSlugs.includes(lesson.slug) ? (
                <span className="lesson-index-list-status">완료</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

- [ ] **Step 4: 스타일 추가**

`apps/web/src/styles.css`의 Task 6에서 추가한 `.home-lesson-card-button` 블록 다음에 추가:

```css
  .lesson-index-shell {
    @apply mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10;
  }

  .lesson-index-header {
    @apply flex flex-col gap-3;
  }

  .lesson-index-title {
    @apply text-[22px] font-semibold text-page-fg;
  }

  .lesson-index-subtitle {
    @apply text-[14px] leading-6 text-muted-fg;
  }

  .lesson-index-primary-button {
    @apply mt-2 inline-flex w-fit items-center rounded-[var(--radius-lg)] bg-accent px-4 py-2 text-[13px] font-semibold text-white no-underline transition hover:opacity-90;
  }

  .lesson-index-list {
    @apply flex flex-col gap-2;
  }

  .lesson-index-list-item {
    @apply list-none;
  }

  .lesson-index-list-link {
    @apply flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-panel-border bg-card-bg px-4 py-3 no-underline transition hover:border-accent/40 hover:bg-card-hover-bg;
  }

  .lesson-index-list-title {
    @apply text-[14px] font-medium text-page-fg;
  }

  .lesson-index-list-status {
    @apply text-[12px] font-semibold text-muted-fg;
  }
```

- [ ] **Step 5: 라우터에 `/lesson` 등록**

`apps/web/src/router.tsx`의 import에 추가:

```typescript
import { LessonIndexPage } from "./ui/pages/LessonIndexPage";
```

`CardLayout` children 배열(`{ path: "faq", element: <FaqPage /> }` 다음)에 추가:

```typescript
          { path: "lesson", element: <LessonIndexPage /> },
```

- [ ] **Step 6: 테스트 재실행 — 통과 확인**

Run: `pnpm --filter @sfood/web test -- LessonIndexPage`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/ui/pages/LessonIndexPage.tsx \
  apps/web/src/ui/pages/LessonIndexPage.test.tsx \
  apps/web/src/router.tsx apps/web/src/styles.css
git commit -m "Add /lesson index page with continue/start entry button"
```

---

## Task 8: `/lesson/:slug` 리더 페이지

**Files:**
- Create: `apps/web/src/ui/pages/LessonReaderPage.tsx`
- Test: `apps/web/src/ui/pages/LessonReaderPage.test.tsx`
- Modify: `apps/web/src/router.tsx`
- Modify: `apps/web/src/styles.css`

- [ ] **Step 1: 실패하는 테스트 작성**

`apps/web/src/ui/pages/LessonReaderPage.test.tsx`:

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { WikiDocument } from "@sfood/wiki-core";
import { LessonReaderPage } from "./LessonReaderPage";
import { LESSON_COURSE_ID } from "../../data/lessonProgress";

const useWikiDataMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("../../data/WikiDataProvider", () => ({
  useWikiData: () => useWikiDataMock(),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useParams: () => ({ slug: "ai-first-perspective" }),
    useNavigate: () => navigateMock,
    useSearchParams: () => [new URLSearchParams()],
  };
});

function lessonDocument(): WikiDocument {
  return {
    id: "lesson-1",
    slug: "ai-first-perspective",
    title: "AI를 이해하는 첫 번째 관점",
    summary: "요약",
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
    contentHtml: `
      <h2 id="scene-a">첫 번째 장면</h2>
      <p>첫 번째 본문</p>
      <ac:structured-macro ac:name="expand"><ac:rich-text-body><p>숨겨진 대본</p></ac:rich-text-body></ac:structured-macro>
      <h2 id="scene-b">두 번째 장면</h2>
      <p>두 번째 본문</p>
    `,
  };
}

describe("LessonReaderPage", () => {
  beforeEach(() => {
    useWikiDataMock.mockReset();
    navigateMock.mockReset();
    window.localStorage.clear();
    useWikiDataMock.mockReturnValue({
      documents: [lessonDocument()],
      errorMessage: null,
      isLoading: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("shows the first scene and position indicator on load", () => {
    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("첫 번째 장면")).toBeInTheDocument();
    expect(screen.getByText("첫 번째 본문")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("moves to the next scene when the next button is clicked", () => {
    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("다음"));

    expect(screen.getByText("두 번째 장면")).toBeInTheDocument();
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });

  it("moves to the next scene on ArrowRight and back on ArrowLeft", () => {
    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText("두 번째 장면")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByText("첫 번째 장면")).toBeInTheDocument();
  });

  it("toggles the hidden script for the current scene", () => {
    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    expect(screen.queryByText("숨겨진 대본")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("대본 보기"));
    expect(screen.getByText("숨겨진 대본")).toBeInTheDocument();

    fireEvent.click(screen.getByText("대본 숨기기"));
    expect(screen.queryByText("숨겨진 대본")).not.toBeInTheDocument();
  });

  it("saves progress and navigates to the lesson index after the last scene", () => {
    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("다음"));
    fireEvent.click(screen.getByText("레슨 완료"));

    expect(navigateMock).toHaveBeenCalledWith("/lesson");

    const saved = JSON.parse(window.localStorage.getItem(`lesson-progress:${LESSON_COURSE_ID}`) ?? "{}");
    expect(saved.completedLessonSlugs).toContain("ai-first-perspective");
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `pnpm --filter @sfood/web test -- LessonReaderPage`
Expected: FAIL — `Cannot find module './LessonReaderPage'`

- [ ] **Step 3: 구현**

`apps/web/src/ui/pages/LessonReaderPage.tsx`:

```typescript
import {
  getLessonDocumentFrom,
  getNextLessonSlugFrom,
  splitLessonContentIntoScenes,
  stripTitleTypePrefix,
} from "@sfood/wiki-core";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useWikiData } from "../../data/WikiDataProvider";
import { LESSON_COURSE_ID, markLessonCompleted, markSceneVisited } from "../../data/lessonProgress";
import { WikiStatePanel } from "./WikiStatePanel";

function clampSceneIndex(index: number, sceneCount: number): number {
  if (sceneCount === 0) {
    return 0;
  }

  return Math.min(Math.max(index, 0), sceneCount - 1);
}

export function LessonReaderPage() {
  const params = useParams();
  const slug = params.slug ?? "";
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { documents, errorMessage, isLoading } = useWikiData();

  const lesson = getLessonDocumentFrom(documents, slug);
  const scenes = useMemo(
    () => (lesson ? splitLessonContentIntoScenes(lesson.contentHtml) : []),
    [lesson],
  );

  const [sceneIndex, setSceneIndex] = useState(() =>
    clampSceneIndex(Number(searchParams.get("scene") ?? 0) || 0, scenes.length),
  );
  const [scriptVisible, setScriptVisible] = useState(false);

  useEffect(() => {
    setScriptVisible(false);
  }, [sceneIndex]);

  useEffect(() => {
    if (lesson) {
      markSceneVisited(LESSON_COURSE_ID, lesson.slug, sceneIndex);
    }
  }, [lesson, sceneIndex]);

  const isFirstScene = sceneIndex === 0;
  const isLastScene = sceneIndex === scenes.length - 1;

  function goPrevious() {
    if (!isFirstScene) {
      setSceneIndex((current) => current - 1);
    }
  }

  function goNext() {
    if (!lesson) {
      return;
    }

    if (!isLastScene) {
      setSceneIndex((current) => current + 1);
      return;
    }

    markLessonCompleted(LESSON_COURSE_ID, lesson.slug);
    const nextSlug = getNextLessonSlugFrom(documents, lesson.slug);
    navigate(nextSlug ? `/lesson/${nextSlug}` : "/lesson");
  }

  // Intentionally re-registered every render (no dependency array) so the handler always closes
  // over the current goNext/goPrevious/scenes — the listener add/remove cost is negligible here.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;

      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) {
        return;
      }

      if (event.key === "ArrowRight") {
        goNext();
      } else if (event.key === "ArrowLeft") {
        goPrevious();
      } else if (event.key === "Home") {
        setSceneIndex(0);
      } else if (event.key === "End") {
        setSceneIndex(scenes.length - 1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  if (isLoading) {
    return <WikiStatePanel title="불러오는 중" body="교육 콘텐츠를 불러오고 있습니다." />;
  }

  if (errorMessage || !lesson || scenes.length === 0) {
    return (
      <WikiStatePanel
        title="레슨을 찾을 수 없습니다"
        body="교육 목록으로 돌아가 다른 레슨을 선택해 주세요."
        tone="error"
      />
    );
  }

  const scene = scenes[sceneIndex];

  return (
    <section className="lesson-reader-shell">
      <header className="lesson-reader-header">
        <Link to="/lesson" className="lesson-reader-back-link">
          ← 교육 목록
        </Link>
        <span className="lesson-reader-position">
          {sceneIndex + 1} / {scenes.length}
        </span>
      </header>

      <div className="lesson-reader-stage">
        <h1 className="lesson-reader-scene-title">{stripTitleTypePrefix(scene.title)}</h1>
        <div className="lesson-reader-scene-body" dangerouslySetInnerHTML={{ __html: scene.bodyHtml }} />

        {scene.scriptHtml ? (
          <div className="lesson-reader-script">
            <button
              type="button"
              className="lesson-reader-script-toggle"
              onClick={() => setScriptVisible((visible) => !visible)}
              aria-expanded={scriptVisible}
            >
              {scriptVisible ? "대본 숨기기" : "대본 보기"}
            </button>
            {scriptVisible ? (
              <div
                className="lesson-reader-script-body"
                dangerouslySetInnerHTML={{ __html: scene.scriptHtml }}
              />
            ) : null}
          </div>
        ) : null}
      </div>

      <footer className="lesson-reader-controls">
        <button
          type="button"
          className="lesson-reader-nav-button"
          onClick={goPrevious}
          disabled={isFirstScene}
        >
          이전
        </button>
        <button
          type="button"
          className="lesson-reader-nav-button lesson-reader-nav-button-primary"
          onClick={goNext}
        >
          {isLastScene ? "레슨 완료" : "다음"}
        </button>
      </footer>
    </section>
  );
}
```

- [ ] **Step 4: 스타일 추가**

`apps/web/src/styles.css`의 Task 7에서 추가한 `.lesson-index-list-status` 블록 다음에 추가:

```css
  .lesson-reader-shell {
    @apply mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-3xl flex-col justify-between gap-8 px-5 py-8;
  }

  .lesson-reader-header {
    @apply flex items-center justify-between text-[13px] text-muted-fg;
  }

  .lesson-reader-back-link {
    @apply text-muted-fg no-underline hover:text-page-fg;
  }

  .lesson-reader-position {
    @apply font-medium;
  }

  .lesson-reader-stage {
    @apply flex flex-1 flex-col gap-4;
  }

  .lesson-reader-scene-title {
    @apply text-[22px] font-semibold text-page-fg;
  }

  .lesson-reader-scene-body {
    @apply text-[15px] leading-7 text-page-fg;
  }

  .lesson-reader-script {
    @apply mt-2 flex flex-col items-start gap-2;
  }

  .lesson-reader-script-toggle {
    @apply rounded-[var(--radius-lg)] border border-panel-border bg-card-bg px-3 py-1.5 text-[12px] font-semibold text-muted-fg transition hover:border-accent/40 hover:text-page-fg;
  }

  .lesson-reader-script-body {
    @apply rounded-[var(--radius-lg)] bg-card-bg px-4 py-3 text-[13px] leading-6 text-muted-fg;
  }

  .lesson-reader-controls {
    @apply flex items-center justify-between gap-3;
  }

  .lesson-reader-nav-button {
    @apply rounded-[var(--radius-lg)] border border-panel-border bg-card-bg px-4 py-2 text-[13px] font-semibold text-page-fg transition hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-40;
  }

  .lesson-reader-nav-button-primary {
    @apply border-transparent bg-accent text-white hover:opacity-90;
  }
```

- [ ] **Step 5: 라우터에 `/lesson/:slug` 등록**

`apps/web/src/router.tsx`의 import에 추가:

```typescript
import { LessonReaderPage } from "./ui/pages/LessonReaderPage";
```

최상위 `AppLayout` children 배열에서 `{ path: "faq/:slug", element: <ArticlePage section="faq" /> },` 다음(=`CardLayout` 블록 이전)에 추가:

```typescript
      { path: "lesson/:slug", element: <LessonReaderPage /> },
```

- [ ] **Step 6: 테스트 재실행 — 통과 확인**

Run: `pnpm --filter @sfood/web test -- LessonReaderPage`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/ui/pages/LessonReaderPage.tsx \
  apps/web/src/ui/pages/LessonReaderPage.test.tsx \
  apps/web/src/router.tsx apps/web/src/styles.css
git commit -m "Add /lesson/:slug scene reader with keyboard nav and script toggle"
```

---

## Task 9: 전체 검증 및 문서화

**Files:**
- Modify: `docs/tasks/lesson-entry-and-progress/test-result.md` (신규 작성)
- Modify: `docs/tasks/lesson-entry-and-progress/result.md` (신규 작성)
- Modify: `docs/prd/implementation-status.md`

- [ ] **Step 1: 전체 테스트/타입체크 실행**

Run:
```bash
pnpm -r typecheck
pnpm -r test
```
Expected: 전체 PASS. 실패 시 원인을 해결한 뒤 재실행.

- [ ] **Step 2: 빌드 확인**

Run: `pnpm --filter @sfood/web build`
Expected: PASS

- [ ] **Step 3: Playwright 실사용 검증**

Playwright MCP로 dev 서버를 띄우고 아래를 라이트/다크 × 데스크톱(1280px)/모바일(390px) 조합으로 확인한다.

- 홈 하단 진입 카드가 실제로 보이고 문구가 잘리거나 겹치지 않는지, 텍스트와 버튼 크기 비율이 다른 홈 카드들과 어색하지 않은지.
- `/lesson` 인덱스에서 "학습 시작하기"/"이어서 학습하기" 버튼 조건부 노출, 레슨 목록 클릭 이동.
- `/lesson/:slug`에서 방향키(→/←)와 버튼으로 장면 전환이 끊김 없이 자연스러운지, 전환 후 포커스/스크롤 위치가 어색하지 않은지.
- "대본 보기" 토글 클릭 시 레이아웃이 튀지 않고 자연스럽게 나타나는지, 대본 텍스트와 버튼의 크기 비율이 본문과 어울리는지.
- 새로고침 후 "이어서 학습하기"가 저장된 위치로 정확히 이동하는지.
- 검색(`/search`)과 `/guides`, `/faq`, `/library`, 홈 추천 가이드 어디에도 레슨 문서(`AI를 이해하는 첫 번째 관점`, `컨텍스트와 기억의 한계`)가 노출되지 않는지 직접 화면에서 확인.

문제가 발견되면 코드 추정으로 끝내지 않고 실제 화면을 다시 열어 재확인한 뒤 수정한다.

- [ ] **Step 4: Codex 크리티컬 리뷰**

전체 diff를 Codex에 전달해 크리티컬 리뷰를 받는다. 발견된 이슈는 즉시 수정하고 재검증한다.

- [ ] **Step 5: `test-result.md` 작성**

`docs/tasks/lesson-entry-and-progress/test-result.md`에 아래 항목을 실제 실행 결과로 채운다(placeholder 없이 실제 pass/fail 수치와 발견 사항 기록):

```markdown
# Test Result

## 실행한 명령과 결과
- `pnpm -r typecheck`: (결과)
- `pnpm -r test`: (결과, 통과 개수)
- `pnpm --filter @sfood/web build`: (결과)

## Playwright 실사용 검증
- (각 확인 항목별 결과와 스크린샷 근거)

## Codex 크리티컬 리뷰
- (발견 사항과 조치)

## 스킵한 검증
- (있다면 사유 명시, 없으면 "없음")
```

- [ ] **Step 6: `result.md` 작성**

`docs/tasks/lesson-entry-and-progress/result.md`에 배포된 범위 요약, 결정 사항, 남은 갭(다중 course, Motion/Compiler 등 후속 범위)을 기록한다.

- [ ] **Step 7: `implementation-status.md` 갱신**

`docs/prd/implementation-status.md`의 "Latest Completed Work" 최상단에 이번 작업 항목을 추가(기존 항목과 동일한 형식 — 날짜, 배경, 구현, 검증, 태스크 문서 경로).

- [ ] **Step 8: Commit**

```bash
git add docs/tasks/lesson-entry-and-progress/test-result.md \
  docs/tasks/lesson-entry-and-progress/result.md \
  docs/prd/implementation-status.md
git commit -m "Record validation results and update implementation status for lesson entry work"
```
