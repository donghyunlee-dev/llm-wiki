import { getIndexFirstSearchWikiDocumentsIn, getWikiDocumentHref, type WikiDocument } from "@sfood/wiki-core";

export type SearchDocumentSummary = {
  id: string;
  title: string;
  summary: string;
  href: string;
};

type SearchAnswerLike = {
  policyNotice?: {
    isPolicyRelated: boolean;
    message: string;
  };
  confluenceData?: Array<{
    pageId: string;
  }>;
  recommendedDocuments?: SearchDocumentSummary[];
  relatedDocuments?: SearchDocumentSummary[];
};

export function resolveSearchRecommendedDocuments(
  answer: SearchAnswerLike | null,
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

  const recommendedDocuments = answer?.recommendedDocuments ?? [];

  for (const document of recommendedDocuments) {
    addDocument(document);
  }

  for (const document of fallbackDocuments) {
    addDocument(document);
  }

  return resolvedDocuments.slice(0, 6);
}

export function resolveSearchDocumentSections(
  answer: SearchAnswerLike | null,
  fallbackDocuments: SearchDocumentSummary[],
) {
  // 서버가 relatedDocuments를 명시적으로 보내면 그대로 사용 (추천/관련 분리 경로)
  if (answer?.relatedDocuments !== undefined) {
    const recommendedDocuments = answer.recommendedDocuments?.length
      ? answer.recommendedDocuments
      : fallbackDocuments.slice(0, 4);
    return {
      recommendedDocuments,
      relatedDocuments: answer.relatedDocuments,
    };
  }

  // fallback: 이전 방식 (통합 목록을 3/나머지로 분리)
  const allDocuments = resolveSearchRecommendedDocuments(answer, fallbackDocuments);
  const recommendedDocuments = allDocuments.slice(0, 3);
  const relatedDocuments = allDocuments.slice(3);

  return {
    recommendedDocuments,
    relatedDocuments,
  };
}

export function buildFallbackRecommendedDocuments(documents: WikiDocument[], query: string) {
  return getIndexFirstSearchWikiDocumentsIn(documents, query, 6)
    .filter((document) => {
      const dt = document.metadata.docType;
      return dt !== "policy" && dt !== "ops" && dt !== "nav";
    })
    .map((document) => ({
      id: document.id,
      title: document.title,
      summary: document.summary,
      href: getWikiDocumentHref(document) ?? `/search?q=${encodeURIComponent(document.title)}`,
    }));
}
