import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { LessonPresentationScene, WikiDocument } from "@sfood/wiki-core";
import { LessonReaderPage } from "./LessonReaderPage";

const useWikiDataMock = vi.fn();
const navigateMock = vi.fn();
const useParamsMock = vi.fn(() => ({ slug: "ai-first-perspective" }));
const setSearchParamsMock = vi.fn();
const useSearchParamsMock = vi.fn(() => [new URLSearchParams(), setSearchParamsMock]);

vi.mock("../../data/WikiDataProvider", () => ({
  useWikiData: () => useWikiDataMock(),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useParams: () => useParamsMock(),
    useNavigate: () => navigateMock,
    useSearchParams: () => useSearchParamsMock(),
  };
});

function presentationScene(overrides: Partial<LessonPresentationScene> = {}): LessonPresentationScene {
  return {
    sceneId: "scene-a",
    anchor: "장면",
    type: "concept",
    layout: "visual-split",
    narration: "",
    blocks: [{ order: 1, kind: "hook", content: "장면 내용" }],
    ...overrides,
  };
}

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
    presentation: {
      schemaVersion: 1,
      lessonId: "ai-first-perspective",
      theme: "ai-foundation",
      scenes: [
        presentationScene({
          sceneId: "scene-a",
          anchor: "첫 번째 장면",
          narration: "숨겨진 대본",
          blocks: [{ order: 1, kind: "explanation", content: "첫 번째 본문" }],
        }),
        presentationScene({
          sceneId: "scene-b",
          anchor: "두 번째 장면",
          blocks: [{ order: 1, kind: "explanation", content: "두 번째 본문" }],
        }),
      ],
    },
    headings: [],
    contentHtml: "<h1>AI를 이해하는 첫 번째 관점</h1>",
  };
}

function secondLessonDocument(): WikiDocument {
  return {
    id: "lesson-2",
    slug: "context-and-memory",
    title: "맥락과 기억",
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
    presentation: {
      schemaVersion: 1,
      lessonId: "context-and-memory",
      theme: "ai-foundation",
      scenes: [
        presentationScene({
          sceneId: "scene-a",
          anchor: "세 번째 장면",
          blocks: [{ order: 1, kind: "explanation", content: "세 번째 본문" }],
        }),
        presentationScene({
          sceneId: "scene-b",
          anchor: "네 번째 장면",
          blocks: [{ order: 1, kind: "explanation", content: "네 번째 본문" }],
        }),
      ],
    },
    headings: [],
    contentHtml: "<h1>맥락과 기억</h1>",
  };
}

