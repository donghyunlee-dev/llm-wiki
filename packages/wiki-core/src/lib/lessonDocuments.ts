import type { WikiDocument } from "./wikiDocuments";

export function listLessonDocumentsFrom(documents: WikiDocument[]): WikiDocument[] {
  const lessons = documents.filter((document) => document.metadata.docType === "lesson");
  const lessonIds = new Set(lessons.map((lesson) => lesson.id));
  const referencedIds = new Set(
    lessons.flatMap((lesson) => lesson.metadata.next.filter((id) => lessonIds.has(id))),
  );
  const root = lessons.find((lesson) => !referencedIds.has(lesson.id));

  if (!root) {
    return [];
  }

  const ordered: WikiDocument[] = [];
  const visited = new Set<string>();
  let current: WikiDocument | undefined = root;

  while (current && !visited.has(current.id)) {
    ordered.push(current);
    visited.add(current.id);
    const nextId: string | undefined = current.metadata.next.find(
      (id) => lessonIds.has(id) && !visited.has(id),
    );
    current = nextId ? lessons.find((lesson) => lesson.id === nextId) : undefined;
  }

  return ordered;
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
