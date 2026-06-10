import { getIndexFirstSearchWikiDocumentsIn, getTopSearchWikiDocumentsIn, getWikiDocumentHref, type WikiDocument } from "@sfood/wiki-core";
import { isFullyUnsupportedSearchAnswerState } from "../lib/searchAnswerState";

export type SearchDocumentSummary = {
  id: string;
  title: string;
  summary: string;
  href: string;
  docType?: string;
};

type SearchAnswerLike = {
  policyNotice?: {
    isPolicyRelated: boolean;
    message: string;
  };
  confluenceData?: Array<{
    pageId: string;
  }>;
  unsupportedClaims?: string[];
  recommendedDocuments?: SearchDocumentSummary[];
  relatedDocuments?: SearchDocumentSummary[];
};

export function isFullyUnsupportedSearchAnswer(answer: SearchAnswerLike | null) {
  return isFullyUnsupportedSearchAnswerState(answer);
}

export function resolveSearchRecommendedDocuments(
  answer: SearchAnswerLike | null,
  fallbackDocuments: SearchDocumentSummary[],
) {
  if (isFullyUnsupportedSearchAnswer(answer)) {
    return [];
  }

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
  if (isFullyUnsupportedSearchAnswer(answer)) {
    return { faqDocuments: [], recommendedDocuments: [], relatedDocuments: [] };
  }

  // 서버가 relatedDocuments를 명시적으로 보내면 그대로 사용 (추천/관련 분리 경로)
  if (answer?.relatedDocuments !== undefined) {
    const allRecommended = answer.recommendedDocuments?.length
      ? answer.recommendedDocuments
      : fallbackDocuments.slice(0, 4);
    const faqDocuments = allRecommended.filter((d) => d.docType === "faq");
    const recommendedDocuments = allRecommended.filter((d) => d.docType !== "faq");
    const relatedDocuments = answer.relatedDocuments.filter((d) => d.docType !== "faq");
    return { faqDocuments, recommendedDocuments, relatedDocuments };
  }

  // fallback: 이전 방식 (통합 목록을 3/나머지로 분리)
  const allDocuments = resolveSearchRecommendedDocuments(answer, fallbackDocuments);
  const faqDocuments = allDocuments.filter((d) => d.docType === "faq");
  const nonFaqDocuments = allDocuments.filter((d) => d.docType !== "faq");
  const recommendedDocuments = nonFaqDocuments.slice(0, 3);
  const relatedDocuments = nonFaqDocuments.slice(3);

  return { faqDocuments, recommendedDocuments, relatedDocuments };
}

function isFaqIndexDocument(document: WikiDocument) {
  return /\bindex\b/i.test(document.slug) || /\bindex\b/i.test(document.title);
}

export function buildFaqRecommendations(documents: WikiDocument[], query: string): SearchDocumentSummary[] {
  const faqDocs = documents.filter((d) => d.metadata.docType === "faq" && !isFaqIndexDocument(d));
  return getTopSearchWikiDocumentsIn(faqDocs, query, 3).map((document) => ({
    id: document.id,
    title: document.title,
    summary: document.summary,
    href: getWikiDocumentHref(document) ?? `/search?q=${encodeURIComponent(document.title)}`,
    docType: document.metadata.docType,
  }));
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
      docType: document.metadata.docType,
    }));
}
