import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useLessonSwipeNavigation } from "./useLessonSwipeNavigation";

function touch(x: number, y: number): Touch {
  return { clientX: x, clientY: y } as Touch;
}

function fireTouchStart(target: HTMLElement, x: number, y: number) {
  const event = new Event("touchstart", { bubbles: true }) as unknown as TouchEvent;
  Object.defineProperty(event, "touches", { value: [touch(x, y)] });
  target.dispatchEvent(event);
}

function fireTouchEnd(target: HTMLElement, x: number, y: number) {
  const event = new Event("touchend", { bubbles: true }) as unknown as TouchEvent;
  Object.defineProperty(event, "changedTouches", { value: [touch(x, y)] });
  target.dispatchEvent(event);
}

describe("useLessonSwipeNavigation", () => {
  it("navigates next on a leftward swipe past the minimum distance", () => {
    const container = document.createElement("div");
    const onNext = vi.fn();
    const onPrevious = vi.fn();

    renderHook(() => useLessonSwipeNavigation({ current: container }, onNext, onPrevious, false));

    fireTouchStart(container, 200, 100);
    fireTouchEnd(container, 140, 100);

    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrevious).not.toHaveBeenCalled();
  });

  it("navigates previous on a rightward swipe past the minimum distance", () => {
    const container = document.createElement("div");
    const onNext = vi.fn();
    const onPrevious = vi.fn();

    renderHook(() => useLessonSwipeNavigation({ current: container }, onNext, onPrevious, false));

    fireTouchStart(container, 100, 100);
    fireTouchEnd(container, 160, 100);

    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onNext).not.toHaveBeenCalled();
  });

  it("ignores a short horizontal move below the minimum distance", () => {
    const container = document.createElement("div");
    const onNext = vi.fn();
    const onPrevious = vi.fn();

    renderHook(() => useLessonSwipeNavigation({ current: container }, onNext, onPrevious, false));

    fireTouchStart(container, 100, 100);
    fireTouchEnd(container, 120, 100);

    expect(onNext).not.toHaveBeenCalled();
    expect(onPrevious).not.toHaveBeenCalled();
  });

  it("ignores a mostly-vertical drag (scroll gesture, not a swipe)", () => {
    const container = document.createElement("div");
    const onNext = vi.fn();
    const onPrevious = vi.fn();

    renderHook(() => useLessonSwipeNavigation({ current: container }, onNext, onPrevious, false));

    fireTouchStart(container, 100, 100);
    fireTouchEnd(container, 40, 260);

    expect(onNext).not.toHaveBeenCalled();
    expect(onPrevious).not.toHaveBeenCalled();
  });

  it("ignores a touch that starts on an interactive element (e.g. an iframe diagram)", () => {
    const container = document.createElement("div");
    const iframe = document.createElement("iframe");
    container.appendChild(iframe);
    const onNext = vi.fn();
    const onPrevious = vi.fn();

    renderHook(() => useLessonSwipeNavigation({ current: container }, onNext, onPrevious, false));

    fireTouchStart(iframe, 200, 100);
    fireTouchEnd(container, 140, 100);

    expect(onNext).not.toHaveBeenCalled();
  });

  it("does nothing when disabled", () => {
    const container = document.createElement("div");
    const onNext = vi.fn();
    const onPrevious = vi.fn();

    renderHook(() => useLessonSwipeNavigation({ current: container }, onNext, onPrevious, true));

    fireTouchStart(container, 200, 100);
    fireTouchEnd(container, 100, 100);

    expect(onNext).not.toHaveBeenCalled();
  });
});
