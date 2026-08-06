import { useEffect, useRef, type RefObject } from "react";

const MIN_HORIZONTAL_DISTANCE_PX = 48;
// 수직 편차가 이보다 크면 스와이프가 아니라 세로 스크롤/제스처 의도로 판단한다.
const MAX_VERTICAL_DEVIATION_PX = 60;

/**
 * 수평 스와이프를 좌우 Scene 이동으로 해석한다(설계서 "터치").
 * 인터랙티브 도형(예: iframe 도식) 내부에서 시작된 터치는 Pan으로 간주해 무시한다.
 */
export function useLessonSwipeNavigation(
  containerRef: RefObject<HTMLElement | null>,
  onNext: () => void,
  onPrevious: () => void,
  disabled: boolean,
): void {
  const startRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || disabled) {
      return;
    }

    function handleTouchStart(event: TouchEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-lesson-swipe-ignore], iframe")) {
        startRef.current = null;
        return;
      }

      const touch = event.touches[0];
      startRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
    }

    function handleTouchEnd(event: TouchEvent) {
      const start = startRef.current;
      startRef.current = null;

      if (!start) {
        return;
      }

      const touch = event.changedTouches[0];
      if (!touch) {
        return;
      }

      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;

      if (Math.abs(deltaY) > MAX_VERTICAL_DEVIATION_PX) {
        return;
      }

      if (Math.abs(deltaX) < MIN_HORIZONTAL_DISTANCE_PX) {
        return;
      }

      if (deltaX < 0) {
        onNext();
      } else {
        onPrevious();
      }
    }

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  });
}
