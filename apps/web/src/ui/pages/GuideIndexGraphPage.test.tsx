import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import type { WikiDocument } from "@sfood/wiki-core";
import { GuideIndexGraphPage } from "./GuideIndexGraphPage";

const useWikiDataMock = vi.fn();

vi.mock("../../data/WikiDataProvider", () => ({
  useWikiData: () => useWikiDataMock(),
}));

function document(overrides: Partial<WikiDocument> = {}): WikiDocument {
  return {
    id: "page-1",
    slug: "guide-index",
    title: "Guide Index",
    summary: "Index summary",
    updatedAt: "2026-05-01",
    metadata: {
      docType: "nav",
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

describe("GuideIndexGraphPage", () => {
  beforeEach(() => {
    useWikiDataMock.mockReset();
  });

  it("renders the guide graph sections from cached guide documents", () => {
    useWikiDataMock.mockReturnValue({
      documents: [
        document({
          id: "index",
          title: "MCP Index",
          slug: "mcp-index",
          metadata: {
            ...document().metadata,
            next: ["setup"],
          },
        }),
        document({ id: "setup", title: "MCP Setup", slug: "mcp-setup" }),
      ],
      errorMessage: null,
      isLoading: false,
    });

    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <GuideIndexGraphPage />
      </MemoryRouter>,
    );

    expect(markup).toContain("가이드 인덱스 그래프");
    expect(markup).toContain("MCP Setup");
    expect(markup).not.toContain("index 노드를 클릭하면");
    expect(markup).toContain("하위 문서");
  });

  it("renders an empty state when no guide index exists", () => {
    useWikiDataMock.mockReturnValue({
      documents: [],
      errorMessage: null,
      isLoading: false,
    });

    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <GuideIndexGraphPage />
      </MemoryRouter>,
    );

    expect(markup).toContain("표시할 그래프가 없습니다");
  });
});
