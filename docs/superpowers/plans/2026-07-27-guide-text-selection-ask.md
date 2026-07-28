# Guide Page Text-Selection-to-Ask Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a reader drag-select text inside a guide article's body and click a floating "질문하기" button that fills the bottom Ask panel's input with the selection and focuses it.

**Architecture:** Two existing components (`PromptComposer`, `ArticleAskPanel`) get a thin imperative-handle API (`focus()` / `fillAndFocus(text)`) via `forwardRef`/`useImperativeHandle`, with zero changes to their existing props/rendering. A new, fully independent component (`ArticleSelectionAskButton`) owns all selection-detection/positioning logic and knows nothing about the Ask panel — it just calls an `onAsk(text)` callback. `ArticlePage` is the only place that wires the two together via refs.

**Tech Stack:** React 19 (forwardRef/useImperativeHandle), Tailwind v4 (`@apply` + `@sfood/ui` semantic tokens), Vitest + `@testing-library/react`, Playwright MCP for manual browser verification.

---

## Reference: Approved Design

`docs/superpowers/specs/2026-07-27-guide-text-selection-ask-design.md` — read it once before starting; every task below implements one part of it. Scope is **`ArticlePage` only** — `StartingGuidePage` has no Ask panel and is explicitly out of scope.

## Reference: Current File Contents

- `apps/web/src/ui/PromptComposer.tsx` — the composer form, currently a plain function component with an internal `textareaRef`.
- `apps/web/src/ui/pages/ArticleAskPanel.tsx` — the fixed bottom panel, currently a plain function component with `question`/`turns`/`panelHeight` state.
- `apps/web/src/ui/pages/ArticlePage.tsx` — renders `<article className="article-body">` then `<aside className="article-aside">` inside `.article-layout`, then `<ArticleAskPanel documents={documents} pageId={document.id} />` as the last child.

---

### Task 1: `PromptComposer` exposes an imperative `focus()`

**Files:**
- Modify: `apps/web/src/ui/PromptComposer.tsx`
- Test: `apps/web/src/ui/PromptComposer.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `apps/web/src/ui/PromptComposer.test.ts`:

```ts
import { createElement, createRef } from "react";
import { render } from "@testing-library/react";
import {
  PromptComposer,
  shouldSubmitComposerOnEnter,
  type PromptComposerHandle,
} from "./PromptComposer";

describe("PromptComposer imperative handle", () => {
  it("focuses the textarea when ref.current.focus() is called", () => {
    const ref = createRef<PromptComposerHandle>();

    render(
      createElement(PromptComposer, {
        ref,
        value: "",
        onValueChange: () => {},
        onSubmit: () => {},
        placeholder: "질문을 입력하세요",
        ariaLabel: "문서 질문",
        buttonIcon: createElement("span", null, "전송"),
      }),
    );

    expect(document.activeElement?.tagName).not.toBe("TEXTAREA");

    ref.current?.focus();

    expect(document.activeElement?.tagName).toBe("TEXTAREA");
  });
});
```

The top of the file already imports `describe, expect, it` from `"vitest"` — no changes needed there, just add the two new imports above and the new `describe` block below the existing one.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @sfood/web test -- PromptComposer`
Expected: FAIL — `PromptComposerHandle` is not exported (TS error) and/or `ref` prop is ignored (no imperative handle wired yet).

- [ ] **Step 3: Convert `PromptComposer` to `forwardRef` and expose `focus()`**

Replace the full contents of `apps/web/src/ui/PromptComposer.tsx` with:

