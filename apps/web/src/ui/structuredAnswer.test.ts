import { describe, expect, it } from "vitest";
import { filterVisibleAnswerBlocks, normalizeAnswerText, splitAnswerBlocks } from "./structuredAnswer";
import { isStandaloneCommandText } from "./StructuredAnswerView";

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

  it("detects standalone shell commands for code rendering", () => {
    expect(isStandaloneCommandText("npm install -g @openai/codex")).toBe(true);
    expect(isStandaloneCommandText("설치 후 확인하세요.")).toBe(false);
  });
});
