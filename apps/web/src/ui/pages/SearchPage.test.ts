import { describe, expect, it } from "vitest";
import { buildSupplementalAnswerText } from "./SearchPage";

const baseAnswer = {
  answer: "MCP 설정은 가이드 흐름을 따라가면 됩니다.",
  policyNotice: {
    isPolicyRelated: false,
    message: "",
  },
  immediateActions: [],
  exampleCommands: [],
  verificationChecks: [],
  cautions: [],
  confluenceData: [],
  unsupportedClaims: [],
};

describe("buildSupplementalAnswerText", () => {
  it("keeps structured search details visible without styled duplicate sections", () => {
    const text = buildSupplementalAnswerText({
      ...baseAnswer,
      immediateActions: [{ text: "시작 가이드를 먼저 엽니다.", relatedPageIds: ["1"] }],
      verificationChecks: [{ text: "연결 상태를 확인합니다.", relatedPageIds: ["1"] }],
      cautions: [{ text: "권한을 먼저 확인합니다.", relatedPageIds: ["1"] }],
    });

    expect(text).toContain("이어서 보면 좋은 흐름은 아래처럼 정리할 수 있어요.");
    expect(text).toContain("- 시작 가이드를 먼저 엽니다.");
    expect(text).toContain("마지막에는 아래 항목만 가볍게 확인하면 됩니다.");
    expect(text).toContain("- 연결 상태를 확인합니다.");
    expect(text).toContain("진행 전에 놓치기 쉬운 점도 함께 보면 좋아요.");
    expect(text).toContain("- 권한을 먼저 확인합니다.");
    expect(text).not.toContain("바로 할 일");
    expect(text).not.toContain("확인 포인트");
    expect(text).not.toContain("주의\n");
  });

  it("does not repeat details already present in the answer body", () => {
    const text = buildSupplementalAnswerText({
      ...baseAnswer,
      answer: "MCP 설정은 가이드 흐름을 따라가면 됩니다. 시작 가이드를 먼저 엽니다.",
      immediateActions: [{ text: "시작 가이드를 먼저 엽니다.", relatedPageIds: ["1"] }],
    });

    expect(text).toBe("");
  });
});
