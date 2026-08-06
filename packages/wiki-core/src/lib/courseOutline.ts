import { listLessonDocumentsFrom } from "./lessonDocuments";
import { compileLessonPresentationScenes } from "./lessonPresentation";
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
  chapter?: string;
  scenes: CourseOutlineScene[];
  estimatedMinutes: number;
};

export type CourseOutline = {
  lessons: CourseOutlineLesson[];
  totalScenes: number;
  totalEstimatedMinutes: number;
};

export function buildCourseOutline(documents: WikiDocument[]): CourseOutline {
  const lessons = listLessonDocumentsFrom(documents)
    .filter((lesson) => lesson.presentation)
    .map((lesson) => {
      const scenes = compileLessonPresentationScenes(lesson.presentation!).map((scene) => ({
        id: scene.id,
        title: scene.title,
      }));
      const estimatedMinutes =
        lesson.metadata.estimatedMinutes ?? Math.max(1, Math.round(scenes.length * MINUTES_PER_SCENE));

      return {
        lessonId: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        summary: lesson.summary,
        ...(lesson.metadata.chapter ? { chapter: lesson.metadata.chapter } : {}),
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

/**
 * Returns null when `lessonSlug` isn't found in the ordered outline (e.g. the lesson has
 * no `lesson.presentation` and was filtered out by `listLessonDocumentsFrom`). Callers
 * should hide the overall-progress UI rather than treat this as an error.
 */
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
