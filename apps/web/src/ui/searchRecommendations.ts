import { getIndexFirstSearchWikiDocumentsIn, getWikiDocumentByIdFrom, type WikiDocument } from "@sfood/wiki-core";

export type SearchDocumentSummary = {
  id: string;
  title: string;
  summary: string;
  href: string;
};

type SearchAnswerLike = {
  confluenceData?: Array<{
    pageId: string;
  }>;
  recommendedDocuments?: SearchDocumentSummary[];
  guideDocuments?: SearchDocumentSummary[];
};

export function resolveSearchRecommendedDocuments(
  answer: SearchAnswerLike | null,
  documents: WikiDocument[],
  fallbackDocuments: SearchDocumentSummary[],
) {
  const resolvedDocuments: SearchDocumentSummary[] = [];
  const seen = new Set<string>();

  const addDocument = (document: SearchDocumentSummary | null | undefined) => {
    if (!document || seen.has(document.id)) {
      return;
    }

    seen.add(document.id);
    resolvedDocuments.push(document);
  };

  for (const document of resolveDocumentsFromPageIds(answer?.confluenceData ?? [], documents)) {
    addDocument(document);
  }

  for (const document of answer?.recommendedDocuments ?? []) {
    addDocument(document);
  }

  for (const document of answer?.guideDocuments ?? []) {
    addDocument(document);
  }

  for (const document of fallbackDocuments) {
    addDocument(document);
  }

  return resolvedDocuments.slice(0, 6);
}

export function buildFallbackRecommendedDocuments(documents: WikiDocument[], query: string) {
  return getIndexFirstSearchWikiDocumentsIn(documents, query, 6).map((document) => ({
    id: document.id,
    title: document.title,
    summary: document.summary,
    href: `/${document.category}/${document.slug}`,
  }));
}

function resolveDocumentsFromPageIds(
  items: Array<{ pageId: string }>,
  documents: WikiDocument[],
) {
  return items
    .map((item) => getWikiDocumentByIdFrom(documents, item.pageId))
    .filter((document): document is NonNullable<typeof document> => Boolean(document))
    .map((document) => ({
      id: document.id,
      title: document.title,
      summary: document.summary,
      href: `/${document.category}/${document.slug}`,
    }));
}
