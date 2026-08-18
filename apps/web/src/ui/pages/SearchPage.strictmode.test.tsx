import { StrictMode } from "react";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SearchPage } from "./SearchPage";

const useWikiDataMock = vi.fn();

vi.mock("../../data/WikiDataProvider", () => ({
  useWikiData: () => useWikiDataMock(),
}));

function mockAnswerResponse() {
  return {
    answer: "설명",
    title: "요약 제목",
    policyNotice: { isPolicyRelated: false, message: "" },
    immediateActions: [],
    exampleCommands: [],
    verificationChecks: [],
    cautions: [],
    confluenceData: [{ pageId: "1", title: "Guide", quote: "근거" }],
    unsupportedClaims: [],
    recommendedDocuments: [],
    relatedDocuments: [],
  };
}

describe("SearchPage under React StrictMode", () => {
  beforeEach(() => {
    useWikiDataMock.mockReturnValue({ documents: [], errorMessage: null, isLoading: false });
    window.localStorage.clear();
    Element.prototype.scrollIntoView = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAnswerResponse(),
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("creates exactly one conversation and sends exactly one request for a single question", async () => {
    render(
      <StrictMode>
        <MemoryRouter initialEntries={["/search?q=%EC%A7%88%EB%AC%B8"]}>
          <SearchPage />
        </MemoryRouter>
      </StrictMode>,
    );

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });

    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem("sfood-wiki:search-conversations:v1") ?? "[]");
      expect(stored).toHaveLength(1);
    });

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });
});
