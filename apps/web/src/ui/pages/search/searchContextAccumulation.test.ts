import { describe, expect, it } from "vitest";
import type { SearchDocumentSummary } from "../../searchRecommendations";
import { accumulateSearchContext } from "./searchContextAccumulation";

function doc(id: string, title = id): SearchDocumentSummary {
  return { id, title, summary: `${title} summary`, href: `/guides/${id}` };
}

describe("accumulateSearchContext", () => {
  it("keeps documents from a single turn in their section, in order", () => {
    const result = accumulateSearchContext([
      { recommended: [doc("a"), doc("b")], related: [doc("c")], faq: [] },
    ]);

    expect(result.recommended.map((d) => d.id)).toEqual(["a", "b"]);
    expect(result.related.map((d) => d.id)).toEqual(["c"]);
    expect(result.faq).toEqual([]);
  });

  it("puts the most recent turn's documents ahead of older turns within a section", () => {
    const result = accumulateSearchContext([
      { recommended: [doc("old-1")], related: [], faq: [] },
      { recommended: [doc("new-1")], related: [], faq: [] },
    ]);

    expect(result.recommended.map((d) => d.id)).toEqual(["new-1", "old-1"]);
  });

  it("deduplicates a document that appears in multiple turns, keeping only the newest occurrence", () => {
    const result = accumulateSearchContext([
      { recommended: [doc("shared")], related: [], faq: [] },
      { recommended: [doc("shared")], related: [], faq: [] },
    ]);

    expect(result.recommended.map((d) => d.id)).toEqual(["shared"]);
  });

  it("reassigns a document to the newest turn's section when its section changed between turns", () => {
    const result = accumulateSearchContext([
      { recommended: [], related: [doc("shared")], faq: [] },
      { recommended: [doc("shared")], related: [], faq: [] },
    ]);

    expect(result.recommended.map((d) => d.id)).toEqual(["shared"]);
    expect(result.related).toEqual([]);
  });

  it("does not let an empty turn erase documents accumulated from earlier turns", () => {
    const result = accumulateSearchContext([
      { recommended: [doc("kept")], related: [], faq: [] },
      { recommended: [], related: [], faq: [] },
    ]);

    expect(result.recommended.map((d) => d.id)).toEqual(["kept"]);
  });
});
