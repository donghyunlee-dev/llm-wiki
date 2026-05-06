import { describe, expect, it } from "vitest";
import {
  BLOCKED_UI_TERMS,
  HOME_CONTENT,
  collectVisibleText,
  validateHomePageContent,
} from "./homeContent";

describe("HOME_CONTENT", () => {
  it("keeps the required card and list counts", () => {
    const results = validateHomePageContent(HOME_CONTENT);

    expect(results.every((result) => result.pass)).toBe(true);
  });

  it("does not leak blocked user-facing terms", () => {
    const visibleText = collectVisibleText(HOME_CONTENT);

    for (const blockedTerm of BLOCKED_UI_TERMS) {
      expect(visibleText.includes(blockedTerm)).toBe(false);
    }
  });
});
