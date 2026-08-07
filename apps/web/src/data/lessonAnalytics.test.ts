import { describe, expect, it, vi } from "vitest";
import { logLessonEvent } from "./lessonAnalytics";

describe("logLessonEvent", () => {
  it("logs the event name and payload without throwing", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});

    logLessonEvent("scene_view", { lessonSlug: "a", sceneId: "scene-1", sceneIndex: 0 });

    expect(spy).toHaveBeenCalledWith("[lesson_event] scene_view", {
      lessonSlug: "a",
      sceneId: "scene-1",
      sceneIndex: 0,
    });

    spy.mockRestore();
  });

  it("never receives raw lesson content in the payload (only ids/counts)", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});

    logLessonEvent("lesson_load_success", { slug: "context-and-memory", sceneCount: 5 });

    const [, payload] = spy.mock.calls[0];
    expect(Object.values(payload as Record<string, unknown>).every((value) => typeof value !== "object")).toBe(true);

    spy.mockRestore();
  });
});
