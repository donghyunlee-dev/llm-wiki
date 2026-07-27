import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import "@testing-library/jest-dom/vitest";
import { ArticleSelectionAskButton } from "./ArticleSelectionAskButton";

// jsdom does not implement layout, so Range#getBoundingClientRect is not
// defined at all in this environment. Stub it so the component's positioning
// logic can run without throwing.
Range.prototype.getBoundingClientRect = function getBoundingClientRect() {
  return {
    top: 100,
    bottom: 120,
    left: 50,
    right: 150,
    width: 100,
    height: 20,
    x: 50,
    y: 100,
    toJSON() {
      return this;
    },
  } as DOMRect;
};

afterEach(() => {
  cleanup();
  window.getSelection()?.removeAllRanges();
});

function selectTextInside(element: Element) {
  const textNode = element.firstChild;

  if (!textNode) {
    throw new Error("element has no text node to select");
  }

  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(textNode);
  selection?.removeAllRanges();
  selection?.addRange(range);
  // React 18 batches updates from native (non-synthetic) event listeners, so the
  // selectionchange handler's state updates aren't flushed synchronously — wrap
  // in act() so assertions immediately after this call see the updated DOM.
  act(() => {
    document.dispatchEvent(new Event("selectionchange"));
  });
}

describe("ArticleSelectionAskButton", () => {
  it("shows a 질문하기 button when text is selected inside the container", () => {
    const containerRef = createRef<HTMLDivElement>();
    const onAsk = vi.fn();

    render(
      <div>
        <div ref={containerRef}>
          <p>선택할 문장입니다</p>
        </div>
        <ArticleSelectionAskButton containerRef={containerRef} onAsk={onAsk} />
      </div>,
    );

    selectTextInside(containerRef.current!.querySelector("p")!);

    expect(screen.getByRole("button", { name: /질문하기/ })).toBeInTheDocument();
  });

  it("does not show the button when the selection is outside the container", () => {
    const containerRef = createRef<HTMLDivElement>();
    const onAsk = vi.fn();

    render(
      <div>
        <div ref={containerRef}>
          <p>본문 문장</p>
        </div>
        <p id="outside">바깥 문장</p>
        <ArticleSelectionAskButton containerRef={containerRef} onAsk={onAsk} />
      </div>,
    );

    selectTextInside(document.getElementById("outside")!);

    expect(screen.queryByRole("button", { name: /질문하기/ })).not.toBeInTheDocument();
  });

  it("calls onAsk with the selected text and hides the button on click", () => {
    const containerRef = createRef<HTMLDivElement>();
    const onAsk = vi.fn();

    render(
      <div>
        <div ref={containerRef}>
          <p>선택할 문장입니다</p>
        </div>
        <ArticleSelectionAskButton containerRef={containerRef} onAsk={onAsk} />
      </div>,
    );

    selectTextInside(containerRef.current!.querySelector("p")!);
    fireEvent.click(screen.getByRole("button", { name: /질문하기/ }));

    expect(onAsk).toHaveBeenCalledWith("선택할 문장입니다");
    expect(screen.queryByRole("button", { name: /질문하기/ })).not.toBeInTheDocument();
  });

  it("truncates selections longer than 500 characters", () => {
    const containerRef = createRef<HTMLDivElement>();
    const onAsk = vi.fn();
    const longText = "가".repeat(600);

    render(
      <div>
        <div ref={containerRef}>
          <p>{longText}</p>
        </div>
        <ArticleSelectionAskButton containerRef={containerRef} onAsk={onAsk} />
      </div>,
    );

    selectTextInside(containerRef.current!.querySelector("p")!);
    fireEvent.click(screen.getByRole("button", { name: /질문하기/ }));

    const [calledWith] = onAsk.mock.calls[0] as [string];
    expect(calledWith).toHaveLength(503);
    expect(calledWith.endsWith("...")).toBe(true);
  });

  it("hides the button when the page scrolls", () => {
    const containerRef = createRef<HTMLDivElement>();
    const onAsk = vi.fn();

    render(
      <div>
        <div ref={containerRef}>
          <p>선택할 문장입니다</p>
        </div>
        <ArticleSelectionAskButton containerRef={containerRef} onAsk={onAsk} />
      </div>,
    );

    selectTextInside(containerRef.current!.querySelector("p")!);
    expect(screen.getByRole("button", { name: /질문하기/ })).toBeInTheDocument();

    fireEvent.scroll(window);

    expect(screen.queryByRole("button", { name: /질문하기/ })).not.toBeInTheDocument();
  });

  it("hides the button on Escape", () => {
    const containerRef = createRef<HTMLDivElement>();
    const onAsk = vi.fn();

    render(
      <div>
        <div ref={containerRef}>
          <p>선택할 문장입니다</p>
        </div>
        <ArticleSelectionAskButton containerRef={containerRef} onAsk={onAsk} />
      </div>,
    );

    selectTextInside(containerRef.current!.querySelector("p")!);
    expect(screen.getByRole("button", { name: /질문하기/ })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("button", { name: /질문하기/ })).not.toBeInTheDocument();
  });

  it("hides the button when clicking outside of it", () => {
    const containerRef = createRef<HTMLDivElement>();
    const onAsk = vi.fn();

    render(
      <div>
        <div ref={containerRef}>
          <p>선택할 문장입니다</p>
        </div>
        <button type="button">다른 버튼</button>
        <ArticleSelectionAskButton containerRef={containerRef} onAsk={onAsk} />
      </div>,
    );

    selectTextInside(containerRef.current!.querySelector("p")!);
    expect(screen.getByRole("button", { name: /질문하기/ })).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("button", { name: "다른 버튼" }));

    expect(screen.queryByRole("button", { name: /질문하기/ })).not.toBeInTheDocument();
  });

  it("places the button below the selection when there is not enough room above", () => {
    const originalGetBoundingClientRect = Range.prototype.getBoundingClientRect;
    Range.prototype.getBoundingClientRect = function getBoundingClientRect() {
      return {
        top: 10,
        bottom: 30,
        left: 100,
        width: 50,
        right: 150,
        height: 20,
        x: 100,
        y: 10,
        toJSON() {
          return this;
        },
      } as DOMRect;
    };

    try {
      const containerRef = createRef<HTMLDivElement>();
      const onAsk = vi.fn();

      render(
        <div>
          <div ref={containerRef}>
            <p>선택할 문장입니다</p>
          </div>
          <ArticleSelectionAskButton containerRef={containerRef} onAsk={onAsk} />
        </div>,
      );

      selectTextInside(containerRef.current!.querySelector("p")!);

      const button = screen.getByRole("button", { name: /질문하기/ });
      expect(button.style.transform).toBe("translate(-50%, 0)");
    } finally {
      Range.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    }
  });

  it("clamps the button's left position to the horizontal margin near the viewport edge", () => {
    const originalGetBoundingClientRect = Range.prototype.getBoundingClientRect;
    Range.prototype.getBoundingClientRect = function getBoundingClientRect() {
      return {
        top: 100,
        bottom: 120,
        left: 0,
        width: 10,
        right: 10,
        height: 20,
        x: 0,
        y: 100,
        toJSON() {
          return this;
        },
      } as DOMRect;
    };

    try {
      const containerRef = createRef<HTMLDivElement>();
      const onAsk = vi.fn();

      render(
        <div>
          <div ref={containerRef}>
            <p>선택할 문장입니다</p>
          </div>
          <ArticleSelectionAskButton containerRef={containerRef} onAsk={onAsk} />
        </div>,
      );

      selectTextInside(containerRef.current!.querySelector("p")!);

      const button = screen.getByRole("button", { name: /질문하기/ });
      expect(button.style.left).toBe("72px");
    } finally {
      Range.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    }
  });

  it("hides the button when the same-container selection collapses", () => {
    const containerRef = createRef<HTMLDivElement>();
    const onAsk = vi.fn();

    render(
      <div>
        <div ref={containerRef}>
          <p>선택할 문장입니다</p>
        </div>
        <ArticleSelectionAskButton containerRef={containerRef} onAsk={onAsk} />
      </div>,
    );

    selectTextInside(containerRef.current!.querySelector("p")!);
    expect(screen.getByRole("button", { name: /질문하기/ })).toBeInTheDocument();

    const selection = window.getSelection();
    act(() => {
      selection?.removeAllRanges();
      document.dispatchEvent(new Event("selectionchange"));
    });

    expect(screen.queryByRole("button", { name: /질문하기/ })).not.toBeInTheDocument();
  });
});
