import { describe, expect, it } from "vitest";
import {
  extractHeadingsFromHtml,
  normalizeConfluencePage,
  sanitizeConfluenceHtml,
  type RawConfluencePage,
} from "./confluenceReadModel";

describe("confluenceReadModel", () => {
  it("sanitizes script tags and inline handlers", () => {
    const html = `<h1 onclick="alert(1)">Title</h1><script>alert(1)</script>`;
    const sanitized = sanitizeConfluenceHtml(html);

    expect(sanitized).not.toContain("<script");
    expect(sanitized).not.toContain("onclick=");
  });

  it("strips unquoted inline event handlers", () => {
    const html = `<img src=x onerror=alert(1)><div onclick=steal()>x</div>`;
    const sanitized = sanitizeConfluenceHtml(html);

    expect(sanitized).not.toMatch(/onerror/i);
    expect(sanitized).not.toMatch(/onclick/i);
  });

  it("extracts headings from html", () => {
    const headings = extractHeadingsFromHtml(
      `<h1>Main</h1><h2 id="details">Details</h2>`,
    );

    expect(headings).toEqual([
      { id: "main", level: 1, text: "Main" },
      { id: "details", level: 2, text: "Details" },
    ]);
  });

  it("normalizes a raw confluence page into a wiki document", () => {
    const rawPage: RawConfluencePage = {
      id: "1",
      title: "문서 제목",
      spaceId: "63111172",
      status: "current",
      version: 3,
      bodyHtml: `<h1>문서 제목</h1><p>요약 문장입니다.</p>`,
      sourceUrl: "https://example.test/wiki/pages/1",
      metadata: {
        docType: "guide",
        audience: "beginner",
        status: "published",
        prerequisites: [],
        next: [],
        related: [],
      },
      updatedAt: "2026-04-28",
    };

    const normalized = normalizeConfluencePage(rawPage, "doc-title");

    expect(normalized.metadata.docType).toBe("guide");
    expect(normalized.slug).toBe("doc-title");
    expect(normalized.headings[0]).toEqual({
      id: "문서-제목",
      level: 1,
      text: "문서 제목",
    });
    expect(normalized.contentHtml).toContain("<h1>");
  });

  it("decodes common HTML entities in headings and summary while unescaping escaped entities in html", () => {
    const rawPage: RawConfluencePage = {
      id: "2",
      title: "엔티티 문서",
      spaceId: "63111172",
      status: "current",
      version: 1,
      bodyHtml: `<h2>Flow &amp;mdash; Detail</h2><p>Tom &amp;amp; Jerry &amp;mdash; ready&nbsp;now.</p>`,
      sourceUrl: "https://example.test/wiki/pages/2",
      metadata: {
        docType: "guide",
        audience: "beginner",
        status: "published",
        prerequisites: [],
        next: [],
        related: [],
      },
      updatedAt: "2026-06-08",
    };

    const normalized = normalizeConfluencePage(rawPage, "entity-doc");

    expect(normalized.contentHtml).toContain("&mdash;");
    expect(normalized.contentHtml).not.toContain("&amp;mdash;");
    expect(normalized.headings[0]).toEqual({
      id: "flow-detail",
      level: 2,
      text: "Flow — Detail",
    });
    expect(normalized.summary).toContain("Tom & Jerry — ready now.");
  });
});
