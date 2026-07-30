import { describe, expect, it } from "vitest";

import {
  buildWikiSearchUrl,
  DEFAULT_WIKI_BASE_URL,
  findCleanDocumentByHref,
  normalizeWikiBaseUrl,
  normalizeWikiSearchResponse,
  resolveWikiHref
} from "./wikiClient";

describe("wiki sidebar client helpers", () => {
  it("normalizes empty and trailing-slash wiki base URLs", () => {
    expect(normalizeWikiBaseUrl("")).toBe(DEFAULT_WIKI_BASE_URL);
    expect(normalizeWikiBaseUrl(" http://localhost:5173/// ")).toBe("http://localhost:5173");
  });

  it("builds an encoded wiki search fallback URL", () => {
    expect(buildWikiSearchUrl("http://localhost:5173/", "claude worktree 설명")).toBe(
      "http://localhost:5173/search?q=claude+worktree+%EC%84%A4%EB%AA%85"
    );
  });

  it("resolves relative wiki links against the configured base URL", () => {
    expect(resolveWikiHref("http://localhost:5173/", "/guides/worktree")).toBe("http://localhost:5173/guides/worktree");
    expect(resolveWikiHref("http://localhost:5173", "search?q=abc")).toBe("http://localhost:5173/search?q=abc");
    expect(resolveWikiHref("http://localhost:5173", "https://wiki.example/guides/worktree")).toBe(
      "https://wiki.example/guides/worktree"
    );
  });

  it("normalizes answer and unique source titles from the wiki response, stripping [Type] prefixes for display", () => {
    const result = normalizeWikiSearchResponse({
      answer: " Claude Code Worktrees 설명입니다. ",
      confluenceData: [{ pageId: "1", title: "[Guide] Claude Code Worktrees" }],
      recommendedDocuments: [
        { id: "1", title: "[Guide] Claude Code Worktrees", href: "/guides/worktrees" },
        { title: "Claude Code Index", slug: "claude-code-index" }
      ],
      relatedDocuments: [{ title: "" }, { title: 123 }]
    });

    expect(result).toEqual({
      answer: "Claude Code Worktrees 설명입니다.",
      sources: [
        { id: "1", title: "Claude Code Worktrees", href: "/guides/worktrees" },
        { title: "Claude Code Index", href: "/guides/claude-code-index" }
      ]
    });
  });

  it("keeps a guide href when the same source title also appears as confluence evidence", () => {
    const result = normalizeWikiSearchResponse({
      answer: "answer",
      confluenceData: [{ id: "1", title: "[Guide] Test" }],
      recommendedDocuments: [{ id: "1", title: "[Guide] Test", href: "/guides/test-guide" }]
    });

    expect(result.sources).toEqual([{ id: "1", title: "Test", href: "/guides/test-guide" }]);
  });

  it("finds a cleaned document by slug href", () => {
    const pages = [
      {
        id: "42",
        slug: "worktrees",
        title: "Claude Code Worktrees",
        summary: "요약",
        href: "/guides/worktrees",
        docType: "guide",
        contentHtml: "<p>본문</p>",
        related: [{ title: "관련", href: "/guides/related" }],
      },
    ];

    const found = findCleanDocumentByHref(pages, "http://localhost:5173", "/guides/worktrees");
    expect(found?.title).toBe("Claude Code Worktrees");
    expect(found?.contentHtml).toBe("<p>본문</p>");
    expect(found?.relatedDocuments).toEqual([{ title: "관련", href: "/guides/related" }]);
  });

  it("finds a cleaned document by /wiki/{id} href", () => {
    const pages = [
      { id: "42", slug: "worktrees", title: "T", summary: "", href: "/guides/worktrees", docType: "guide", contentHtml: "<p>x</p>", related: [] },
    ];

    const found = findCleanDocumentByHref(pages, "http://localhost:5173", "/wiki/42");
    expect(found?.id).toBe("42");
  });

  it("returns null when no cleaned document matches", () => {
    expect(findCleanDocumentByHref([], "http://localhost:5173", "/guides/missing")).toBeNull();
  });

  it("strips the [Type] prefix from the title and related titles, and removes a duplicate leading <h1>", () => {
    const pages = [
      {
        id: "42",
        slug: "worktrees",
        title: "[Guide] Claude Code Worktrees",
        summary: "요약",
        href: "/guides/worktrees",
        docType: "guide",
        contentHtml: "<h1>[Guide] Claude Code Worktrees</h1><p>본문</p>",
        related: [{ title: "[FAQ] 관련 질문", href: "/faq/related" }],
      },
    ];

    const found = findCleanDocumentByHref(pages, "http://localhost:5173", "/guides/worktrees");
    expect(found?.title).toBe("Claude Code Worktrees");
    expect(found?.contentHtml).toBe("<p>본문</p>");
    expect(found?.relatedDocuments).toEqual([{ title: "관련 질문", href: "/faq/related" }]);
  });

  it("keeps a leading <h1> that isn't a duplicate of the page title", () => {
    const pages = [
      {
        id: "42",
        slug: "worktrees",
        title: "[Guide] Claude Code Worktrees",
        summary: "",
        href: "/guides/worktrees",
        docType: "guide",
        contentHtml: "<h1>다른 제목</h1><p>본문</p>",
        related: [],
      },
    ];

    const found = findCleanDocumentByHref(pages, "http://localhost:5173", "/guides/worktrees");
    expect(found?.contentHtml).toBe("<h1>다른 제목</h1><p>본문</p>");
  });

  it("builds href from confluenceData pageId", () => {
    const result = normalizeWikiSearchResponse({
      answer: "answer",
      confluenceData: [{ pageId: "95780877", title: "Claude Code Worktrees" }]
    });

    expect(result.sources).toEqual([{ id: "95780877", title: "Claude Code Worktrees", href: "/wiki/95780877" }]);
  });

  it("deduplicates the same page by id even when titles differ slightly", () => {
    const result = normalizeWikiSearchResponse({
      answer: "설명",
      confluenceData: [{ pageId: "42", title: "[Guide] Claude Code Worktrees" }],
      recommendedDocuments: [{ id: "42", title: "Claude Code Worktrees", href: "/guides/worktrees" }],
      relatedDocuments: [{ id: "42", title: "Claude Code Worktrees", href: "/guides/worktrees" }],
    });

    // Same page id "42" across all three arrays → exactly one merged source.
    const worktreeSources = result.sources.filter((source) => source.id === "42");
    expect(worktreeSources).toHaveLength(1);
    // Slug-based href must win over the /wiki/{pageId} evidence href.
    expect(worktreeSources[0]?.href).toBe("/guides/worktrees");
  });

  it("prefers slug hrefs for faq and library pages over /wiki/{pageId}", () => {
    const result = normalizeWikiSearchResponse({
      answer: "설명",
      confluenceData: [
        { pageId: "7", title: "FAQ 항목" },
        { pageId: "8", title: "라이브러리 항목" },
      ],
      recommendedDocuments: [
        { id: "7", title: "FAQ 항목", href: "/faq/faq-item" },
        { id: "8", title: "라이브러리 항목", href: "/library/lib-item" },
      ],
    });

    expect(result.sources).toHaveLength(2);
    expect(result.sources.find((source) => source.id === "7")?.href).toBe("/faq/faq-item");
    expect(result.sources.find((source) => source.id === "8")?.href).toBe("/library/lib-item");
  });
});