describe("LessonReaderPage", () => {
  beforeEach(() => {
    useWikiDataMock.mockReset();
    navigateMock.mockReset();
    useParamsMock.mockReset();
    useParamsMock.mockReturnValue({ slug: "ai-first-perspective" });
    useSearchParamsMock.mockReset();
    setSearchParamsMock.mockReset();
    useSearchParamsMock.mockReturnValue([new URLSearchParams(), setSearchParamsMock]);
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
    expect(document.querySelectorAll(".lesson-reader-progress-item")).toHaveLength(1);
    expect(document.querySelector(".lesson-reader-progress-item")).toHaveTextContent("1 / 2");
  });

  it("moves focus to the scene title and announces the new position via a live region after navigating", () => {
    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("다음"));

    expect(screen.getByRole("heading", { name: "두 번째 장면" })).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("2 / 2, 두 번째 장면");
  });

  it("shows the overall course progress instead of the in-lesson position when a course outline is available", () => {
    useWikiDataMock.mockReturnValue({
      documents: [lessonDocument(), secondLessonDocument()],
      errorMessage: null,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    expect(document.querySelectorAll(".lesson-reader-progress-item")).toHaveLength(1);
    expect(document.querySelector(".lesson-reader-progress-item")).toHaveTextContent("1 / 4");
  });

  it("moves to the next scene when the next button is clicked", () => {
    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("다음"));

    expect(screen.getByText("두 번째 장면")).toBeInTheDocument();
    expect(document.querySelector(".lesson-reader-progress-item")).toHaveTextContent("2 / 2");
  });

  it("locks out a second rapid click during the scene transition instead of skipping ahead", () => {
    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("다음"));
    // Fired immediately, still inside the transition lock window — should be ignored,
    // not treated as "complete the lesson" (the second scene is also the last one).
    fireEvent.click(screen.getByText("다음"));

    expect(navigateMock).not.toHaveBeenCalled();
    expect(screen.getByText("두 번째 장면")).toBeInTheDocument();
  });

  it("does not start a transition lock when Home is pressed on the already-first scene", () => {
    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    fireEvent.keyDown(window, { key: "Home" });
    // A real transition (ArrowRight) fired right after should NOT be swallowed by a
    // no-op lock from the Home press above.
    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(screen.getByText("두 번째 장면")).toBeInTheDocument();
  });

  it("moves to the next scene on ArrowRight and back on ArrowLeft", async () => {
    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText("두 번째 장면")).toBeInTheDocument();

    // Waits out the scene-transition lock (see TRANSITION_LOCK_MS) so the second
    // navigation isn't swallowed by the lock left over from the first.
    await new Promise((resolve) => setTimeout(resolve, 450));

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByText("첫 번째 장면")).toBeInTheDocument();
  });

  it("ignores Space, PageDown, and PageUp so only ArrowLeft/ArrowRight navigate", () => {
    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    fireEvent.keyDown(window, { key: " " });
    fireEvent.keyDown(window, { key: "PageDown" });
    fireEvent.keyDown(window, { key: "PageUp" });

    expect(screen.getByText("첫 번째 장면")).toBeInTheDocument();
  });

  it("still ignores PageUp on the second scene instead of treating it as previous", async () => {
    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText("두 번째 장면")).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 450));

    fireEvent.keyDown(window, { key: "PageUp" });
    expect(screen.getByText("두 번째 장면")).toBeInTheDocument();
  });

  it("does not intercept ArrowRight when a button has focus", () => {
    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    const nextButton = screen.getByText("다음");
    nextButton.focus();
    fireEvent.keyDown(nextButton, { key: "ArrowRight" });

    expect(screen.getByText("첫 번째 장면")).toBeInTheDocument();
  });

  it("opens the course map (outline drawer) on the M key", () => {
    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: "m" });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("hides the diagnostics panel by default even when the lesson has issues", () => {
    useWikiDataMock.mockReturnValue({
      documents: [
        {
          ...lessonDocument(),
          presentation: {
            schemaVersion: 1,
            lessonId: "ai-first-perspective",
            theme: "ai-foundation",
            scenes: [presentationScene({ blocks: [] })],
          },
        },
      ],
      errorMessage: null,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    expect(screen.queryByText(/^진단 /)).not.toBeInTheDocument();
  });

  it("shows the diagnostics panel when ?diagnostics=1 is present and the lesson has issues", () => {
    useSearchParamsMock.mockReturnValue([new URLSearchParams("diagnostics=1"), setSearchParamsMock]);
    useWikiDataMock.mockReturnValue({
      documents: [
        {
          ...lessonDocument(),
          presentation: {
            schemaVersion: 1,
            lessonId: "ai-first-perspective",
            theme: "ai-foundation",
            scenes: [presentationScene({ blocks: [] })],
          },
        },
      ],
      errorMessage: null,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/^진단 /)).toBeInTheDocument();
    expect(screen.getByText(/장면에 콘텐츠가 없습니다/)).toBeInTheDocument();
  });

  it("shows the education description open by default and lets it be collapsed", () => {
    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("교육 설명")).toBeInTheDocument();
    expect(screen.getByText("숨겨진 대본")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "교육 설명 숨기기" }));
    expect(screen.queryByText("숨겨진 대본")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "교육 설명 보기" }));
    expect(screen.getByText("숨겨진 대본")).toBeInTheDocument();
  });

  it("shows the transitionToNext banner in both the bottom dock and the wide-screen side rail", () => {
    useWikiDataMock.mockReturnValue({
      documents: [
        {
          ...lessonDocument(),
          presentation: {
            schemaVersion: 1,
            lessonId: "ai-first-perspective",
            theme: "ai-foundation",
            scenes: [presentationScene({ transitionToNext: "다음 안내 문구" })],
          },
        },
      ],
      errorMessage: null,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    // CSS media queries decide which of the two copies is actually visible at a given
    // viewport width; jsdom doesn't evaluate them, so both render — assert both exist.
    expect(screen.getAllByText("다음: 다음 안내 문구")).toHaveLength(2);
    expect(document.querySelector(".lesson-reader-side-rail")).not.toBeNull();
  });

  it("disables the previous button on the first scene of the first lesson", () => {
    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("이전")).toBeDisabled();
  });

  it("navigates to the last scene of the previous lesson when going back from the first scene", () => {
    useWikiDataMock.mockReturnValue({
      documents: [lessonDocument(), secondLessonDocument()],
      errorMessage: null,
      isLoading: false,
    });
    useParamsMock.mockReturnValue({ slug: "context-and-memory" });

    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("이전")).not.toBeDisabled();

    fireEvent.click(screen.getByText("이전"));

    expect(navigateMock).toHaveBeenCalledWith("/lesson/ai-first-perspective?scene=1");
    expect(document.querySelector(".lesson-reader-stage")).toHaveAttribute("data-direction", "backward");
  });

  it("navigates to the lesson index after the last scene", async () => {
    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("다음"));
    await new Promise((resolve) => setTimeout(resolve, 450));
    fireEvent.click(screen.getByText("다음"));

    expect(navigateMock).toHaveBeenCalledWith("/lesson");
  });

  it("resets to the first scene when the route moves to a different lesson", () => {
    useWikiDataMock.mockReturnValue({
      documents: [lessonDocument(), secondLessonDocument()],
      errorMessage: null,
      isLoading: false,
    });

    const { rerender } = render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("다음"));
    expect(screen.getByText("두 번째 장면")).toBeInTheDocument();

    useParamsMock.mockReturnValue({ slug: "context-and-memory" });
    rerender(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("세 번째 장면")).toBeInTheDocument();
    expect(document.querySelector(".lesson-reader-progress-item")).toHaveTextContent("3 / 4");
  });

  it("applies the scene query param once lesson data finishes loading", () => {
    useSearchParamsMock.mockReturnValue([new URLSearchParams("scene=1"), setSearchParamsMock]);
    useWikiDataMock.mockReturnValue({
      documents: [],
      errorMessage: null,
      isLoading: true,
    });

    const { rerender } = render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("불러오는 중")).toBeInTheDocument();

    useWikiDataMock.mockReturnValue({
      documents: [lessonDocument()],
      errorMessage: null,
      isLoading: false,
    });
    rerender(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("두 번째 장면")).toBeInTheDocument();
    expect(document.querySelector(".lesson-reader-progress-item")).toHaveTextContent("2 / 2");
  });

  it("falls back to a valid clamped scene when the scene query param is fractional", () => {
    useSearchParamsMock.mockReturnValue([new URLSearchParams("scene=0.5"), setSearchParamsMock]);

    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("첫 번째 장면")).toBeInTheDocument();
    expect(document.querySelector(".lesson-reader-progress-item")).toHaveTextContent("1 / 2");
  });

  it("opens the outline drawer, jumps to a different lesson, and closes the drawer", () => {
    useWikiDataMock.mockReturnValue({
      documents: [lessonDocument(), secondLessonDocument()],
      errorMessage: null,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("학습 흐름"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("세 번째 장면")).toBeInTheDocument();

    fireEvent.click(screen.getByText("세 번째 장면"));

    expect(navigateMock).toHaveBeenCalledWith("/lesson/context-and-memory?scene=0");
  });

  it("jumps within the same lesson without navigating", () => {
    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("학습 흐름"));
    fireEvent.click(screen.getByText("두 번째 장면"));

    expect(navigateMock).not.toHaveBeenCalled();
    expect(screen.getByText("두 번째 장면")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps the scene query param in sync so a refresh restores the current scene", () => {
    render(
      <MemoryRouter>
        <LessonReaderPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("다음"));

    const lastCall = setSearchParamsMock.mock.calls.at(-1);
    const updater = lastCall?.[0] as (previous: URLSearchParams) => URLSearchParams;
    const result = updater(new URLSearchParams());

    expect(result.get("scene")).toBe("1");
    expect(lastCall?.[1]).toEqual({ replace: true });
  });
});
