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

  it("lists every lesson and scene from the outline", () => {
    renderDrawer();

    expect(screen.getByText("레슨 1")).toBeInTheDocument();
    expect(screen.getByText("레슨 2")).toBeInTheDocument();
    expect(screen.getByText("장면 A")).toBeInTheDocument();
    expect(screen.getByText("장면 B")).toBeInTheDocument();
    expect(screen.getByText("장면 C")).toBeInTheDocument();
    expect(screen.getByText("약 3분")).toBeInTheDocument();
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
});
