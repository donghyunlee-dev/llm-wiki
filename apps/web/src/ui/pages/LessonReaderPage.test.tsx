import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { WikiDocument } from "@sfood/wiki-core";
import { LessonReaderPage } from "./LessonReaderPage";
import { LESSON_COURSE_ID } from "../../data/lessonProgress";

const useWikiDataMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("../../data/WikiDataProvider", () => ({
  useWikiData: () => useWikiDataMock(),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useParams: () => ({ slug: "ai-first-perspective" }),
    useNavigate: () => navigateMock,
    useSearchParams: () => [new URLSearchParams()],
  };
});

function lessonDocument(): WikiDocument {
  return {
    id: "lesson-1",
    slug: "ai-first-perspective",
    title: "AI를 이해하는 첫 번째 관점",
    summary: "요약",
    updatedAt: "2026-07-30",
    metadata: {
      docType: "lesson",
      audience: "beginner",
      status: "published",
      prerequisites: [],
      next: [],
      related: [],
    },
    headings: [],
    contentHtml: `
      <h2 id="scene-a">첫 번째 장면</h2>
      <p>첫 번째 본문</p>
      <ac:structured-macro ac:name="expand"><ac:rich-text-body><p>숨겨진 대본</p></ac:rich-text-body></ac:structured-macro>
      <h2 id="scene-b">두 번째 장면</h2>
      <p>두 번째 본문</p>
    `,
  };
}

describe("LessonReaderPage", () => {
  beforeEach(() => {
    useWikiDataMock.mockReset();
    navigateMock.mockReset();
    window.localStorage.clear();
    useWikiDataMock.mockReturnValue({
      documents: [lessonDocument()],
      errorMessage: null,
      isLoading: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("shows the first scene and position indicator on load", () => {
    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("첫 번째 장면")).toBeInTheDocument();
    expect(screen.getByText("첫 번째 본문")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("moves to the next scene when the next button is clicked", () => {
    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("다음"));

    expect(screen.getByText("두 번째 장면")).toBeInTheDocument();
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });

  it("moves to the next scene on ArrowRight and back on ArrowLeft", () => {
    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText("두 번째 장면")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByText("첫 번째 장면")).toBeInTheDocument();
  });

  it("toggles the hidden script for the current scene", () => {
    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    expect(screen.queryByText("숨겨진 대본")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("대본 보기"));
    expect(screen.getByText("숨겨진 대본")).toBeInTheDocument();

    fireEvent.click(screen.getByText("대본 숨기기"));
    expect(screen.queryByText("숨겨진 대본")).not.toBeInTheDocument();
  });

  it("saves progress and navigates to the lesson index after the last scene", () => {
    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("다음"));
    fireEvent.click(screen.getByText("레슨 완료"));

    expect(navigateMock).toHaveBeenCalledWith("/lesson");

    const saved = JSON.parse(window.localStorage.getItem(`lesson-progress:${LESSON_COURSE_ID}`) ?? "{}");
    expect(saved.completedLessonSlugs).toContain("ai-first-perspective");
  });
});
