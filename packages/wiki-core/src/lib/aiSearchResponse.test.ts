import { describe, expect, it } from "vitest";
import { parseAiSearchResponseText } from "./aiSearchResponse";

describe("parseAiSearchResponseText", () => {
  it("parses normal JSON search responses", () => {
    const result = parseAiSearchResponseText(JSON.stringify({
      answer: "짧답: 설치 후 확인하세요.",
      title: "설치 방법 안내",
      policyNotice: {
        isPolicyRelated: true,
        message: "정책 반영",
        sources: [{ id: "policy-1", title: "Search Policy", href: "https://example.com/policy" }],
      },
      immediateActions: [{ text: "설치한다", relatedPageIds: ["1"] }],
      exampleCommands: ["npm install -g tool"],
      verificationChecks: [{ text: "버전 확인", relatedPageIds: ["1"] }],
      cautions: [{ text: "권한 확인", relatedPageIds: ["1"] }],
      confluenceData: [{ pageId: "1", title: "Guide", quote: "근거" }],
      unsupportedClaims: [],
      recommendedPages: [{ pageId: "1", title: "Guide", reason: "추천" }],
    }));

    expect(result.policyNotice.isPolicyRelated).toBe(true);
    expect(result.policyNotice.sources).toEqual([
      { id: "policy-1", title: "Search Policy", href: "https://example.com/policy" },
    ]);
    expect(result.answer).toBe("설치 후 확인하세요.");
    expect(result.title).toBe("설치 방법 안내");
    expect(result.immediateActions).toEqual([{ text: "설치한다", relatedPageIds: ["1"] }]);
    expect(result.confluenceData).toHaveLength(1);
    expect(result.recommendedPages).toHaveLength(1);
  });

  it("recovers labeled schema fragments leaked into the answer text", () => {
    const leaked = `짧답: Windows에서 Claude Code(CLI)는 Node.js 18+ 환경에서 npm으로 전역 설치한 뒤 claude 명령으로 실행합니다.

바로 할 일

1) Node.js 18 이상 설치 확인

예시

\`\`\`bash
npm install -g @anthropic-ai/claude-code
\`\`\`

policyNotice: {"isPolicyRelated": true, "message": "정책 반영"}

immediateActions: [
  {"text":"Node.js 18 이상 설치 확인","relatedPageIds":["100"]},
  {"text":"npm으로 전역 설치","relatedPageIds":["88211499"]}
]

exampleCommands: [
  "npm install -g @anthropic-ai/claude-code",
  "claude doctor"
]

verificationChecks: [
  {"text":"Node.js 버전 확인","relatedPageIds":["100"]},
  {"text":"claude doctor 실행","relatedPageIds":["88211499"]}
]

cautions: [
  {"text":"Windows에서는 WSL 권장","relatedPageIds":["88211499"]}
]

confluenceData: [
  {"pageId":"88211499","title":"[Guide] Claude CLI Setup","quote":"Node.js 18 이상이 필요합니다."}
],

unsupportedClaims: [],

recommendedPages: [
  {"pageId":"88211499","title":"[Guide] Claude CLI Setup","reason":"설치 절차를 직접 다룹니다."}
]
}_invalid_markdown_error_for_ui_providers_due_to_schema_json`;

    const result = parseAiSearchResponseText(leaked);

    expect(result.answer).toContain("바로 할 일");
    expect(result.answer).not.toContain("짧답:");
    expect(result.answer).not.toContain("policyNotice:");
    expect(result.policyNotice).toEqual({
      isPolicyRelated: true,
      message: "정책 반영",
      sources: [],
    });
    expect(result.immediateActions).toHaveLength(2);
    expect(result.immediateActions[0]?.relatedPageIds).toEqual(["100"]);
    expect(result.exampleCommands[0]).toContain("@anthropic-ai/claude-code");
    expect(result.confluenceData[0]?.pageId).toBe("88211499");
    expect(result.recommendedPages[0]?.title).toBe("[Guide] Claude CLI Setup");
  });
});
