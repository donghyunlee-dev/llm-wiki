import type { WikiDocument } from "./wikiDocuments";

/**
 * 코스 순서는 `wiki.metadata`에 평탄화된 `courseId`+`order` 필드로만 결정한다(Course Manifest).
 * `lesson.presentation`이 없는 레슨은 실제 학습 콘텐츠가 없으므로 목록에서 제외한다
 * (docs/tasks/lesson-presentation-schema-migration/spec.md의 Edge Cases 결정).
 *
 * 과거에는 `wiki.metadata.next` 체인으로 순서를 정했으나, 실제 저작 콘텐츠 23개 전부가
 * `courseId`/`order`를 쓰고 `next`를 쓰지 않는 것으로 확인되어 그 경로는 제거했다.
 */
export function listLessonDocumentsFrom(documents: WikiDocument[]): WikiDocument[] {
  const lessons = documents.filter(
    (document) => document.metadata.docType === "lesson" && document.presentation,
  );

  const courseGroups = new Map<string, WikiDocument[]>();
  const unordered: WikiDocument[] = [];

  for (const lesson of lessons) {
    if (!lesson.metadata.courseId || lesson.metadata.order === undefined) {
      unordered.push(lesson);
      continue;
    }

    const group = courseGroups.get(lesson.metadata.courseId) ?? [];
    group.push(lesson);
    courseGroups.set(lesson.metadata.courseId, group);
  }

  const orderedCourseLessons = Array.from(courseGroups.values()).flatMap((group) =>
    [...group].sort((a, b) => a.metadata.order! - b.metadata.order!),
  );

  return [...orderedCourseLessons, ...unordered];
}

export function getLessonDocumentFrom(
  documents: WikiDocument[],
  slug: string,
): WikiDocument | undefined {
  return documents.find(
    (document) => document.metadata.docType === "lesson" && document.slug === slug,
  );
}

export function getNextLessonSlugFrom(
  documents: WikiDocument[],
  currentSlug: string,
): string | undefined {
  const ordered = listLessonDocumentsFrom(documents);
  const index = ordered.findIndex((lesson) => lesson.slug === currentSlug);

  if (index === -1) {
    return undefined;
  }

  return ordered[index + 1]?.slug;
}

export function getPreviousLessonSlugFrom(
  documents: WikiDocument[],
  currentSlug: string,
): string | undefined {
  const ordered = listLessonDocumentsFrom(documents);
  const index = ordered.findIndex((lesson) => lesson.slug === currentSlug);

  if (index <= 0) {
    return undefined;
  }

  return ordered[index - 1]?.slug;
}
