import { describe, expect, it } from "vitest";
import {
  DEFAULT_POLICY_NOTICE_MESSAGE,
  getPolicyNoticeMessage,
  shouldShowPolicyNotice,
} from "./policyNotice";

describe("policy notice view helpers", () => {
  it("shows a policy notice when sources exist even if the model message is empty", () => {
    const notice = {
      isPolicyRelated: true,
      message: "",
      sources: [{ id: "policy-1", title: "Policy", href: "https://example.com/policy" }],
    };

    expect(shouldShowPolicyNotice(notice)).toBe(true);
    expect(getPolicyNoticeMessage(notice)).toBe(DEFAULT_POLICY_NOTICE_MESSAGE);
  });

  it("hides unrelated policy notices without sources or message", () => {
    expect(shouldShowPolicyNotice({ isPolicyRelated: false, message: "", sources: [] })).toBe(false);
  });
});
