export const LESSON_COURSE_ID = "ai-foundation";

export type LessonProgress = {
  lastLessonSlug: string;
  lastSceneIndex: number;
  completedLessonSlugs: string[];
};

function storageKey(courseId: string): string {
  return `lesson-progress:${courseId}`;
}

export function loadLessonProgress(courseId: string): LessonProgress | null {
  try {
    const raw = window.localStorage.getItem(storageKey(courseId));

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<LessonProgress>;

    if (
      typeof parsed.lastLessonSlug !== "string" ||
      typeof parsed.lastSceneIndex !== "number" ||
      !Array.isArray(parsed.completedLessonSlugs)
    ) {
      return null;
    }

    return {
      lastLessonSlug: parsed.lastLessonSlug,
      lastSceneIndex: parsed.lastSceneIndex,
      completedLessonSlugs: parsed.completedLessonSlugs,
    };
  } catch {
    return null;
  }
}

function saveLessonProgress(courseId: string, progress: LessonProgress): void {
  try {
    window.localStorage.setItem(storageKey(courseId), JSON.stringify(progress));
  } catch {
    // Private browsing / quota errors: progress simply isn't persisted this session.
  }
}

export function markSceneVisited(courseId: string, lessonSlug: string, sceneIndex: number): void {
  const existing = loadLessonProgress(courseId);

  saveLessonProgress(courseId, {
    lastLessonSlug: lessonSlug,
    lastSceneIndex: sceneIndex,
    completedLessonSlugs: existing?.completedLessonSlugs ?? [],
  });
}

export function markLessonCompleted(courseId: string, lessonSlug: string): void {
  const existing = loadLessonProgress(courseId);
  const completedLessonSlugs = existing?.completedLessonSlugs ?? [];

  if (completedLessonSlugs.includes(lessonSlug)) {
    return;
  }

  saveLessonProgress(courseId, {
    lastLessonSlug: existing?.lastLessonSlug ?? lessonSlug,
    lastSceneIndex: existing?.lastSceneIndex ?? 0,
    completedLessonSlugs: [...completedLessonSlugs, lessonSlug],
  });
}
