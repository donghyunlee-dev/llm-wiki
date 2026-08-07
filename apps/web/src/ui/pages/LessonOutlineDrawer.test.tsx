import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import type { CourseOutline } from "@sfood/wiki-core";
import { LessonOutlineDrawer } from "./LessonOutlineDrawer";

afterEach(() => {
  cleanup();
});

const outline: CourseOutline = {
  lessons: [
    {
      lessonId: "l1",
      slug: "lesson-1",
      title: "레슨 1",
      summary: "요약 1",
      scenes: [
        { id: "a", title: "장면 A" },
        { id: "b", title: "장면 B" },
      ],
      estimatedMinutes: 3,
    },
    {
      lessonId: "l2",
      slug: "lesson-2",
      title: "레슨 2",
      summary: "요약 2",
      scenes: [{ id: "c", title: "장면 C" }],
      estimatedMinutes: 2,
    },
  ],
  totalScenes: 3,
  totalEstimatedMinutes: 5,
};

function renderDrawer(overrides: Partial<Parameters<typeof LessonOutlineDrawer>[0]> = {}) {
  const triggerRef = createRef<HTMLButtonElement>();
  const onClose = vi.fn();
  const onSelectScene = vi.fn();

  render(
    <div>
      <button ref={triggerRef}>trigger</button>
      <LessonOutlineDrawer
        outline={outline}
        currentLessonSlug="lesson-1"
        currentSceneIndex={0}
        open
        onClose={onClose}
        onSelectScene={onSelectScene}
        triggerRef={triggerRef}
        {...overrides}
      />
    </div>,
  );

  return { triggerRef, onClose, onSelectScene };
}

describe("LessonOutlineDrawer chapter grouping", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows a chapter header once before the first lesson of that chapter, not repeated for every lesson in it", () => {
    const outlineWithChapters: CourseOutline = {
      lessons: [
        { ...outline.lessons[0], chapter: "챕터 1" },
        { ...outline.lessons[1], lessonId: "l3", slug: "lesson-3", title: "레슨 3", chapter: "챕터 1" },
        { ...outline.lessons[1], chapter: "챕터 2" },
      ],
      totalScenes: 4,
      totalEstimatedMinutes: 7,
    };
    const triggerRef = createRef<HTMLButtonElement>();

    render(
      <LessonOutlineDrawer
        outline={outlineWithChapters}
        currentLessonSlug="lesson-1"
        currentSceneIndex={0}
        open
        onClose={vi.fn()}
        onSelectScene={vi.fn()}
        triggerRef={triggerRef}
      />,
    );

    expect(screen.getAllByText("챕터 1")).toHaveLength(1);
    expect(screen.getByText("챕터 2")).toBeInTheDocument();
  });

  it("shows no chapter header when the outline has no chapter metadata", () => {
    render(
      <LessonOutlineDrawer
        outline={outline}
        currentLessonSlug="lesson-1"
        currentSceneIndex={0}
        open
        onClose={vi.fn()}
        onSelectScene={vi.fn()}
        triggerRef={createRef<HTMLButtonElement>()}
      />,
    );

    expect(document.querySelector(".lesson-outline-chapter-header")).not.toBeInTheDocument();
  });
});

describe("LessonOutlineDrawer", () => {
  it("does not render when closed", () => {
    render(
      <LessonOutlineDrawer
        outline={outline}
        currentLessonSlug="lesson-1"
        currentSceneIndex={0}
        open={false}
        onClose={vi.fn()}
        onSelectScene={vi.fn()}
        triggerRef={createRef<HTMLButtonElement>()}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lists every scene from the outline", () => {
    renderDrawer();

    expect(screen.getByText("장면 A")).toBeInTheDocument();
    expect(screen.getByText("장면 B")).toBeInTheDocument();
    expect(screen.getByText("장면 C")).toBeInTheDocument();
  });

  it("does not show the lesson title separately or the estimated minutes", () => {
    renderDrawer();

    expect(screen.queryByText("레슨 1")).not.toBeInTheDocument();
    expect(screen.queryByText("레슨 2")).not.toBeInTheDocument();
    expect(screen.queryByText("약 3분")).not.toBeInTheDocument();
    expect(screen.queryByText("약 2분")).not.toBeInTheDocument();
  });

  it("numbers scenes by their position in the whole course, not restarting at 1 for every lesson", () => {
    renderDrawer();

    expect(screen.getByText("장면 A").closest("button")?.querySelector(".lesson-outline-scene-index")).toHaveTextContent("1");
    expect(screen.getByText("장면 B").closest("button")?.querySelector(".lesson-outline-scene-index")).toHaveTextContent("2");
    expect(screen.getByText("장면 C").closest("button")?.querySelector(".lesson-outline-scene-index")).toHaveTextContent("3");
  });

  it("marks the current scene as current", () => {
    renderDrawer();

    expect(screen.getByText("장면 A").closest("button")).toHaveAttribute("aria-current", "true");
    expect(screen.getByText("장면 B").closest("button")).not.toHaveAttribute("aria-current");
  });

  it("calls onSelectScene with the lesson slug and scene index when a scene is clicked", () => {
    const { onSelectScene } = renderDrawer();

    fireEvent.click(screen.getByText("장면 C"));

    expect(onSelectScene).toHaveBeenCalledWith("lesson-2", 0);
  });

  it("closes on Escape and returns focus to the trigger button", () => {
    const { onClose, triggerRef } = renderDrawer();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalled();
    expect(document.activeElement).toBe(triggerRef.current);
  });

  it("closes when the backdrop is clicked but not when the panel itself is clicked", () => {
    const { onClose } = renderDrawer();

    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("dialog").parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalled();
  });

  it("moves focus to the close button when opened", () => {
    renderDrawer();

    expect(document.activeElement).toBe(screen.getByLabelText("학습 흐름 닫기"));
  });

  it("wraps focus from the last focusable element to the first on Tab", () => {
    renderDrawer();

    const lastFocusable = screen.getByText("장면 C").closest("button") as HTMLElement;
    lastFocusable.focus();

    fireEvent.keyDown(document, { key: "Tab" });

    expect(document.activeElement).toBe(screen.getByLabelText("학습 흐름 닫기"));
  });

  it("wraps focus from the first focusable element to the last on Shift+Tab", () => {
    renderDrawer();

    const firstFocusable = screen.getByLabelText("학습 흐름 닫기");
    firstFocusable.focus();

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });

    expect(document.activeElement).toBe(screen.getByText("장면 C").closest("button"));
  });

  it("recaptures focus to the first focusable element when focus escapes the panel and Tab is pressed", () => {
    const { triggerRef } = renderDrawer();

    triggerRef.current?.focus();

    fireEvent.keyDown(document, { key: "Tab" });

    expect(document.activeElement).toBe(screen.getByLabelText("학습 흐름 닫기"));
  });

  it("recaptures focus to the last focusable element when focus escapes the panel and Shift+Tab is pressed", () => {
    const { triggerRef } = renderDrawer();

    triggerRef.current?.focus();

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });

    expect(document.activeElement).toBe(screen.getByText("장면 C").closest("button"));
  });
});
