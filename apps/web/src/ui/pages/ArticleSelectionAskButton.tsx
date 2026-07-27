import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

const MAX_SELECTION_LENGTH = 500;
const BUTTON_GAP = 8;
// Minimum vertical space needed above the selection to place the button
// above it without pushing it off-screen; falls back to "below" otherwise.
const MIN_TOP_ROOM = 48;
const HORIZONTAL_MARGIN = 72;

type ButtonPosition = {
  top: number;
  left: number;
  placement: "above" | "below";
};

function truncateSelection(text: string): string {
  if (text.length <= MAX_SELECTION_LENGTH) {
    return text;
  }

  return `${text.slice(0, MAX_SELECTION_LENGTH)}...`;
}

function isSelectionInsideContainer(selection: Selection, container: HTMLElement): boolean {
  const { anchorNode, focusNode } = selection;

  if (!anchorNode || !focusNode) {
    return false;
  }

  return container.contains(anchorNode) && container.contains(focusNode);
}

export function ArticleSelectionAskButton({
  containerRef,
  onAsk,
}: {
  containerRef: RefObject<HTMLElement | null>;
  onAsk: (text: string) => void;
}) {
  const [position, setPosition] = useState<ButtonPosition | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const hide = useCallback(() => {
    setPosition(null);
    setSelectedText("");
  }, []);

  useEffect(() => {
    const handleSelectionChange = () => {
      const container = containerRef.current;
      const selection = window.getSelection();

      if (!container || !selection || selection.isCollapsed || selection.rangeCount === 0) {
        hide();
        return;
      }

      const text = selection.toString().trim();

      if (!text || !isSelectionInsideContainer(selection, container)) {
        hide();
        return;
      }

      const rect = selection.getRangeAt(0).getBoundingClientRect();
      const placement: ButtonPosition["placement"] = rect.top > MIN_TOP_ROOM ? "above" : "below";
      const top = placement === "above" ? rect.top - BUTTON_GAP : rect.bottom + BUTTON_GAP;
      const left = Math.min(
        Math.max(rect.left + rect.width / 2, HORIZONTAL_MARGIN),
        window.innerWidth - HORIZONTAL_MARGIN,
      );

      setSelectedText(text);
      setPosition({ top, left, placement });
    };

    const handleScroll = () => {
      hide();
    };

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (!buttonRef.current?.contains(target)) {
        hide();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        hide();
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("scroll", handleScroll, { capture: true });
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [containerRef, hide]);

  if (!position) {
    return null;
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      className="article-selection-ask-button"
      style={{
        top: position.top,
        left: position.left,
        transform: position.placement === "above" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
      }}
      onMouseDown={(event) => {
        event.preventDefault();
      }}
      onClick={() => {
        onAsk(truncateSelection(selectedText));
        hide();
      }}
    >
      <AskIcon />
      질문하기
    </button>
  );
}

function AskIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3.5 w-3.5">
      <path
        d="M10 2a6 6 0 0 0-4 10.472V15l2.2-1.257A6.02 6.02 0 0 0 10 14a6 6 0 1 0 0-12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
