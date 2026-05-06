import { describe, expect, it } from "vitest";
import type { WikiDocument } from "@sfood/wiki-core";
import { buildFallbackRecommendedDocuments, resolveSearchRecommendedDocuments } from "./searchRecommendations";

function document(overrides: Partial<WikiDocument> = {}): WikiDocument {
  return {
    id: "page-1",
    slug: "guide",
    category: "guides",
    title: "Guide",
    summary: "Guide summary",
    updatedAt: "2026-04-30",
    metadata: {
      docType: "tutorial",
      visibility: "public",
      audience: "beginner",
      status: "published",
      prerequisites: [],
      next: [],
      related: [],
    },
    headings: [],
    contentHtml: "<p>Guide</p>",
    ...overrides,
  };
}

describe("searchRecommendations", () => {
  it("prefers pages used in the answer before generic recommendations", () => {
    const docs = [
      document({ id: "page-1", title: "First", slug: "first" }),
      document({ id: "page-2", title: "Second", slug: "second" }),
      document({ id: "page-3", title: "Third", slug: "third" }),
    ];

    const result = resolveSearchRecommendedDocuments(
      {
        confluenceData: [{ pageId: "page-2" }],
        recommendedDocuments: [{ id: "page-3", title: "Third", summary: "Third summary", href: "/guides/third" }],
      },
      docs,
      [],
    );

    expect(result.map((item) => item.id)).toEqual(["page-2", "page-3"]);
  });

  it("builds fallback documents from the indexed search result set", () => {
    const docs = [
      document({ id: "page-1", title: "Codex Guide", slug: "codex-guide" }),
      document({ id: "page-2", title: "Other", slug: "other" }),
    ];

    expect(buildFallbackRecommendedDocuments(docs, "codex")).toEqual([
      {
        id: "page-1",
        title: "Codex Guide",
        summary: "Guide summary",
        href: "/guides/codex-guide",
      },
    ]);
  });
});
