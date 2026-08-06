import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { WikiDocument } from "@sfood/wiki-core";
import { LessonIndexPage } from "./LessonIndexPage";

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
      next: [],
      related: [],
      courseId: "ai-foundation",
      order: 1,
    },
    presentation: {
      schemaVersion: 1,
      lessonId: "ai-first-perspective",
      theme: "ai-foundation",
      scenes: [
        {
          sceneId: "scene-1",
          anchor: "장면 1",
          type: "concept",
          layout: "visual-split",
          narration: "",
          blocks: [{ order: 1, kind: "explanation", content: "AI의 기본 개념을 처음 접하는 관점에서 설명합니다." }],
        },
        {
          sceneId: "scene-2",
          anchor: "장면 2",
          type: "concept",
          layout: "visual-split",
          narration: "",
          blocks: [{ order: 1, kind: "explanation", content: "본문" }],
        },
      ],
    },
    headings: [],
    contentHtml: "<h1>AI를 이해하는 첫 번째 관점</h1>",
    ...overrides,
  };
}

describe("LessonIndexPage", () => {
  beforeEach(() => {
    useWikiDataMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows a stats line and a start button when there is no saved progress", () => {
    useWikiDataMock.mockReturnValue({
      documents: [
        lessonDocument(),
        {
          ...lessonDocument(),
          id: "lesson-2",
          slug: "context-and-memory",
          title: "컨텍스트와 기억의 한계",
          summary: "컨텍스트 창의 한계를 설명합니다.",
          metadata: { ...lessonDocument().metadata, order: 2 },
          presentation: {
            schemaVersion: 1,
            lessonId: "context-and-memory",
            theme: "ai-foundation",
            scenes: [
              {
                sceneId: "scene-1",
                anchor: "장면",
                type: "concept",
                layout: "visual-split",
                narration: "",
                blocks: [{ order: 1, kind: "explanation", content: "본문" }],
              },
            ],
          },
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

    expect(screen.getByText("2개 레슨")).toBeInTheDocument();
    expect(screen.getByText("3개 장면")).toBeInTheDocument();
    expect(screen.getByText("약 5분")).toBeInTheDocument();
    expect(screen.getByText("학습 시작하기")).toBeInTheDocument();
  });

  it("renders each lesson as a card with order, title, and a truncated description", () => {
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
    expect(document.querySelector(".lesson-index-row")).not.toHaveTextContent("분");
  });

  it("truncates a long description to 100 characters", () => {
    const longSentence = "가".repeat(120);

    useWikiDataMock.mockReturnValue({
      documents: [
        lessonDocument({
          presentation: {
            schemaVersion: 1,
            lessonId: "ai-first-perspective",
            theme: "ai-foundation",
            scenes: [
              {
                sceneId: "scene-1",
                anchor: "장면 1",
                type: "concept",
                layout: "visual-split",
                narration: "",
                blocks: [{ order: 1, kind: "explanation", content: longSentence }],
              },
            ],
          },
        }),
      ],
      errorMessage: null,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <LessonIndexPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(`${"가".repeat(100)}…`)).toBeInTheDocument();
  });

  it("falls back to the document summary when the first scene has no text block", () => {
    useWikiDataMock.mockReturnValue({
      documents: [
        lessonDocument({
          presentation: {
            schemaVersion: 1,
            lessonId: "ai-first-perspective",
            theme: "ai-foundation",
            scenes: [
              {
                sceneId: "scene-1",
                anchor: "장면 1",
                type: "concept",
                layout: "visual-split",
                narration: "",
                blocks: [{ order: 1, kind: "visual", html: "<div>시각 자료</div>", css: "" }],
              },
            ],
          },
        }),
      ],
      errorMessage: null,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <LessonIndexPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("AI의 기본 개념을 처음 접하는 관점에서 설명합니다.")).toBeInTheDocument();
  });

  it("always links the start button to the first lesson", () => {
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

    expect(screen.getByText("학습 시작하기").closest("a")).toHaveAttribute(
      "href",
      "/lesson/ai-first-perspective",
    );
  });

  it("groups lessons under a chapter header when the outline declares one", () => {
    useWikiDataMock.mockReturnValue({
      documents: [
        lessonDocument({ metadata: { ...lessonDocument().metadata, chapter: "1부" } }),
        {
          ...lessonDocument(),
          id: "lesson-2",
          slug: "context-and-memory",
          title: "컨텍스트와 기억의 한계",
          metadata: { ...lessonDocument().metadata, order: 2, chapter: "1부" },
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

    expect(screen.getAllByText("1부")).toHaveLength(1);
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
