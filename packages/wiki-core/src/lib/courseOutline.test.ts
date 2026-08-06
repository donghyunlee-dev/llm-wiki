import { describe, expect, it } from "vitest";
import type { LessonPresentationScene } from "./lessonSemanticBlocks";
import type { WikiDocument } from "./wikiDocuments";
import { buildCourseOutline, getGlobalScenePosition } from "./courseOutline";

function presentationScene(overrides: Partial<LessonPresentationScene> = {}): LessonPresentationScene {
  return {
    sceneId: "a",
    anchor: "장면 A",
    type: "concept",
    layout: "visual-split",
    narration: "",
    blocks: [{ order: 1, kind: "explanation", content: "본문" }],
    ...overrides,
  };
}

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
      courseId: "ai-foundation",
      order: 1,
    },
    presentation: {
      schemaVersion: 1,
      lessonId: "lesson-1",
      theme: "ai-foundation",
      scenes: [presentationScene({ sceneId: "a", anchor: "장면 A" })],
    },
    headings: [],
    contentHtml: "<h1>레슨 1</h1>",
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
        metadata: { ...lessonDocument().metadata, courseId: "ai-foundation", order: 1 },
        presentation: {
          schemaVersion: 1,
          lessonId: "lesson-1",
          theme: "ai-foundation",
          scenes: [
            presentationScene({ sceneId: "a", anchor: "장면 A" }),
            presentationScene({ sceneId: "b", anchor: "장면 B" }),
          ],
        },
      }),
      lessonDocument({
        id: "l2",
        slug: "lesson-2",
        title: "레슨 2",
        summary: "두 번째 레슨",
        metadata: { ...lessonDocument().metadata, courseId: "ai-foundation", order: 2 },
        presentation: {
          schemaVersion: 1,
          lessonId: "lesson-2",
          theme: "ai-foundation",
          scenes: [presentationScene({ sceneId: "c", anchor: "장면 C" })],
        },
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

  it("prefers metadata.estimatedMinutes over the scene-count heuristic when present", () => {
    const documents = [
      lessonDocument({ id: "l1", metadata: { ...lessonDocument().metadata, estimatedMinutes: 7 } }),
    ];

    expect(buildCourseOutline(documents).lessons[0].estimatedMinutes).toBe(7);
  });

  it("rounds estimated minutes up to at least 1 when falling back to the heuristic", () => {
    const documents = [lessonDocument({ id: "l1" })];

    expect(buildCourseOutline(documents).lessons[0].estimatedMinutes).toBeGreaterThanOrEqual(1);
  });

  it("includes the chapter when metadata declares one", () => {
    const documents = [lessonDocument({ id: "l1", metadata: { ...lessonDocument().metadata, chapter: "AI 이해의 시작" } })];

    expect(buildCourseOutline(documents).lessons[0].chapter).toBe("AI 이해의 시작");
  });

  it("excludes lessons without lesson.presentation", () => {
    const documents = [lessonDocument({ id: "l1", presentation: undefined })];

    expect(buildCourseOutline(documents).lessons).toEqual([]);
  });
});

describe("getGlobalScenePosition", () => {
  const documents = [
    lessonDocument({
      id: "l1",
      slug: "lesson-1",
      metadata: { ...lessonDocument().metadata, courseId: "ai-foundation", order: 1 },
      presentation: {
        schemaVersion: 1,
        lessonId: "lesson-1",
        theme: "ai-foundation",
        scenes: [
          presentationScene({ sceneId: "a", anchor: "장면 A" }),
          presentationScene({ sceneId: "b", anchor: "장면 B" }),
        ],
      },
    }),
    lessonDocument({
      id: "l2",
      slug: "lesson-2",
      metadata: { ...lessonDocument().metadata, courseId: "ai-foundation", order: 2 },
      presentation: {
        schemaVersion: 1,
        lessonId: "lesson-2",
        theme: "ai-foundation",
        scenes: [presentationScene({ sceneId: "c", anchor: "장면 C" })],
      },
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
