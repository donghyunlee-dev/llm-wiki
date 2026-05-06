import { describe, expect, it } from "vitest";
import {
  getIndexFirstSearchWikiDocumentsIn,
  getTopSearchWikiDocumentsIn,
  getParentWikiDocumentFrom,
  searchWikiDocumentsIn,
  validateWikiGraphReferencesFrom,
  type WikiDocument,
} from "./wikiDocuments";

function document(overrides: Partial<WikiDocument> = {}): WikiDocument {
  return {
    id: "1",
    slug: "doc",
    category: "guides",
    title: "Document",
    summary: "Summary",
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
    contentHtml: "",
    ...overrides,
  };
}

describe("wiki document graph helpers", () => {
  it("resolves a visible parent document", () => {
    const parent = document({ id: "parent", title: "Parent" });
    const child = document({ id: "child", parentId: "parent", title: "Child" });

    expect(getParentWikiDocumentFrom([parent, child], child)).toBe(parent);
  });

  it("reports missing parent and metadata graph references", () => {
    const source = document({
      id: "source",
      parentId: "missing-parent",
      metadata: {
        ...document().metadata,
        prerequisites: ["missing-prerequisite"],
        next: ["next"],
        related: ["missing-related"],
      },
    });
    const next = document({ id: "next" });

    expect(validateWikiGraphReferencesFrom([source, next])).toEqual([
      { documentId: "source", missingId: "missing-parent" },
      { documentId: "source", missingId: "missing-prerequisite" },
      { documentId: "source", missingId: "missing-related" },
    ]);
  });

  it("matches natural language questions against body tokens", () => {
    const groups = searchWikiDocumentsIn([
      document({
        id: "mcp",
        title: "MCP 설정",
        contentHtml: "<p>Windows에서 GPT 파일 시스템 MCP를 설정합니다.</p>",
      }),
    ], "윈도우에서 gpt에 파일 시스템 mcp 어떻게 설정해?");

    expect(groups.guides[0]?.id).toBe("mcp");
  });

  it("normalizes Korean particles and email synonyms in search terms", () => {
    const gmailDoc = document({
      id: "gmail",
      slug: "gmail-mcp-setup",
      title: "[Guide] Gmail MCP Setup",
      summary: "Gmail 메일을 조회하고 답장 초안을 작성하는 방법",
      contentHtml: "<p>Gmail 메일을 조회하고 설정합니다.</p>",
    });
    const microsoftDoc = document({
      id: "m365",
      slug: "microsoft-365-mcp-setup",
      title: "[Guide] Microsoft 365 MCP Setup",
      summary: "Outlook 메일과 일정 연결 방법",
      contentHtml: "<p>Outlook 메일과 캘린더를 연결합니다.</p>",
    });

    expect(searchWikiDocumentsIn([gmailDoc, microsoftDoc], "gmail을 설정하는 방법이 있을까?").guides.map((doc) => doc.id)).toContain("gmail");
    expect(searchWikiDocumentsIn([gmailDoc, microsoftDoc], "mail을 보내는 mcp는 어떻게 설정해?").guides.map((doc) => doc.id)).toEqual(expect.arrayContaining(["gmail", "m365"]));
  });

  it("prioritizes mail setup guides over generic MCP setup docs", () => {
    const gmailDoc = document({
      id: "gmail",
      slug: "gmail-mcp-setup",
      title: "[Guide] Gmail MCP Setup",
      summary: "Gmail 메일을 조회하고 답장 초안을 작성하는 방법",
      contentHtml: "<p>Gmail 메일을 조회하고 설정합니다.</p>",
    });
    const microsoftDoc = document({
      id: "m365",
      slug: "microsoft-365-mcp-setup",
      title: "[Guide] Microsoft 365 MCP Setup",
      summary: "Outlook 메일과 일정 연결 방법",
      contentHtml: "<p>Outlook 메일과 캘린더를 연결합니다.</p>",
    });
    const genericDoc = document({
      id: "generic",
      slug: "generic-mcp-setup",
      title: "[Guide] Generic MCP Setup",
      summary: "MCP 설정 방법",
      contentHtml: "<p>MCP를 설정합니다.</p>",
    });

    expect(
      getTopSearchWikiDocumentsIn([genericDoc, gmailDoc, microsoftDoc], "mail을 보내는 mcp는 어떻게 설정해?", 2).map((doc) => doc.id),
    ).toEqual(["gmail", "m365"]);
  });

  it("keeps the most relevant document ahead of category ordering", () => {
    const guideDoc = document({
      id: "guide",
      category: "guides",
      title: "Generic Guide",
      summary: "Generic content",
      contentHtml: "<p>Generic content only.</p>",
    });
    const faqDoc = document({
      id: "faq",
      category: "faq",
      title: "Codex CLI install",
      summary: "How to install Codex in CLI environments",
      contentHtml: "<p>Install Codex in CLI environments.</p>",
    });

    expect(getTopSearchWikiDocumentsIn([guideDoc, faqDoc], "codex cli install", 1).map((doc) => doc.id)).toEqual(["faq"]);
  });

  it("uses matched index documents to expand into detailed search candidates", () => {
    const results = getIndexFirstSearchWikiDocumentsIn([
      document({
        id: "codex-index",
        slug: "guide-codex-index",
        title: "[Guide] Codex Index",
        metadata: {
          ...document().metadata,
          related: ["codex-mcp"],
        },
      }),
      document({
        id: "codex-mcp",
        slug: "guide-codex-mcp-setup",
        title: "[Guide] Codex MCP Setup",
        contentHtml: "<p>Codex에서 MCP를 설정합니다.</p>",
      }),
      document({
        id: "other-index",
        slug: "faq-index",
        category: "faq",
        title: "[FAQ] Index",
      }),
    ], "codex mcp 설정", 4);

    expect(results.map((result) => result.id)).toEqual(["codex-mcp"]);
  });

  it("does not expand matched indexes into unrelated same-category pages", () => {
    const results = getIndexFirstSearchWikiDocumentsIn([
      document({
        id: "index",
        slug: "guide-codex-index",
        title: "[Guide] Codex Index",
        metadata: {
          ...document().metadata,
          related: ["linked-guide"],
        },
      }),
      document({
        id: "linked-guide",
        slug: "guide-codex-mcp-setup",
        title: "[Guide] Codex MCP Setup",
        contentHtml: "<p>Codex에서 MCP를 설정합니다.</p>",
      }),
      document({
        id: "unrelated-guide",
        slug: "guide-unrelated",
        title: "[Guide] Unrelated Page",
        contentHtml: "<p>Unrelated content.</p>",
      }),
    ], "codex mcp 설정", 4);

    expect(results.map((result) => result.id)).toEqual(["linked-guide"]);
  });
});
