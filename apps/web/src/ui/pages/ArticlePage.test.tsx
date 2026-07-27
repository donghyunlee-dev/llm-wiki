import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { WikiDocument } from "@sfood/wiki-core";
import { ArticlePage } from "./ArticlePage";

const useWikiDataMock = vi.fn();
let observerInstances: MockIntersectionObserver[] = [];

class MockIntersectionObserver {
  callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    observerInstances.push(this);
  }

  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

function buildEntry(id: string, top: number, isIntersecting: boolean) {
  return {
    isIntersecting,
    boundingClientRect: { top } as DOMRectReadOnly,
    target: { id } as Element,
  } as unknown as IntersectionObserverEntry;
}

beforeEach(() => {
  useWikiDataMock.mockReset();
  observerInstances = [];
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

vi.mock("../../data/WikiDataProvider", () => ({
  useWikiData: () => useWikiDataMock(),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useParams: () => ({ slug: "guide-1" }),
  };
});

function buildDocument(): WikiDocument {
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
    headings: [
      { id: "h-1", level: 2, text: "첫 번째 섹션" },
      { id: "h-2", level: 2, text: "두 번째 섹션" },
    ],
    contentHtml:
      '<h2 id="h-1">첫 번째 섹션</h2><p>내용</p><h2 id="h-2">두 번째 섹션</h2><p>내용</p>',
  };
}

describe("ArticlePage TOC active state", () => {
  it("marks the clicked TOC entry active via text-weight class, not a new element", () => {
    useWikiDataMock.mockReturnValue({
      documents: [buildDocument()],
      errorMessage: null,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <ArticlePage section="guides" />
      </MemoryRouter>,
    );

    const firstLink = screen.getByRole("link", { name: "첫 번째 섹션" });
    const secondLink = screen.getByRole("link", { name: "두 번째 섹션" });

    // At the top of the page (jsdom defaults to scrollY: 0), the first heading is active —
    // this is the fix for the reported bug where scrolling back to the top left a stale
    // heading highlighted in the TOC.
    expect(firstLink.className).toContain("article-toc-link-active");
    expect(secondLink.className).not.toContain("article-toc-link-active");

    fireEvent.click(secondLink);

    expect(secondLink.className).toContain("article-toc-link-active");
    expect(firstLink.className).not.toContain("article-toc-link-active");
  });

  it("re-activates the first heading when scrolled back to the top of the page", () => {
    useWikiDataMock.mockReturnValue({
      documents: [buildDocument()],
      errorMessage: null,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <ArticlePage section="guides" />
      </MemoryRouter>,
    );

    const firstLink = screen.getByRole("link", { name: "첫 번째 섹션" });
    const secondLink = screen.getByRole("link", { name: "두 번째 섹션" });

    fireEvent.click(secondLink);
    expect(secondLink.className).toContain("article-toc-link-active");

    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });

    expect(firstLink.className).toContain("article-toc-link-active");
    expect(secondLink.className).not.toContain("article-toc-link-active");
  });

  it("marks the topmost of multiple intersecting headings active via the scroll-spy observer", () => {
    useWikiDataMock.mockReturnValue({
      documents: [buildDocument()],
      errorMessage: null,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <ArticlePage section="guides" />
      </MemoryRouter>,
    );

    const firstLink = screen.getByRole("link", { name: "첫 번째 섹션" });
    const secondLink = screen.getByRole("link", { name: "두 번째 섹션" });

    expect(observerInstances).toHaveLength(1);
    const [observer] = observerInstances;

    // Both headings are intersecting; h-2 is physically higher on screen (smaller
    // boundingClientRect.top) so it should win over h-1 despite arriving second.
    act(() => {
      observer.callback(
        [buildEntry("h-1", 200, true), buildEntry("h-2", 40, true)],
        observer as unknown as IntersectionObserver,
      );
    });

    expect(secondLink.className).toContain("article-toc-link-active");
    expect(firstLink.className).not.toContain("article-toc-link-active");
  });
});
