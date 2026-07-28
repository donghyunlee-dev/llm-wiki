import { afterEach, describe, expect, it, vi } from "vitest";
import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { act, render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("ArticleAskPanel auto-scroll", () => {
  const originalOffsetTop = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetTop");
  const originalScrollHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollHeight");

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();

    if (originalOffsetTop) Object.defineProperty(HTMLElement.prototype, "offsetTop", originalOffsetTop);
    if (originalScrollHeight) Object.defineProperty(HTMLElement.prototype, "scrollHeight", originalScrollHeight);
  });

  it("scrolls to the top of the latest turn, not the container's absolute bottom", async () => {
    // Stubbed at the prototype level, before anything renders, so the value is deterministic
    // regardless of exactly when React's turns-effect fires relative to this test's own async
    // steps (per-element stubs applied mid-test raced against the effect and were flaky).
    Object.defineProperty(HTMLElement.prototype, "offsetTop", { configurable: true, value: 7 });
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", { configurable: true, value: 999 });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        answer: "긴 답변 내용입니다.",
        supportedByContext: true,
        policyNotice: { isPolicyRelated: false, message: "" },
        confluenceData: [],
        unsupportedClaims: [],
        suggestedNextPages: [],
      }),
    }));

    render(
      <MemoryRouter>
        <ArticleAskPanel documents={[document()]} pageId="page-1" />
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    const textarea = screen.getByRole("textbox", { name: "문서 질문" });
    await user.type(textarea, "질문입니다");
    await user.click(screen.getByRole("button", { name: "질문 전송" }));

    await waitFor(() => {
      expect(screen.getByText("답변")).toBeInTheDocument();
    }, { timeout: 3000 });

    const turnsContainer = window.document.querySelector(".article-ask-turns") as HTMLElement;
    expect(turnsContainer.scrollTop).toBe(7);
    expect(turnsContainer.scrollTop).not.toBe(999);
  });
});
