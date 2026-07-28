import { describe, expect, it } from "vitest";
import { isFullyUnsupportedSearchAnswerState, isNoPageStyleSearchAnswer } from "./searchAnswerState";

describe("searchAnswerState", () => {
  it("detects no-page style answers from visible answer text", () => {
    expect(isNoPageStyleSearchAnswer({
      answer: "현재 위키에 해당 주제에 대한 페이지가 없습니다. 관련 가이드가 필요하시면 IT 담당자에게 문의해 주세요.",
    })).toBe(true);
  });

  it("treats empty confluenceData as fully unsupported regardless of unsupportedClaims", () => {
    expect(isFullyUnsupportedSearchAnswerState({
      answer: "현재 위키에 해당 주제에 대한 페이지가 없습니다. 관련 가이드가 필요하시면 IT 담당자에게 문의해 주세요.",
      confluenceData: [],
      unsupportedClaims: [],
    })).toBe(true);
  });

  it("treats empty confluenceData as fully unsupported even when the AI's answer text drifts from the hardcoded no-page phrasing and leaves unsupportedClaims empty", () => {
    // Regression for a real production case: the model answered "I'm sorry, but 현재 위키에
    // ...라는 주제로 정리된 페이지가 없습니다" (neither the exact hardcoded prefix nor a filled
    // unsupportedClaims), which previously let recommendedDocuments/relatedDocuments leak through.
    expect(isFullyUnsupportedSearchAnswerState({
      answer: "I'm sorry, but 현재 위키에 \"claude dispatch\"라는 주제로 정리된 페이지가 없습니다. 관련 가이드를 원하시면 IT 담당자에게 문의해 주세요.",
      confluenceData: [],
      unsupportedClaims: [],
    })).toBe(true);
  });

  it("treats non-empty confluenceData as supported even when unsupportedClaims is present", () => {
    expect(isFullyUnsupportedSearchAnswerState({
      answer: "정상 답변입니다.",
      confluenceData: [{ pageId: "1" }],
      unsupportedClaims: ["일부 확인 필요한 내용"],
    })).toBe(false);
  });
});
