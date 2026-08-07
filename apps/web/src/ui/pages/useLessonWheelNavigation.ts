import { useEffect, useRef, type RefObject } from "react";

const WHEEL_THRESHOLD_MOUSE = 80;
const WHEEL_THRESHOLD_TRACKPAD = 120;
// 트랙패드는 한 이벤트당 deltaY가 작고 연속적으로 여러 번 발생하는 반면, 일반 마우스 휠은
// 한 노치당 deltaY가 크게(대개 100 안팎) 한 번씩 발생한다 — 완벽한 구분은 불가능하지만
// 누적을 시작하는 첫 이벤트의 크기로 장치를 추정한다(설계서 "일반 휠 80, 트랙패드 120").
const TRACKPAD_DELTA_GUESS_MAX = 50;
const NAVIGATION_LOCK_MS = 450;

/**
 * 세로 휠 입력을 좌우 Scene 이동으로 해석한다(설계서 "마우스 휠과 트랙패드").
 * deltaY 누적이 임계치를 넘을 때만 1회 이동하고, 이동 직후 잠깐 같은 입력을 잠근다.
 */
export function useLessonWheelNavigation(
  containerRef: RefObject<HTMLElement | null>,
  onNext: () => void,
  onPrevious: () => void,
  disabled: boolean,
): void {
  const accumulatedRef = useRef(0);
  const thresholdRef = useRef(WHEEL_THRESHOLD_MOUSE);
  const lockedRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || disabled) {
      return;
    }

    function handleWheel(event: WheelEvent) {
      if (lockedRef.current) {
        return;
      }

      if (accumulatedRef.current !== 0 && Math.sign(event.deltaY) !== Math.sign(accumulatedRef.current)) {
        accumulatedRef.current = 0;
      }

      if (accumulatedRef.current === 0) {
        thresholdRef.current =
          Math.abs(event.deltaY) < TRACKPAD_DELTA_GUESS_MAX ? WHEEL_THRESHOLD_TRACKPAD : WHEEL_THRESHOLD_MOUSE;
      }

      accumulatedRef.current += event.deltaY;

      if (Math.abs(accumulatedRef.current) < thresholdRef.current) {
        return;
      }

      event.preventDefault();
      const direction = accumulatedRef.current > 0 ? "next" : "previous";
      accumulatedRef.current = 0;
      lockedRef.current = true;
      window.setTimeout(() => {
        lockedRef.current = false;
      }, NAVIGATION_LOCK_MS);

      if (direction === "next") {
        onNext();
      } else {
        onPrevious();
      }
    }

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  });
}
