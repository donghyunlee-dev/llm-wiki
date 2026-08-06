import { describe, expect, it } from "vitest";
import { readLessonPresentationValue } from "./lessonSemanticBlocks";

function validPresentation(sceneOverrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    lessonId: "today-route",
    theme: "ai-foundation",
    scenes: [
      {
        sceneId: "today-route-main",
        anchor: "오늘의 흐름",
        type: "concept",
        layout: "visual-split",
        narration: "내레이션",
        blocks: [{ order: 1, kind: "hook", content: "질문" }],
        ...sceneOverrides,
      },
    ],
  };
}

describe("readLessonPresentationValue", () => {
  it("parses a valid document", () => {
    const result = readLessonPresentationValue(validPresentation());

    expect(result?.scenes[0]).toMatchObject({ sceneId: "today-route-main", type: "concept", layout: "visual-split" });
  });

  it("rejects a document whose schemaVersion does not match", () => {
    expect(readLessonPresentationValue({ ...validPresentation(), schemaVersion: 2 })).toBeUndefined();
  });

  it("rejects a scene with an unknown type or layout", () => {
    const result = readLessonPresentationValue(validPresentation({ type: "not-a-real-type" }));

    expect(result).toBeUndefined();
  });

  it("sorts blocks by their order field rather than trusting array position", () => {
    const result = readLessonPresentationValue(
      validPresentation({
        blocks: [
          { order: 2, kind: "explanation", content: "두 번째" },
          { order: 1, kind: "hook", content: "첫 번째" },
        ],
      }),
    );

    expect(result?.scenes[0].blocks.map((block) => ("content" in block ? block.content : null))).toEqual([
      "첫 번째",
      "두 번째",
    ]);
  });

  it("drops an interaction whose steps array contains a non-string entry", () => {
    const result = readLessonPresentationValue(
      validPresentation({ interaction: { kind: "step-reveal", steps: ["ok", 42] } }),
    );

    expect(result?.scenes[0].interaction).toBeUndefined();
  });

  it("silently drops an unrecognized block kind instead of throwing", () => {
    const result = readLessonPresentationValue(
      validPresentation({ blocks: [{ order: 1, kind: "future-kind" }] }),
    );

    expect(result?.scenes[0].blocks).toEqual([{ order: 1, kind: "future-kind" }]);
  });

  it("returns undefined for a non-object input instead of throwing", () => {
    expect(readLessonPresentationValue(null)).toBeUndefined();
    expect(readLessonPresentationValue("not an object")).toBeUndefined();
    expect(readLessonPresentationValue(undefined)).toBeUndefined();
  });
});