```tsx
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";

type PromptComposerProps = {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  ariaLabel: string;
  ariaDescribedBy?: string;
  className?: string;
  textareaClassName?: string;
  buttonClassName?: string;
  buttonAriaLabel?: string;
  buttonTitle?: string;
  buttonIcon: ReactNode;
  minRows?: number;
  maxRows?: number;
  disabled?: boolean;
  name?: string;
  autoFocus?: boolean;
};

export type PromptComposerHandle = {
  focus: () => void;
};

type ComposerKeyboardMeta = Pick<KeyboardEvent<HTMLTextAreaElement>, "key" | "shiftKey"> & {
  isComposing: boolean;
  keyCode?: number;
};

export function shouldSubmitComposerOnEnter(event: ComposerKeyboardMeta) {
  return (
    event.key === "Enter" &&
    !event.shiftKey &&
    !event.isComposing &&
    event.keyCode !== 229
  );
}

export const PromptComposer = forwardRef<PromptComposerHandle, PromptComposerProps>(
  function PromptComposer(
    {
      value,
      onValueChange,
      onSubmit,
      placeholder,
      ariaLabel,
      ariaDescribedBy,
      className,
      textareaClassName,
      buttonClassName,
      buttonAriaLabel,
      buttonTitle,
      buttonIcon,
      minRows = 2,
      maxRows = 8,
      disabled = false,
      name,
      autoFocus = false,
    },
    ref,
  ) {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const formClassName = ["prompt-composer", className].filter(Boolean).join(" ");
    const textareaMergedClassName = ["prompt-composer-textarea", textareaClassName].filter(Boolean).join(" ");
    const buttonMergedClassName = ["prompt-composer-button", buttonClassName].filter(Boolean).join(" ");

    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus();
      },
    }));

    useEffect(() => {
      const textarea = textareaRef.current;
      if (!textarea) {
        return;
      }

      const computedStyle = window.getComputedStyle(textarea);
      const lineHeight = Number.parseFloat(computedStyle.lineHeight || "0") || 24;
      const paddingTop = Number.parseFloat(computedStyle.paddingTop || "0");
      const paddingBottom = Number.parseFloat(computedStyle.paddingBottom || "0");
      const borderTop = Number.parseFloat(computedStyle.borderTopWidth || "0");
      const borderBottom = Number.parseFloat(computedStyle.borderBottomWidth || "0");
      const maxHeight = lineHeight * maxRows + paddingTop + paddingBottom + borderTop + borderBottom;

      textarea.style.height = "0px";
      const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${Math.max(nextHeight, lineHeight * minRows + paddingTop + paddingBottom + borderTop + borderBottom)}px`;
      textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
    }, [maxRows, minRows, value]);

    const submit = () => {
      if (disabled) {
        return;
      }

      onSubmit();
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      submit();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (
        shouldSubmitComposerOnEnter({
          key: event.key,
          shiftKey: event.shiftKey,
          isComposing: event.nativeEvent.isComposing,
          keyCode: event.nativeEvent.keyCode,
        })
      ) {
        event.preventDefault();
        submit();
      }
    };

    return (
      <form className={formClassName} onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          value={value}
          name={name}
          rows={minRows}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          className={textareaMergedClassName}
          disabled={disabled}
          autoFocus={autoFocus}
        />
        <button
          type="submit"
          className={buttonMergedClassName}
          aria-label={buttonAriaLabel ?? ariaLabel}
          title={buttonTitle ?? buttonAriaLabel ?? ariaLabel}
          disabled={disabled}
        >
          {buttonIcon}
        </button>
      </form>
    );
  },
);
```

Nothing else in this file changes — every prop, class, and behavior is identical to before; only the export mechanism (`forwardRef`) and the new `useImperativeHandle` call were added.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @sfood/web test -- PromptComposer`
Expected: PASS (4 tests: 3 existing `shouldSubmitComposerOnEnter` + 1 new imperative handle test)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/ui/PromptComposer.tsx apps/web/src/ui/PromptComposer.test.ts
git commit -m "feat: expose imperative focus() from PromptComposer"
```

---

### Task 2: `ArticleAskPanel` exposes an imperative `fillAndFocus(text)`

**Files:**
- Modify: `apps/web/src/ui/pages/ArticleAskPanel.tsx`
- Test: `apps/web/src/ui/pages/ArticleAskPanel.test.tsx`

- [ ] **Step 1: Write the failing test**

Append to `apps/web/src/ui/pages/ArticleAskPanel.test.tsx` (add `createRef` to the existing `react` import if not already there, and `render`/`screen` to the `@testing-library/react` import — the file currently only imports `renderToStaticMarkup` from `react-dom/server`, so add a second import line):

```tsx
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { ArticleAskPanel, type ArticleAskPanelHandle } from "./ArticleAskPanel";
```

Then append this block after the existing `describe("ArticleAskPanel", ...)` block:

```tsx
describe("ArticleAskPanel imperative handle", () => {
  it("fills the question input and focuses it when ref.current.fillAndFocus() is called", () => {
    const ref = createRef<ArticleAskPanelHandle>();

    render(
      <MemoryRouter>
        <ArticleAskPanel ref={ref} documents={[document()]} pageId="page-1" />
      </MemoryRouter>,
    );

    ref.current?.fillAndFocus("선택한 문장입니다");

    const textarea = screen.getByRole("textbox", { name: "문서 질문" });
    expect(textarea).toHaveValue("선택한 문장입니다");
    expect(document.activeElement).toBe(textarea);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @sfood/web test -- ArticleAskPanel`
Expected: FAIL — `ArticleAskPanelHandle` is not exported and/or the `ref` prop has no effect yet.

- [ ] **Step 3: Convert `ArticleAskPanel` to `forwardRef` and expose `fillAndFocus`**

In `apps/web/src/ui/pages/ArticleAskPanel.tsx`:

Change the import block at the top from:

```tsx
import {
  startTransition,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Link } from "react-router-dom";
import { getWikiDocumentByIdFrom, getWikiDocumentHref, stripTitleTypePrefix, type WikiDocument } from "@sfood/wiki-core";
import { getPolicyNoticeMessage, shouldShowPolicyNotice } from "../../lib/policyNotice";
import { StructuredAnswerView } from "../StructuredAnswerView";
import { PromptComposer } from "../PromptComposer";
```

to:

```tsx
import {
  forwardRef,
  startTransition,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Link } from "react-router-dom";
import { getWikiDocumentByIdFrom, getWikiDocumentHref, stripTitleTypePrefix, type WikiDocument } from "@sfood/wiki-core";
import { getPolicyNoticeMessage, shouldShowPolicyNotice } from "../../lib/policyNotice";
import { StructuredAnswerView } from "../StructuredAnswerView";
import { PromptComposer, type PromptComposerHandle } from "../PromptComposer";
```

Add this type right after the existing `AskTurn` type definition:

```tsx
export type ArticleAskPanelHandle = {
  fillAndFocus: (text: string) => void;
};
```

Change the component declaration from:

```tsx
export function ArticleAskPanel({
  documents,
  initialQuestion = "",
  pageId,
}: {
  documents: WikiDocument[];
  initialQuestion?: string;
  pageId: string;
}) {
  const [question, setQuestion] = useState(initialQuestion);
  const [turns, setTurns] = useState<AskTurn[]>([]);
  const [panelHeight, setPanelHeight] = useState(COLLAPSED_HEIGHT);
  const turnsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
```

to:

```tsx
export const ArticleAskPanel = forwardRef<
  ArticleAskPanelHandle,
  {
    documents: WikiDocument[];
    initialQuestion?: string;
    pageId: string;
  }
>(function ArticleAskPanel({ documents, initialQuestion = "", pageId }, ref) {
  const [question, setQuestion] = useState(initialQuestion);
  const [turns, setTurns] = useState<AskTurn[]>([]);
  const [panelHeight, setPanelHeight] = useState(COLLAPSED_HEIGHT);
  const turnsRef = useRef<HTMLDivElement | null>(null);
  const promptComposerRef = useRef<PromptComposerHandle | null>(null);

  useImperativeHandle(ref, () => ({
    fillAndFocus: (text: string) => {
      setQuestion(text);
      setPanelHeight((height) => Math.max(height, EXPANDED_HEIGHT));
      promptComposerRef.current?.focus();
    },
  }));

  useEffect(() => {
```

Change the `<PromptComposer` call (inside the returned JSX) from:

```tsx
      <PromptComposer
        value={question}
        onValueChange={setQuestion}
        onSubmit={submitQuestion}
```

to:

```tsx
      <PromptComposer
        ref={promptComposerRef}
        value={question}
        onValueChange={setQuestion}
        onSubmit={submitQuestion}
```

Finally, change the closing of the component. It currently ends with:

```tsx
    </section>
  );
}
```

Change the trailing `}` to `});` (closing the `forwardRef` call):

```tsx
    </section>
  );
});
```

No other lines in the file change — `submitQuestion`, `startResize`, `ArticleAskResult`, `ArticleAskLoading`, and `SendIcon` are untouched.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @sfood/web test -- ArticleAskPanel`
Expected: PASS (2 tests: existing SSR render test + new imperative handle test)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/ui/pages/ArticleAskPanel.tsx apps/web/src/ui/pages/ArticleAskPanel.test.tsx
git commit -m "feat: expose imperative fillAndFocus() from ArticleAskPanel"
```

---

### Task 3: New `ArticleSelectionAskButton` component

**Files:**
- Create: `apps/web/src/ui/pages/ArticleSelectionAskButton.tsx`
- Test: `apps/web/src/ui/pages/ArticleSelectionAskButton.test.tsx`
- Modify: `apps/web/src/styles.css`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/ui/pages/ArticleSelectionAskButton.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { ArticleSelectionAskButton } from "./ArticleSelectionAskButton";

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
  document.dispatchEvent(new Event("selectionchange"));
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @sfood/web test -- ArticleSelectionAskButton`
Expected: FAIL — the module `./ArticleSelectionAskButton` does not exist yet.

- [ ] **Step 3: Implement the component**

Create `apps/web/src/ui/pages/ArticleSelectionAskButton.tsx`:

```tsx
import { useCallback, useEffect, useState, type RefObject } from "react";

const MAX_SELECTION_LENGTH = 500;
const BUTTON_GAP = 8;
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
  containerRef: RefObject<HTMLElement>;
  onAsk: (text: string) => void;
}) {
  const [position, setPosition] = useState<ButtonPosition | null>(null);
  const [selectedText, setSelectedText] = useState("");

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

      if (!target.closest(".article-selection-ask-button")) {
        hide();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        hide();
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [containerRef, hide]);

  if (!position) {
    return null;
  }

  return (
    <button
      type="button"
      className="article-selection-ask-button"
      style={{
        top: position.top,
        left: position.left,
        transform: position.placement === "above" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
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
```

- [ ] **Step 4: Add the `.article-selection-ask-button` CSS class**

In `apps/web/src/styles.css`, inside the `@layer components { ... }` block, add this rule immediately before the existing `.article-ask {` rule:

```css
  .article-selection-ask-button {
    /* position:fixed so its top/left (set inline from the selection Range's
       getBoundingClientRect()) are viewport-relative, independent of scroll. */
    @apply fixed z-30 inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-accent px-3 py-1.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-accent-strong;
  }

```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @sfood/web test -- ArticleSelectionAskButton`
Expected: PASS (7 tests)

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/ui/pages/ArticleSelectionAskButton.tsx apps/web/src/ui/pages/ArticleSelectionAskButton.test.tsx apps/web/src/styles.css
git commit -m "feat: add ArticleSelectionAskButton for text-selection-to-ask"
```

---

### Task 4: Wire the button into `ArticlePage`

**Files:**
- Modify: `apps/web/src/ui/pages/ArticlePage.tsx`

- [ ] **Step 1: Add the new imports**

At the top of `apps/web/src/ui/pages/ArticlePage.tsx`, change:

```tsx
import { ArticleAskPanel } from "./ArticleAskPanel";
import { ArticleContentRenderer } from "./ArticleContentRenderer";
```

to:

```tsx
import { ArticleAskPanel, type ArticleAskPanelHandle } from "./ArticleAskPanel";
import { ArticleContentRenderer } from "./ArticleContentRenderer";
import { ArticleSelectionAskButton } from "./ArticleSelectionAskButton";
```

- [ ] **Step 2: Add the two new refs**

Right after the existing `const tocNavRef = useRef<HTMLElement | null>(null);` line, add:

```tsx
  const articleRef = useRef<HTMLElement | null>(null);
  const askPanelRef = useRef<ArticleAskPanelHandle | null>(null);
```

- [ ] **Step 3: Attach `articleRef` to the article body**

Change:

```tsx
        <article className="article-body">
          <p className="eyebrow">
```

to:

```tsx
        <article className="article-body" ref={articleRef}>
          <p className="eyebrow">
```

- [ ] **Step 4: Render the button and wire the ref into `ArticleAskPanel`**

Change the end of the component's return statement from:

```tsx
      <ArticleAskPanel documents={documents} pageId={document.id} />
    </div>
  );
}
```

to:

```tsx
      <ArticleSelectionAskButton
        containerRef={articleRef}
        onAsk={(text) => askPanelRef.current?.fillAndFocus(text)}
      />

      <ArticleAskPanel ref={askPanelRef} documents={documents} pageId={document.id} />
    </div>
  );
}
```

- [ ] **Step 5: Run the full web test suite and typecheck**

Run: `pnpm --filter @sfood/web typecheck`
Expected: PASS, no errors.

Run: `pnpm --filter @sfood/web test`
Expected: PASS, all test files green (existing `ArticlePage.test.tsx` suite must still pass unchanged since no existing behavior was touched).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/ui/pages/ArticlePage.tsx
git commit -m "feat: wire text-selection-to-ask button into ArticlePage"
```

---

### Task 5: Build, Playwright verification, Codex review

**Files:** none (validation only)

- [ ] **Step 1: Build**

Run: `pnpm --filter @sfood/web build`
Expected: PASS, no TypeScript or bundling errors.

- [ ] **Step 2: Manual Playwright MCP verification**

Start the dev server (`pnpm --filter @sfood/web dev --port 5183`), navigate to a real guide article route (e.g. `/guides/<any-guide-slug>`), then:

1. Use `browser_evaluate` to select a text range inside `.article-body` (construct a `Range` via `document.createRange()` + `selection.addRange()` on a real paragraph, then dispatch a `mouseup` — this simulates a drag-selection since Playwright cannot easily simulate a raw mouse drag across text baselines).
2. Screenshot to confirm the "질문하기" button appears above (or below, if near the top) the selection, styled with the accent color.
3. Click the button (`browser_click` on the button by its accessible name).
4. Confirm via `browser_evaluate` that the Ask panel's textarea now contains the selected text and is the active element (`document.activeElement`).
5. Repeat once with a selection that starts inside `.article-body` and ends outside (drag past the article boundary) and confirm the button does NOT appear — this exercises the "selection outside container" edge case with a real browser Selection object instead of the jsdom stand-in used in Task 3's tests.
6. Screenshot the button in both light and dark themes.
7. Resize to mobile (390x844) and repeat steps 1–4 once to confirm no layout regression (the button being `position: fixed` should behave identically).

Expected: All the above match the design (docs/superpowers/specs/2026-07-27-guide-text-selection-ask-design.md) — button appears/disappears correctly, click fills+focuses the Ask panel input, no horizontal overflow introduced.

- [ ] **Step 3: Codex critical review**

Run a diff of the four touched/created files (`git diff` + `git show` for the new file) through the Codex MCP tool, asking it to specifically check: (a) the `forwardRef`/`useImperativeHandle` wiring doesn't break existing `PromptComposer`/`ArticleAskPanel` consumers, (b) the selection/container-containment check handles edge cases (selection spanning into/out of the container, collapsed selection, no selection), (c) the scroll/outside-click/Escape hide handlers don't leak listeners or fire redundantly in a way that breaks the click-to-ask flow (in particular: does the `mousedown` "outside click" handler fire and hide the button before its own `click` handler can run?).

Address any concrete issues raised; re-run the affected tests after any fix.

- [ ] **Step 4: Commit any fixes from the review**

```bash
git add -A
git commit -m "fix: address Codex review findings for text-selection-to-ask"
```

(Skip this commit if the review found nothing to change.)

---

### Task 6: Task documentation

**Files:**
- Create: `docs/tasks/guide-page-text-selection-ask/spec.md`
- Create: `docs/tasks/guide-page-text-selection-ask/plan.md`
- Create: `docs/tasks/guide-page-text-selection-ask/tasks.md`
- Create: `docs/tasks/guide-page-text-selection-ask/test-result.md`
- Create: `docs/tasks/guide-page-text-selection-ask/result.md`
- Modify: `docs/prd/implementation-status.md`

- [ ] **Step 1: Create the task workspace mirroring the approved design/plan**

Create `docs/tasks/guide-page-text-selection-ask/spec.md` using the repo's `docs/tasks/_template/spec.md` structure, filled in from `docs/superpowers/specs/2026-07-27-guide-text-selection-ask-design.md` (Problem Statement/Scope/Out Of Scope/Scenarios/Acceptance Criteria map directly from that design doc's Problem/Goal/Scope/Out Of Scope/User Scenarios sections).

Create `docs/tasks/guide-page-text-selection-ask/plan.md` using the `docs/tasks/_template/plan.md` structure, summarizing this plan's Architecture/Impacted Modules (the four files from Tasks 1–4)/Validation Plan (Task 5).

Create `docs/tasks/guide-page-text-selection-ask/tasks.md` listing Tasks 1–5 above as checkboxes, mirroring the pattern used in `docs/tasks/guide-page-toc-sidebar-refresh/tasks.md`.

- [ ] **Step 2: Fill in results after implementation**

Create `docs/tasks/guide-page-text-selection-ask/test-result.md` recording the exact commands run in Task 5 and their pass/fail outcomes, plus the Codex review outcome, following the structure of `docs/tasks/guide-page-toc-sidebar-refresh/test-result.md`.

Create `docs/tasks/guide-page-text-selection-ask/result.md` summarizing delivered scope, changed files, key decisions, and open gaps (if any), following the structure of `docs/tasks/guide-page-toc-sidebar-refresh/result.md`.

- [ ] **Step 3: Update the session ledger**

Prepend a new dated entry under `## Latest Completed Work` in `docs/prd/implementation-status.md`, following the same format as the `### 2026-07-27 — 가이드 페이지 TOC 우측 분리...` entry already there: branch, background, what was implemented, validation performed, and a link to the task docs.

- [ ] **Step 4: Commit**

```bash
git add docs/tasks/guide-page-text-selection-ask/ docs/prd/implementation-status.md
git commit -m "docs: record guide page text-selection-to-ask task"
```

---

## Self-Review Notes

- **Spec coverage:** Task 1–2 implement the design's "PromptComposer 확장"/"ArticleAskPanel 확장" sections; Task 3 implements "새 컴포넌트: ArticleSelectionAskButton" (detection, positioning, truncation, dismiss rules) plus the "Testing" section's jsdom test list; Task 4 implements "ArticlePage 연결"/"Data Flow"; Task 5 covers the design's Playwright + Codex review requirement and the repo's mandatory `typecheck`/`test`/`build` gates; Task 6 covers the repo's `docs/tasks/{work-scope}/` convention.
- **Type consistency:** `ArticleSelectionAskButton`'s `onAsk: (text: string) => void` prop matches the callback `ArticlePage` passes (`(text) => askPanelRef.current?.fillAndFocus(text)`), which matches `ArticleAskPanelHandle.fillAndFocus(text: string)`, which matches `PromptComposerHandle.focus()` (no args) called internally. `containerRef: RefObject<HTMLElement>` matches `articleRef = useRef<HTMLElement | null>(null)` attached to the `<article>` element.
- **No placeholders:** every step above shows complete, runnable code — no "TBD"/"add validation" placeholders remain.
