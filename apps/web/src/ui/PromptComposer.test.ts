import { afterEach, describe, expect, it } from "vitest";
import { createElement, createRef } from "react";
import { cleanup, render } from "@testing-library/react";
import {
  PromptComposer,
  shouldSubmitComposerOnEnter,
  type PromptComposerHandle,
} from "./PromptComposer";

describe("shouldSubmitComposerOnEnter", () => {
  it("submits only on plain Enter", () => {
    expect(
      shouldSubmitComposerOnEnter({
        key: "Enter",
        shiftKey: false,
        isComposing: false,
      }),
    ).toBe(true);
  });

  it("keeps newline behavior on Shift+Enter", () => {
    expect(
      shouldSubmitComposerOnEnter({
        key: "Enter",
        shiftKey: true,
        isComposing: false,
      }),
    ).toBe(false);
  });

  it("does not submit while IME composition is active", () => {
    expect(
      shouldSubmitComposerOnEnter({
        key: "Enter",
        shiftKey: false,
        isComposing: true,
      }),
    ).toBe(false);

    expect(
      shouldSubmitComposerOnEnter({
        key: "Enter",
        shiftKey: false,
        isComposing: false,
        keyCode: 229,
      }),
    ).toBe(false);
  });
});

describe("PromptComposer imperative handle", () => {
  afterEach(() => {
    cleanup();
  });

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
