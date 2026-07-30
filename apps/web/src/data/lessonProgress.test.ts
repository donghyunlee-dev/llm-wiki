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
