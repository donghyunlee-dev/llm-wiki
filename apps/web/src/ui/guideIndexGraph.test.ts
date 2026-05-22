import { describe, expect, it } from "vitest";
import type { WikiDocument } from "@sfood/wiki-core";
import { buildGuideIndexGraphModel } from "./guideIndexGraph";

function document(overrides: Partial<WikiDocument> = {}): WikiDocument {
  return {
    id: "page-1",
    slug: "guide-index",
    title: "Guide Index",
    summary: "Index summary",
    updatedAt: "2026-05-01",
    metadata: {
      docType: "guide",
      audience: "beginner",
      status: "published",
      prerequisites: [],
      next: [],
      related: [],
    },
    headings: [],
    contentHtml: "<p>Index</p>",
    ...overrides,
  };
}

describe("guideIndexGraph", () => {
  it("groups guide documents by index roots and relations", () => {
    const index = document({
      id: "index",
      title: "MCP Index",
      slug: "mcp-index",
      metadata: {
        ...document().metadata,
        docType: "nav",
        next: ["setup"],
        related: ["reference"],
      },
    });
    const child = document({
      id: "child",
      parentId: "index",
      title: "MCP Overview Child",
      slug: "mcp-overview-child",
    });
    const prerequisite = document({ id: "prerequisite", title: "Before MCP", slug: "before-mcp" });
    const next = document({ id: "setup", title: "MCP Setup", slug: "mcp-setup" });
    const related = document({ id: "reference", title: "MCP Reference", slug: "mcp-reference" });
    const orphan = document({ id: "orphan", title: "Orphan", slug: "orphan" });

    const model = buildGuideIndexGraphModel([index, child, prerequisite, next, related, orphan]);

    expect(model.indexDocuments.map((item) => item.id)).toEqual(["index"]);
    expect(model.groups[0]?.childDocuments.map((item) => item.id)).toEqual(["child"]);
    expect(model.groups[0]?.prerequisiteDocuments).toEqual([]);
    expect(model.groups[0]?.nextDocuments.map((item) => item.id)).toEqual(["setup"]);
    expect(model.groups[0]?.relatedDocuments.map((item) => item.id)).toEqual(["reference"]);
    expect(model.orphanDocuments.map((item) => item.id)).toEqual(expect.arrayContaining(["orphan", "prerequisite"]));
  });

  it("keeps broken references visible", () => {
    const index = document({
      id: "index",
      title: "MCP Index",
      slug: "mcp-index",
      metadata: {
        ...document().metadata,
        docType: "nav",
        related: ["missing"],
      },
    });

    const model = buildGuideIndexGraphModel([index]);

    expect(model.missingReferences).toEqual([
      {
        documentId: "index",
        documentTitle: "MCP Index",
        missingId: "missing",
      },
    ]);
  });
});
