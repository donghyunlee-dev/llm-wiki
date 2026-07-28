import { afterEach, describe, expect, it } from "vitest";
import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { act, render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import type { WikiDocument } from "@sfood/wiki-core";
import { ArticleAskPanel, type ArticleAskPanelHandle } from "./ArticleAskPanel";

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

describe("ArticleAskPanel imperative handle", () => {
  afterEach(() => cleanup());

  it("fills the question input and focuses it when ref.current.fillAndFocus() is called", () => {
    const ref = createRef<ArticleAskPanelHandle>();

    render(
      <MemoryRouter>
        <ArticleAskPanel ref={ref} documents={[document()]} pageId="page-1" />
      </MemoryRouter>,
    );

    act(() => {
      ref.current?.fillAndFocus("선택한 문장입니다");
    });

    const textarea = screen.getByRole("textbox", { name: "문서 질문" });
    expect(textarea).toHaveValue("선택한 문장입니다");
    expect(window.document.activeElement).toBe(textarea);
  });
});
