import { describe, expect, it } from "vitest";
import { isFullyUnsupportedSearchAnswerState, isNoPageStyleSearchAnswer } from "./searchAnswerState";

describe("searchAnswerState", () => {
  it("detects no-page style answers from visible answer text", () => {
    expect(isNoPageStyleSearchAnswer({
      answer: "현재 위키에 해당 주제에 대한 페이지가 없습니다. 관련 가이드가 필요하시면 IT 담당자에게 문의해 주세요.",
    })).toBe(true);
  });

  it("treats no-page style answers with empty evidence as fully unsupported even when unsupportedClaims is empty", () => {
    expect(isFullyUnsupportedSearchAnswerState({
      answer: "현재 위키에 해당 주제에 대한 페이지가 없습니다. 관련 가이드가 필요하시면 IT 담당자에게 문의해 주세요.",
      confluenceData: [],
      unsupportedClaims: [],
    })).toBe(true);
  });
});
