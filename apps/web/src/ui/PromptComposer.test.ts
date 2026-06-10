import { describe, expect, it } from "vitest";
import { shouldSubmitComposerOnEnter } from "./PromptComposer";

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
