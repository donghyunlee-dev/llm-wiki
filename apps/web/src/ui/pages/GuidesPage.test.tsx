import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { render, screen, fireEvent } from "@testing-library/react";
import type { WikiDocument } from "@sfood/wiki-core";
import { StartingGuidePage } from "./GuidesPage";

const useWikiDataMock = vi.fn();

vi.mock("../../data/WikiDataProvider", () => ({
  useWikiData: () => useWikiDataMock(),
}));

function document(overrides: Partial<WikiDocument> = {}): WikiDocument {
  return {
    id: "start",
    slug: "agent-start",
    title: "Agent 시작하기",
    summary: "Summary",
    updatedAt: "2026-06-08",
    metadata: {
      docType: "nav",
      audience: "beginner",
      status: "published",
      prerequisites: [],
      next: [],
      related: [],
    },
    headings: [
      { id: "overview", level: 2, text: "개요" },
      { id: "details", level: 3, text: "세부 단계" },
      { id: "tips", level: 4, text: "팁" },
    ],
    contentHtml: "<h2>개요</h2><h3>세부 단계</h3><h4>팁</h4>",
    ...overrides,
  };
}

describe("StartingGuidePage", () => {
  beforeEach(() => {
    useWikiDataMock.mockReset();
  });

  it("renders nested toc level classes for guide headings", () => {
    useWikiDataMock.mockReturnValue({
      documents: [document()],
      errorMessage: null,
      isLoading: false,
    });

    const markup = renderToStaticMarkup(<StartingGuidePage />);

    expect(markup).toContain("article-toc-level-2");
    expect(markup).toContain("article-toc-level-3");
    expect(markup).toContain("article-toc-level-4");
    expect(markup).toContain("세부 단계");
    expect(markup).toContain("팁");
  });

  it("marks the clicked TOC entry active via text-weight class, not a new element", () => {
    useWikiDataMock.mockReturnValue({
      documents: [document()],
      errorMessage: null,
      isLoading: false,
    });

    render(<StartingGuidePage />);

    const overviewLink = screen.getByRole("link", { name: "개요" });
    const detailsLink = screen.getByRole("link", { name: "세부 단계" });

    expect(overviewLink.className).not.toContain("article-toc-link-active");
    expect(detailsLink.className).not.toContain("article-toc-link-active");

    fireEvent.click(detailsLink);

    expect(detailsLink.className).toContain("article-toc-link-active");
    expect(overviewLink.className).not.toContain("article-toc-link-active");
  });
});
