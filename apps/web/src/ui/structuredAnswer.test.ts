import { describe, expect, it } from "vitest";
import { filterVisibleAnswerBlocks, normalizeAnswerText, splitAnswerBlocks } from "./structuredAnswer";
import { isStandaloneCommandText, splitReadableParagraphText } from "./StructuredAnswerView";

describe("splitAnswerBlocks", () => {
  it("splits newline-numbered instructions into an ordered list", () => {
    expect(splitAnswerBlocks("1. 먼저 설정한다\n2. 재시작한다\n3. 확인한다")).toEqual([
      {
        type: "list",
        ordered: true,
        items: ["먼저 설정한다", "재시작한다", "확인한다"],
      },
    ]);
  });

  it("keeps inline numbered prose as a paragraph", () => {
    expect(splitAnswerBlocks("1. 먼저 설정한다 2. 재시작한다 3. 확인한다")).toEqual([
      { type: "paragraph", text: "1. 먼저 설정한다 2. 재시작한다 3. 확인한다" },
    ]);
  });

  it("keeps a single numbered line as a paragraph", () => {
    expect(splitAnswerBlocks("1. 먼저 설정한다")).toEqual([
      { type: "paragraph", text: "1. 먼저 설정한다" },
    ]);
  });

  it("keeps ordinary prose as a paragraph", () => {
    expect(splitAnswerBlocks("먼저 설정한 뒤 확인합니다. 문제가 있으면 다시 점검합니다.")).toEqual([
      { type: "paragraph", text: "먼저 설정한 뒤 확인합니다. 문제가 있으면 다시 점검합니다." },
    ]);
  });

  it("recognizes headings, quotes, and code blocks", () => {
    expect(splitAnswerBlocks("## 설정\n> 주의\n```ts\nconst a = 1;\n```")).toEqual([
      { type: "heading", level: 2, text: "설정" },
      { type: "quote", text: "주의" },
      { type: "code", language: "ts", code: "const a = 1;" },
    ]);
  });

  it("recognizes callouts and markdown tables", () => {
    expect(splitAnswerBlocks("> [!info] 참고\n> 추가 설명\n| 항목 | 값 |\n| --- | --- |\n| A | B |")).toEqual([
      {
        type: "callout",
        kind: "info",
        body: "참고 추가 설명",
      },
      {
        type: "table",
        headers: ["항목", "값"],
        rows: [["A", "B"]],
      },
    ]);
  });

  it("extracts the answer text from a JSON-like payload", () => {
    expect(
      normalizeAnswerText(JSON.stringify({
        answer: "## 설정\n1. 먼저 확인한다",
        confluenceData: [],
        unsupportedClaims: [],
        recommendedPages: [],
      })),
    ).toBe("## 설정\n1. 먼저 확인한다");
  });

  it("strips leaked schema sections and provider markers from plain text answers", () => {
    expect(
      normalizeAnswerText(
        "설치 후 확인하세요.\n\nconfluenceData\n[{\"pageId\":\"1\"}]\n\nunsupportedClaims\n[\"숨김\"]\nPMID:0.json.gz",
      ),
    ).toBe("설치 후 확인하세요.");
  });

  it("strips visible answer prefixes before rendering", () => {
    expect(normalizeAnswerText("짧답: 먼저 설치한 뒤 확인합니다.")).toBe("먼저 설치한 뒤 확인합니다.");
  });

  it("filters semantic evidence sections from visible blocks", () => {
    expect(
      filterVisibleAnswerBlocks(
        splitAnswerBlocks(
          "설치 후 확인하세요.\n\n지원되는 환경\n- Windows\n- macOS\n\n문서 인용\n- 또 다른 근거\n\n## 다음 단계\n계속 진행합니다.",
        ),
      ),
    ).toEqual([
      { type: "paragraph", text: "설치 후 확인하세요." },
      { type: "heading", level: 2, text: "다음 단계" },
      { type: "paragraph", text: "계속 진행합니다." },
    ]);
  });

  it("extracts the answer from a JSON object with trailing junk", () => {
    expect(
      normalizeAnswerText(
        `{"answer":"설치 후 확인하세요.\\n\\nconfluenceData\\n[{\\"pageId\\":\\"1\\"}]\\nPMID:0.json.gz" } PMID:0.json.gz`,
      ),
    ).toBe("설치 후 확인하세요.");
  });

  it("extracts the answer from an embedded JSON object after a prefix", () => {
    expect(
      normalizeAnswerText(
        `짧답: {"answer":"설치 후 확인하세요.\\n\\nconfluenceData\\n[{\\"pageId\\":\\"1\\"}]"}`,
      ),
    ).toBe("설치 후 확인하세요.");
  });

  it("detects standalone shell commands for code rendering", () => {
    expect(isStandaloneCommandText("npm install -g @openai/codex")).toBe(true);
    expect(isStandaloneCommandText("설치 후 확인하세요.")).toBe(false);
  });

  it("splits long chat prose into readable paragraph chunks", () => {
    expect(
      splitReadableParagraphText(
        "MCP는 AI가 외부 도구를 쓸 수 있게 해주는 연결 방식이에요. 파일이나 메일 같은 도구를 AI가 직접 다룰 수 있게 도와줍니다. 처음에는 전체 구조를 이해하는 것이 중요해요. 실제 설정은 가이드에서 단계별로 따라가면 됩니다.",
      ),
    ).toEqual([
      "MCP는 AI가 외부 도구를 쓸 수 있게 해주는 연결 방식이에요. 파일이나 메일 같은 도구를 AI가 직접 다룰 수 있게 도와줍니다.",
      "처음에는 전체 구조를 이해하는 것이 중요해요. 실제 설정은 가이드에서 단계별로 따라가면 됩니다.",
    ]);
  });

  it("keeps short prose as a single readable paragraph", () => {
    expect(splitReadableParagraphText("먼저 설정한 뒤 확인합니다. 문제가 있으면 다시 점검합니다.")).toEqual([
      "먼저 설정한 뒤 확인합니다. 문제가 있으면 다시 점검합니다.",
    ]);
  });
});

