import type { SearchDocumentSummary } from "../searchRecommendations";

export type SearchAnswer = {
  answer: string;
  title?: string;
  policyNotice: {
    isPolicyRelated: boolean;
    message: string;
    sources?: Array<{
      id: string;
      title: string;
      href: string;
    }>;
  };
  immediateActions: Array<{
    text: string;
    relatedPageIds: string[];
  }>;
  exampleCommands: string[];
  verificationChecks: Array<{
    text: string;
    relatedPageIds: string[];
  }>;
  cautions: Array<{
    text: string;
    relatedPageIds: string[];
  }>;
  confluenceData: Array<{
    pageId: string;
    title: string;
    quote: string;
  }>;
  unsupportedClaims: string[];
  recommendedDocuments?: SearchDocumentSummary[];
  relatedDocuments?: SearchDocumentSummary[];
};
