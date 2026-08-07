import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useLessonWheelNavigation } from "./useLessonWheelNavigation";

function fireWheel(target: HTMLElement, deltaY: number) {
  target.dispatchEvent(new WheelEvent("wheel", { deltaY, cancelable: true }));
}

describe("useLessonWheelNavigation", () => {
  it("does not navigate before the accumulated deltaY reaches the threshold", () => {
    const container = document.createElement("div");
    const onNext = vi.fn();
    const onPrevious = vi.fn();

    renderHook(() =>
      useLessonWheelNavigation({ current: container }, onNext, onPrevious, false),
    );

    fireWheel(container, 40);
    fireWheel(container, 40);

    expect(onNext).not.toHaveBeenCalled();
  });

  it("navigates next once the accumulated deltaY passes the threshold", () => {
    const container = document.createElement("div");
    const onNext = vi.fn();
    const onPrevious = vi.fn();

    renderHook(() =>
      useLessonWheelNavigation({ current: container }, onNext, onPrevious, false),
    );

    fireWheel(container, 60);
    fireWheel(container, 60);

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("navigates previous for upward scroll", () => {
    const container = document.createElement("div");
    const onNext = vi.fn();
    const onPrevious = vi.fn();

    renderHook(() =>
      useLessonWheelNavigation({ current: container }, onNext, onPrevious, false),
    );

    fireWheel(container, -150);

    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onNext).not.toHaveBeenCalled();
  });

  it("locks out further navigation immediately after triggering one move", () => {
    const container = document.createElement("div");
    const onNext = vi.fn();
    const onPrevious = vi.fn();

    renderHook(() =>
      useLessonWheelNavigation({ current: container }, onNext, onPrevious, false),
    );

    fireWheel(container, 150);
    fireWheel(container, 150);

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("uses the lower mouse-wheel threshold (80) for large per-event deltas", () => {
    const container = document.createElement("div");
    const onNext = vi.fn();
    const onPrevious = vi.fn();

    renderHook(() =>
      useLessonWheelNavigation({ current: container }, onNext, onPrevious, false),
    );

    fireWheel(container, 79);
    expect(onNext).not.toHaveBeenCalled();

    fireWheel(container, 2);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("uses the higher trackpad threshold (120) for small per-event deltas", () => {
    const container = document.createElement("div");
    const onNext = vi.fn();
    const onPrevious = vi.fn();

    renderHook(() =>
      useLessonWheelNavigation({ current: container }, onNext, onPrevious, false),
    );

    // Small first delta (<50) is classified as trackpad — 81 total would already
    // cross the mouse threshold (80) but must not cross the trackpad one (120).
    fireWheel(container, 20);
    fireWheel(container, 20);
    fireWheel(container, 20);
    fireWheel(container, 21);
    expect(onNext).not.toHaveBeenCalled();

    fireWheel(container, 40);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("does nothing when disabled", () => {
    const container = document.createElement("div");
    const onNext = vi.fn();
    const onPrevious = vi.fn();

    renderHook(() =>
      useLessonWheelNavigation({ current: container }, onNext, onPrevious, true),
    );

    fireWheel(container, 150);

    expect(onNext).not.toHaveBeenCalled();
  });
});
