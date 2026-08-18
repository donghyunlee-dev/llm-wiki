import type { SearchDocumentSummary } from "../../searchRecommendations";

export type SearchContextSectionKey = "recommended" | "related" | "faq";

export type SearchContextTurnDocuments = Record<SearchContextSectionKey, SearchDocumentSummary[]>;

export type AccumulatedSearchContext = Record<SearchContextSectionKey, SearchDocumentSummary[]>;

const SECTION_KEYS: SearchContextSectionKey[] = ["recommended", "related", "faq"];

export function accumulateSearchContext(
  turns: SearchContextTurnDocuments[],
): AccumulatedSearchContext {
  const result: AccumulatedSearchContext = { recommended: [], related: [], faq: [] };
  const seenIds = new Set<string>();

  for (let i = turns.length - 1; i >= 0; i -= 1) {
    const turn = turns[i];
    for (const sectionKey of SECTION_KEYS) {
      for (const document of turn[sectionKey]) {
        if (seenIds.has(document.id)) continue;
        seenIds.add(document.id);
        result[sectionKey].push(document);
      }
    }
  }

  return result;
}
