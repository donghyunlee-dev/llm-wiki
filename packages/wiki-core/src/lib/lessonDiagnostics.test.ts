import { describe, expect, it } from "vitest";
import { validateLesson } from "./lessonDiagnostics";
import type { LessonScene } from "./lessonPresentation";

function scene(overrides: Partial<LessonScene> = {}): LessonScene {
  return {
    id: "scene-a",
    title: "장면",
    blocks: [{ kind: "paragraph", html: "본문" }],
    type: "concept",
    layout: "visual-split",
    ...overrides,
  };
}

describe("validateLesson", () => {
  it("returns no diagnostics for a clean lesson", () => {
    expect(validateLesson([scene()])).toEqual([]);
  });

  it("flags a duplicate scene id as an error", () => {
    const diagnostics = validateLesson([scene({ id: "dup" }), scene({ id: "dup" })]);

    expect(diagnostics).toContainEqual(
      expect.objectContaining({ level: "error", code: "duplicate_scene_id" }),
    );
  });

  it("flags an empty scene as an error", () => {
    const diagnostics = validateLesson([scene({ blocks: [] })]);

    expect(diagnostics).toContainEqual(expect.objectContaining({ level: "error", code: "empty_scene" }));
  });

  it("flags a lesson with more than 15 scenes as a warning", () => {
    const scenes = Array.from({ length: 16 }, (_, index) => scene({ id: `scene-${index}` }));

    expect(validateLesson(scenes)).toContainEqual(
      expect.objectContaining({ level: "warning", code: "scene_count_exceeded" }),
    );
  });
});
