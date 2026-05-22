import { describe, expect, it } from "vitest";
import type { WikiDocument } from "@sfood/wiki-core";
import { extractConfluenceMacroBodyText, resolveWikiHref } from "./ArticleContentRenderer";

describe("resolveWikiHref", () => {
  it("resolves Confluence internal links using linked resource metadata and title text", () => {
    const documents: WikiDocument[] = [
      {
        id: "88211499",
        slug: "guide-node-js-setup",
        title: "Guide Node.js Setup",
        summary: "",
        updatedAt: "2026-05-06",
        sourceUrl: "https://example.test/wiki/spaces/LLMWIKI/pages/88211499/Guide+Node.js+Setup",
        metadata: {
          docType: "guide",
          audience: "beginner",
          status: "published",
          prerequisites: [],
          next: [],
          related: [],
        },
        headings: [],
        contentHtml: "",
      },
    ];

    const anchor = {
      getAttribute(name: string) {
        switch (name) {
          case "href":
            return "https://example.test/wiki/spaces/LLMWIKI/pages/99999999/Guide+Node.js+Setup";
          case "data-linked-resource-id":
            return "88211499";
          case "data-linked-resource-title":
            return "Guide Node.js Setup";
          default:
            return null;
        }
      },
      textContent: "Guide Node.js Setup",
    } as unknown as HTMLAnchorElement;

    expect(resolveWikiHref(anchor, documents)).toBe("/guides/guide-node-js-setup");
  });

  it("falls back to an internal wiki search route for unresolved internal links", () => {
    const documents: WikiDocument[] = [];

    const anchor = {
      getAttribute(name: string) {
        switch (name) {
          case "href":
            return "https://example.test/wiki/spaces/LLMWIKI/pages/88211499/Guide+Node.js+Setup";
          case "title":
            return "Guide Node.js Setup";
          default:
            return null;
        }
      },
      hasAttribute(name: string) {
        return name === "data-linked-resource-id";
      },
      textContent: "Guide Node.js Setup",
    } as unknown as HTMLAnchorElement;

    expect(resolveWikiHref(anchor, documents)).toBe("/search?q=guide%20node%20js%20setup");
  });

  it("extracts Confluence code macro text from CDATA comment bodies", () => {
    const body = {
      innerHTML: "<!--[CDATA[npm install -g @openai/codex]]-->",
      textContent: "",
    };
    const macro = {
      querySelector(selector: string) {
        return selector === "ac\\:plain-text-body" ? body : null;
      },
      textContent: "bash",
    } as unknown as Element;

    expect(extractConfluenceMacroBodyText(macro)).toBe("npm install -g @openai/codex");
  });
});
