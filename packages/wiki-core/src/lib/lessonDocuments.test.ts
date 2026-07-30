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
