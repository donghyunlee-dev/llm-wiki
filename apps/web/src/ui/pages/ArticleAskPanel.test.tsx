import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import type { WikiDocument } from "@sfood/wiki-core";
import { ArticleAskPanel } from "./ArticleAskPanel";

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

describe("ArticleAskPanel", () => {
  it("renders a multiline textarea composer for page-level questions", () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <ArticleAskPanel documents={[document()]} pageId="page-1" />
      </MemoryRouter>,
    );

    expect(markup).toContain("<textarea");
    expect(markup).toContain("이 문서에서 궁금한 내용을 입력하세요");
  });
});
