import { listLessonDocumentsFrom } from "./lessonDocuments";
import { splitLessonContentIntoScenes } from "./lessonScenes";
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
  scenes: CourseOutlineScene[];
  estimatedMinutes: number;
};

export type CourseOutline = {
  lessons: CourseOutlineLesson[];
  totalScenes: number;
  totalEstimatedMinutes: number;
};

export function buildCourseOutline(documents: WikiDocument[]): CourseOutline {
  const lessons = listLessonDocumentsFrom(documents).map((lesson) => {
    const scenes = splitLessonContentIntoScenes(lesson.contentHtml).map((scene) => ({
      id: scene.id,
      title: scene.title,
    }));
    const estimatedMinutes = Math.max(1, Math.round(scenes.length * MINUTES_PER_SCENE));

    return {
      lessonId: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      summary: lesson.summary,
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
 * Returns null when `lessonSlug` resolves via direct slug lookup elsewhere (e.g.
 * `getLessonDocumentFrom`) but isn't reachable through `listLessonDocumentsFrom`'s
 * `next`-chain traversal — a disconnected chain, a broken `next` link, or a cycle.
 * Callers should hide the overall-progress UI rather than treat this as an error.
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