describe("splitAnswerBlocks — bracket-header detection", () => {
  it("converts [질문 텍스트] standalone line to h3 heading", () => {
    expect(splitAnswerBlocks("[왜 이 문서를 먼저 보면 좋은가요?]")).toEqual([
      { type: "heading", level: 3, text: "왜 이 문서를 먼저 보면 좋은가요?" },
    ]);
  });

  it("converts consecutive [질문] lines to separate h3 headings (no join)", () => {
    const blocks = splitAnswerBlocks("[왜 이 문서를 먼저 보면 좋은가요?]\n[무엇을 먼저 해야 하나요?]");
    expect(blocks).toEqual([
      { type: "heading", level: 3, text: "왜 이 문서를 먼저 보면 좋은가요?" },
      { type: "heading", level: 3, text: "무엇을 먼저 해야 하나요?" },
    ]);
  });

  it("splits [Q1][Q2] concatenated on a single line into two h3 headings", () => {
    const blocks = splitAnswerBlocks("[왜 이 문서를 먼저 보면 좋은가요?][무엇을 먼저 해야 하나요?]");
    expect(blocks).toEqual([
      { type: "heading", level: 3, text: "왜 이 문서를 먼저 보면 좋은가요?" },
      { type: "heading", level: 3, text: "무엇을 먼저 해야 하나요?" },
    ]);
  });

  it("does not convert [text](url) markdown links to headings", () => {
    const blocks = splitAnswerBlocks("[MCP 설정하기](/guides/mcp)");
    expect(blocks[0]?.type).toBe("paragraph");
  });

  it("does not convert [[nested] text] to heading (nested brackets)", () => {
    const blocks = splitAnswerBlocks("[[Guide] MCP 설정하기](/guides/mcp)");
    expect(blocks[0]?.type).toBe("paragraph");
  });
});
