import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { WikiDocument } from "@sfood/wiki-core";
import { LessonIndexPage } from "./LessonIndexPage";
import { LESSON_COURSE_ID } from "../../data/lessonProgress";

const useWikiDataMock = vi.fn();

vi.mock("../../data/WikiDataProvider", () => ({
  useWikiData: () => useWikiDataMock(),
}));

function lessonDocument(overrides: Partial<WikiDocument> = {}): WikiDocument {
  return {
    id: "lesson-1",
    slug: "ai-first-perspective",
    title: "AI를 이해하는 첫 번째 관점",
    summary: "AI의 기본 개념을 처음 접하는 관점에서 설명합니다.",
    updatedAt: "2026-07-30",
    metadata: {
      docType: "lesson",
      audience: "beginner",
      status: "published",
      prerequisites: [],
      next: ["lesson-2"],
      related: [],
    },
    headings: [],
    contentHtml: "<h2>장면 1</h2><p>본문</p><h2>장면 2</h2><p>본문</p>",
    ...overrides,
  };
}

describe("LessonIndexPage", () => {
  beforeEach(() => {
    useWikiDataMock.mockReset();
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows a stats line and a start button when there is no saved progress", () => {
    useWikiDataMock.mockReturnValue({
      documents: [
        { ...lessonDocument(), metadata: { ...lessonDocument().metadata, next: ["lesson-2"] } },
        {
          ...lessonDocument(),
          id: "lesson-2",
          slug: "context-and-memory",
          title: "컨텍스트와 기억의 한계",
          summary: "컨텍스트 창의 한계를 설명합니다.",
          metadata: { ...lessonDocument().metadata, next: [] },
          contentHtml: "<h2>장면</h2><p>본문</p>",
        },
      ],
      errorMessage: null,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <LessonIndexPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("2개 레슨 · 3개 장면 · 약 5분")).toBeInTheDocument();
    expect(screen.getByText("학습 시작하기")).toBeInTheDocument();
  });

  it("renders each lesson as a card with order, title, summary, and estimated minutes", () => {
    useWikiDataMock.mockReturnValue({
      documents: [lessonDocument()],
      errorMessage: null,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <LessonIndexPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("AI를 이해하는 첫 번째 관점")).toBeInTheDocument();
    expect(screen.getByText("AI의 기본 개념을 처음 접하는 관점에서 설명합니다.")).toBeInTheDocument();
    expect(screen.getByText("약 3분")).toBeInTheDocument();
  });

  it("shows a continue button when progress is saved", () => {
    window.localStorage.setItem(
      `lesson-progress:${LESSON_COURSE_ID}`,
      JSON.stringify({
        lastLessonSlug: "ai-first-perspective",
        lastSceneIndex: 1,
        completedLessonSlugs: ["ai-first-perspective"],
      }),
    );

    useWikiDataMock.mockReturnValue({
      documents: [lessonDocument()],
      errorMessage: null,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <LessonIndexPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("이어서 학습하기")).toBeInTheDocument();
    expect(screen.getByText("완료")).toBeInTheDocument();
  });

  it("shows an empty state when there are no lesson documents", () => {
    useWikiDataMock.mockReturnValue({ documents: [], errorMessage: null, isLoading: false });

    render(
      <MemoryRouter>
        <LessonIndexPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("등록된 교육 콘텐츠가 없습니다.")).toBeInTheDocument();
  });
});
