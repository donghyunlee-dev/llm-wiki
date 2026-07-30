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
