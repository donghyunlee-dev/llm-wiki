import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SearchPage } from "./SearchPage";
import type { StoredConversation } from "./search/searchConversationsStore";

const useWikiDataMock = vi.fn();

vi.mock("../../data/WikiDataProvider", () => ({
  useWikiData: () => useWikiDataMock(),
}));

function storedConversation(overrides: Partial<StoredConversation> = {}): StoredConversation {
  return {
    id: "conv-1",
    title: "MCP가 뭐야?",
    createdAt: 1,
    updatedAt: 1,
    turns: [
      {
        id: "turn-1",
        question: "MCP가 뭐야?",
        status: "complete",
        answer: {
          answer: "MCP는 외부 도구 연결 표준이에요.",
          policyNotice: { isPolicyRelated: false, message: "" },
          immediateActions: [],
          exampleCommands: [],
          verificationChecks: [],
          cautions: [],
          confluenceData: [{ pageId: "1", title: "Guide", quote: "근거" }],
          unsupportedClaims: [],
          recommendedDocuments: [],
          relatedDocuments: [],
        },
      },
    ],
    ...overrides,
  };
}

describe("SearchPage with ?c= conversation param", () => {
  beforeEach(() => {
    useWikiDataMock.mockReturnValue({ documents: [], errorMessage: null, isLoading: false });
    window.localStorage.clear();
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it("restores the matching conversation's turns when opened from a c= link", async () => {
    window.localStorage.setItem(
      "sfood-wiki:search-conversations:v1",
      JSON.stringify([storedConversation({ id: "conv-1" }), storedConversation({ id: "conv-2", title: "다른 대화" })]),
    );

    render(
      <MemoryRouter initialEntries={["/search?c=conv-1"]}>
        <SearchPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("MCP는 외부 도구 연결 표준이에요.")).not.toBeNull();
    expect(screen.getAllByText("MCP가 뭐야?").length).toBeGreaterThan(0);
  });
});
