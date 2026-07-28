import { describe, expect, it } from "vitest";
import type { WikiDocument } from "@sfood/wiki-core";
import {
  buildFallbackRecommendedDocuments,
  isFullyUnsupportedSearchAnswer,
  resolveSearchDocumentSections,
  resolveSearchRecommendedDocuments,
} from "./searchRecommendations";

function document(overrides: Partial<WikiDocument> = {}): WikiDocument {
  return {
    id: "page-1",
    slug: "guide",
    title: "Guide",
    summary: "Guide summary",
    updatedAt: "2026-04-30",
    metadata: {
      docType: "guide",
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
  it("uses AI recommended pages before fallback recommendations", () => {
    const result = resolveSearchRecommendedDocuments(
      {
        confluenceData: [{ pageId: "page-3" }],
        recommendedDocuments: [{ id: "page-3", title: "Third", summary: "Third summary", href: "/guides/third" }],
      },
      [{ id: "page-1", title: "First", summary: "First summary", href: "/guides/first" }],
    );

    expect(result.map((item) => item.id)).toEqual(["page-3", "page-1"]);
  });

  it("falls back to generic recommendations only when the answer omits page links", () => {
    const result = resolveSearchRecommendedDocuments(
      {
        confluenceData: [{ pageId: "page-1" }],
        recommendedDocuments: [],
      },
      [
        { id: "page-1", title: "First", summary: "First summary", href: "/guides/first" },
        { id: "page-2", title: "Second", summary: "Second summary", href: "/guides/second" },
      ],
    );

    expect(result.map((item) => item.id)).toEqual(["page-1", "page-2"]);
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
        docType: "guide",
      },
    ]);
  });

  it("splits strong recommended documents from related documents (legacy fallback path)", () => {
    const result = resolveSearchDocumentSections(
      {
        confluenceData: [{ pageId: "page-1" }],
        recommendedDocuments: [
          { id: "page-1", title: "Primary", summary: "Primary summary", href: "/guides/primary" },
        ],
      },
      [
        { id: "page-2", title: "Secondary", summary: "Secondary summary", href: "/guides/secondary" },
        { id: "page-3", title: "Fallback", summary: "Fallback summary", href: "/guides/fallback" },
        { id: "page-4", title: "Related", summary: "Related summary", href: "/guides/related" },
      ],
    );

    expect(result.recommendedDocuments.map((item) => item.id)).toEqual(["page-1", "page-2", "page-3"]);
    expect(result.relatedDocuments.map((item) => item.id)).toEqual(["page-4"]);
  });

  it("uses server-provided relatedDocuments when present (AI-split path)", () => {
    const result = resolveSearchDocumentSections(
      {
        confluenceData: [{ pageId: "page-1" }],
        recommendedDocuments: [
          { id: "page-1", title: "Primary", summary: "Primary summary", href: "/guides/primary" },
          { id: "page-2", title: "Second", summary: "Second summary", href: "/guides/second" },
        ],
        relatedDocuments: [
          { id: "page-3", title: "Related", summary: "Related summary", href: "/guides/related" },
        ],
      },
      [],
    );

    expect(result.recommendedDocuments.map((item) => item.id)).toEqual(["page-1", "page-2"]);
    expect(result.relatedDocuments.map((item) => item.id)).toEqual(["page-3"]);
  });

  it("falls back to fallback documents when server recommendedDocuments is empty in AI-split path", () => {
    const result = resolveSearchDocumentSections(
      {
        confluenceData: [{ pageId: "page-1" }],
        recommendedDocuments: [],
        relatedDocuments: [],
      },
      [
        { id: "page-1", title: "Fallback", summary: "Fallback summary", href: "/guides/fallback" },
        { id: "page-2", title: "Fallback2", summary: "Fallback2 summary", href: "/guides/fallback2" },
      ],
    );

    expect(result.recommendedDocuments.map((item) => item.id)).toEqual(["page-1", "page-2"]);
    expect(result.relatedDocuments).toEqual([]);
  });

  it("suppresses every page section for a fully unsupported answer", () => {
    const answer = {
      confluenceData: [],
      unsupportedClaims: ["claude worktrees"],
      recommendedDocuments: [
        { id: "page-1", title: "Unrelated", summary: "Unrelated summary", href: "/guides/unrelated" },
      ],
      relatedDocuments: [
        { id: "page-2", title: "Also unrelated", summary: "Unrelated summary", href: "/guides/also-unrelated" },
      ],
    };
    const fallbackDocuments = [
      { id: "page-3", title: "Fallback", summary: "Fallback summary", href: "/guides/fallback" },
    ];

    expect(isFullyUnsupportedSearchAnswer(answer)).toBe(true);
    expect(resolveSearchRecommendedDocuments(answer, fallbackDocuments)).toEqual([]);
    expect(resolveSearchDocumentSections(answer, fallbackDocuments)).toEqual({
      faqDocuments: [],
      recommendedDocuments: [],
      relatedDocuments: [],
    });
  });

  it("suppresses every page section when the visible answer says the topic page does not exist", () => {
    const answer = {
      answer: "현재 위키에 해당 주제에 대한 페이지가 없습니다. 관련 가이드가 필요하시면 IT 담당자에게 문의해 주세요.",
      confluenceData: [],
      unsupportedClaims: [],
      recommendedDocuments: [
        { id: "page-1", title: "Unrelated", summary: "Unrelated summary", href: "/guides/unrelated" },
      ],
      relatedDocuments: [
        { id: "page-2", title: "Also unrelated", summary: "Unrelated summary", href: "/guides/also-unrelated" },
      ],
    };

    expect(isFullyUnsupportedSearchAnswer(answer)).toBe(true);
    expect(resolveSearchDocumentSections(answer, [])).toEqual({
      faqDocuments: [],
      recommendedDocuments: [],
      relatedDocuments: [],
    });
  });

  it("keeps page sections for a partially supported answer", () => {
    const answer = {
      confluenceData: [{ pageId: "page-1" }],
      unsupportedClaims: ["one missing detail"],
      recommendedDocuments: [
        { id: "page-1", title: "Supported", summary: "Supported summary", href: "/guides/supported" },
      ],
      relatedDocuments: [],
    };

    expect(isFullyUnsupportedSearchAnswer(answer)).toBe(false);
    expect(resolveSearchDocumentSections(answer, []).recommendedDocuments.map((item) => item.id)).toEqual(["page-1"]);
  });
});
