import type { CourseOutline } from "@sfood/wiki-core";
import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export type LessonOutlineDrawerProps = {
  outline: CourseOutline;
  currentLessonSlug: string;
  currentSceneIndex: number;
  open: boolean;
  onClose: () => void;
  onSelectScene: (lessonSlug: string, sceneIndex: number) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
};

export function LessonOutlineDrawer({
  outline,
  currentLessonSlug,
  currentSceneIndex,
  open,
  onClose,
  onSelectScene,
  triggerRef,
}: LessonOutlineDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    closeButtonRef.current?.focus();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        triggerRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );

      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!panelRef.current.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      triggerRef.current?.focus();
    };
  }, [open, onClose, triggerRef]);

  if (!open) {
    return null;
  }

  return (
    <div className="lesson-outline-backdrop" onClick={onClose}>
      <div
        ref={panelRef}
        className="lesson-outline-panel"
        role="dialog"
        aria-modal="true"
        aria-label="학습 흐름"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="lesson-outline-panel-header">
          <span className="lesson-outline-panel-title">학습 흐름</span>
          <button
            type="button"
            ref={closeButtonRef}
            className="lesson-outline-close-button"
            onClick={onClose}
            aria-label="학습 흐름 닫기"
          >
            ×
          </button>
        </header>

        <nav className="lesson-outline-list">
          {outline.lessons.map((lesson, lessonIndex) => (
            <div key={lesson.lessonId}>
              {lesson.chapter && lesson.chapter !== outline.lessons[lessonIndex - 1]?.chapter ? (
                <p className="lesson-outline-chapter-header">{lesson.chapter}</p>
              ) : null}
              <ol className="lesson-outline-scene-list">
                {lesson.scenes.map((scene, index) => {
                  const isCurrent = lesson.slug === currentLessonSlug && index === currentSceneIndex;

                  return (
                    <li key={scene.id}>
                      <button
                        type="button"
                        className={
                          isCurrent
                            ? "lesson-outline-scene-button lesson-outline-scene-button-current"
                            : "lesson-outline-scene-button"
                        }
                        onClick={() => onSelectScene(lesson.slug, index)}
                        aria-current={isCurrent ? "true" : undefined}
                      >
                        <span className="lesson-outline-scene-index">{index + 1}</span>
                        <span>{scene.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
