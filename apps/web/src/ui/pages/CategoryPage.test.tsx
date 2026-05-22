import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import type { WikiDocument } from "@sfood/wiki-core";
import { CategoryPage } from "./CategoryPage";

const useWikiDataMock = vi.fn();

vi.mock("../../data/WikiDataProvider", () => ({
  useWikiData: () => useWikiDataMock(),
}));

function document(overrides: Partial<WikiDocument> = {}): WikiDocument {
  return {
    id: "page-1",
    slug: "guide-1",
    title: "가이드 1",
    summary: "Summary",
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
    contentHtml: "<p>Guide</p>",
    ...overrides,
  };
}

describe("CategoryPage", () => {
  beforeEach(() => {
    useWikiDataMock.mockReset();
  });

  it("shows only guide documents on /guides, excludes page docType and intro pages, and paginates long lists", () => {
    useWikiDataMock.mockReturnValue({
      documents: [
        document({ id: "g-1", slug: "guide-1", title: "가이드 1" }),
        document({ id: "g-2", slug: "guide-2", title: "가이드 2" }),
        document({ id: "g-3", slug: "guide-3", title: "가이드 3" }),
        document({ id: "g-4", slug: "guide-4", title: "가이드 4" }),
        document({ id: "g-5", slug: "guide-5", title: "가이드 5" }),
        document({ id: "g-6", slug: "guide-6", title: "가이드 6" }),
        document({ id: "g-7", slug: "guide-7", title: "가이드 7" }),
        document({ id: "g-8", slug: "guide-8", title: "가이드 8" }),
        document({ id: "g-9", slug: "guide-9", title: "가이드 9" }),
        document({ id: "g-10", slug: "guide-10", title: "가이드 10" }),
        document({ id: "g-11", slug: "guide-11", title: "가이드 11" }),
        document({
          id: "intro",
          slug: "intro-guide",
          title: "[Intro] 시작 안내",
        }),
        document({
          id: "page",
          slug: "page-guide",
          title: "페이지형 문서",
          metadata: {
            ...document().metadata,
            docType: "page",
          },
        }),
      ],
      errorMessage: null,
      isLoading: false,
    });

    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <CategoryPage section="guides" />
      </MemoryRouter>,
    );

    expect(markup).toContain("가이드 1");
    expect(markup).toContain("가이드 10");
    expect(markup).not.toContain("가이드 11");
    expect(markup).not.toContain("[Intro] 시작 안내");
    expect(markup).not.toContain("페이지형 문서");
    expect(markup).toContain("[추천 가이드]");
    expect(markup).toContain("통합 검색");
    expect(markup).toContain("이전");
    expect(markup).toContain("다음");
    expect(markup).not.toContain("대상");
    expect(markup).not.toContain("유형");
    expect(markup).not.toContain("정렬");
    expect(markup).not.toContain("문서 지도 보기");
  });
});
