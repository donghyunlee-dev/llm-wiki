import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { WikiDocument } from "@sfood/wiki-core";
import { HomePage } from "./HomePage";
import type { StoredConversation } from "./search/searchConversationsStore";

const useWikiDataMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("../../data/WikiDataProvider", () => ({
  useWikiData: () => useWikiDataMock(),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

function document(): WikiDocument {
  return {
    id: "page-1",
    slug: "guide-1",
    title: "Guide 1",
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
    contentHtml: "<p>내용</p>",
  };
}

function storedConversation(overrides: Partial<StoredConversation> = {}): StoredConversation {
  return {
    id: "conv-1",
    title: "MCP가 뭐야?",
    createdAt: 1,
    updatedAt: 1,
    turns: [],
    ...overrides,
  };
}

function seedConversations(conversations: StoredConversation[]) {
  window.localStorage.setItem("sfood-wiki:search-conversations:v1", JSON.stringify(conversations));
}

describe("HomePage recent conversations", () => {
  beforeEach(() => {
    useWikiDataMock.mockReset();
    useWikiDataMock.mockReturnValue({ documents: [document()], errorMessage: null, isLoading: false });
    navigateMock.mockReset();
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("does not render the recent conversations section when none are stored", () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(markup).not.toContain("최근 대화");
  });

  it("renders stored conversations, newest first, when conversations exist", () => {
    seedConversations([
      storedConversation({ id: "older", title: "오래된 질문", updatedAt: 1 }),
      storedConversation({ id: "newer", title: "최신 질문", updatedAt: 2 }),
    ]);

    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(markup).toContain("최근 대화");
    expect(markup).toContain("최신 질문");
    expect(markup).toContain("오래된 질문");
    expect(markup.indexOf("최신 질문")).toBeLessThan(markup.indexOf("오래된 질문"));
  });

  it("navigates to the matching conversation in /search when a recent conversation is clicked", () => {
    seedConversations([storedConversation({ id: "conv-42", title: "MCP가 뭐야?" })]);

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("MCP가 뭐야?"));

    expect(navigateMock).toHaveBeenCalledWith("/search?c=conv-42");
  });
});
