import { describe, expect, it } from "vitest";
import type { WikiDocument } from "./wikiDocuments";
import {
  getLessonDocumentFrom,
  getNextLessonSlugFrom,
  getPreviousLessonSlugFrom,
  listLessonDocumentsFrom,
} from "./lessonDocuments";

const presentationStub = {
  schemaVersion: 1 as const,
  lessonId: "stub",
  theme: "ai-foundation",
  scenes: [],
};

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
    presentation: presentationStub,
    headings: [],
    contentHtml: "<h1>레슨 1</h1>",
    ...overrides,
  };
}

describe("listLessonDocumentsFrom", () => {
  it("orders lessons with a courseId by ascending order", () => {
    const documents = [
      lessonDocument({ id: "c2", slug: "course-2", metadata: { ...lessonDocument().metadata, courseId: "ai-foundation", order: 2 } }),
      lessonDocument({ id: "c1", slug: "course-1", metadata: { ...lessonDocument().metadata, courseId: "ai-foundation", order: 1 } }),
    ];

    expect(listLessonDocumentsFrom(documents).map((lesson) => lesson.id)).toEqual(["c1", "c2"]);
  });

  it("groups multiple courses separately, each sorted by its own order", () => {
    const documents = [
      lessonDocument({ id: "b1", slug: "b1", metadata: { ...lessonDocument().metadata, courseId: "course-b", order: 1 } }),
      lessonDocument({ id: "a2", slug: "a2", metadata: { ...lessonDocument().metadata, courseId: "course-a", order: 2 } }),
      lessonDocument({ id: "a1", slug: "a1", metadata: { ...lessonDocument().metadata, courseId: "course-a", order: 1 } }),
    ];

    const ids = listLessonDocumentsFrom(documents).map((lesson) => lesson.id);
    expect(ids.indexOf("a1")).toBeLessThan(ids.indexOf("a2"));
    expect(ids).toContain("b1");
  });

  it("excludes non-lesson documents", () => {
    const documents = [
      lessonDocument({ id: "l1" }),
      lessonDocument({ id: "g1", metadata: { ...lessonDocument().metadata, docType: "guide" } }),
    ];

    expect(listLessonDocumentsFrom(documents).map((lesson) => lesson.id)).toEqual(["l1"]);
  });

  it("excludes lessons that have no lesson.presentation content", () => {
    const documents = [
      lessonDocument({ id: "has-presentation" }),
      lessonDocument({ id: "no-presentation", presentation: undefined }),
    ];

    expect(listLessonDocumentsFrom(documents).map((lesson) => lesson.id)).toEqual(["has-presentation"]);
  });

  it("returns an empty array when there are no lesson documents", () => {
    expect(listLessonDocumentsFrom([])).toEqual([]);
  });

  it("places lessons without a courseId/order after the ordered course lessons", () => {
    const documents = [
      lessonDocument({ id: "unordered", metadata: { ...lessonDocument().metadata } }),
      lessonDocument({ id: "c1", slug: "c1", metadata: { ...lessonDocument().metadata, courseId: "ai-foundation", order: 1 } }),
    ];

    expect(listLessonDocumentsFrom(documents).map((lesson) => lesson.id)).toEqual(["c1", "unordered"]);
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
  it("returns the following lesson's slug in courseId/order sequence", () => {
    const documents = [
      lessonDocument({ id: "l1", slug: "lesson-1", metadata: { ...lessonDocument().metadata, courseId: "ai-foundation", order: 1 } }),
      lessonDocument({ id: "l2", slug: "lesson-2", metadata: { ...lessonDocument().metadata, courseId: "ai-foundation", order: 2 } }),
    ];

    expect(getNextLessonSlugFrom(documents, "lesson-1")).toBe("lesson-2");
  });

  it("returns undefined for the last lesson", () => {
    const documents = [lessonDocument({ id: "l1", slug: "lesson-1" })];
    expect(getNextLessonSlugFrom(documents, "lesson-1")).toBeUndefined();
  });
});

describe("getPreviousLessonSlugFrom", () => {
  it("returns the preceding lesson's slug in courseId/order sequence", () => {
    const documents = [
      lessonDocument({ id: "l1", slug: "lesson-1", metadata: { ...lessonDocument().metadata, courseId: "ai-foundation", order: 1 } }),
      lessonDocument({ id: "l2", slug: "lesson-2", metadata: { ...lessonDocument().metadata, courseId: "ai-foundation", order: 2 } }),
    ];

    expect(getPreviousLessonSlugFrom(documents, "lesson-2")).toBe("lesson-1");
  });

  it("returns undefined for the first lesson", () => {
    const documents = [lessonDocument({ id: "l1", slug: "lesson-1" })];
    expect(getPreviousLessonSlugFrom(documents, "lesson-1")).toBeUndefined();
  });

  it("returns undefined when the slug is not found", () => {
    const documents = [lessonDocument({ id: "l1", slug: "lesson-1" })];
    expect(getPreviousLessonSlugFrom(documents, "missing")).toBeUndefined();
  });
});
