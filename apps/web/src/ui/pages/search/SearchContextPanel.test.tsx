import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { SearchContextPanel } from "./SearchContextPanel";
import type { SearchDocumentSummary } from "../../searchRecommendations";

function doc(id: string, title = id): SearchDocumentSummary {
  return { id, title, summary: `${title} summary`, href: `/guides/${id}` };
}

describe("SearchContextPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders recommended, related, and FAQ sections in order when all have content", () => {
    render(
      <MemoryRouter>
        <SearchContextPanel
          recommended={[doc("r1", "추천1")]}
          related={[doc("l1", "관련1")]}
          faq={[doc("f1", "FAQ1")]}
        />
      </MemoryRouter>,
    );

    const headings = screen.getAllByRole("heading").map((node) => node.textContent);
    expect(headings).toEqual(["추천 페이지", "관련 페이지", "자주 묻는 질문"]);
  });

  it("hides a section entirely when it has no documents", () => {
    render(
      <MemoryRouter>
        <SearchContextPanel recommended={[doc("r1", "추천1")]} related={[]} faq={[]} />
      </MemoryRouter>,
    );

    expect(screen.queryByText("관련 페이지")).toBeNull();
    expect(screen.queryByText("자주 묻는 질문")).toBeNull();
  });

  it("shows an empty-state hint when there is no context at all", () => {
    render(
      <MemoryRouter>
        <SearchContextPanel recommended={[]} related={[]} faq={[]} />
      </MemoryRouter>,
    );

    expect(screen.queryByText(/아직 관련 페이지가 없습니다/)).not.toBeNull();
  });
});
