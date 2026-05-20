import { describe, expect, it } from "vitest";
import { classifyQuestionIntent, extractQuestionSubjects } from "./intentClassifier";

describe("classifyQuestionIntent — concept detection", () => {
  it.each([
    ["MCP가 뭐야?", "concept"],
    ["CLI가 뭔데?", "concept"],
    ["vibe coding이 뭐임?", "concept"],
    ["Codex가 먼지 알고 싶어", "concept"],
    ["MCP란 무엇인가요?", "concept"],
    ["webhook이 뭐야", "concept"],
    ["MCP 개념이 뭐야", "concept"],
    ["CLI 뜻이 뭐야", "concept"],
  ] as const)("%s → %s", (question, expected) => {
    expect(classifyQuestionIntent(question)).toBe(expected);
  });
});

describe("classifyQuestionIntent — setup detection", () => {
  it.each([
    ["MCP 설정 방법", "setup"],
    ["Codex CLI 설치 어떻게 해?", "setup"],
    ["MCP 연결은 어떻게 하나요?", "setup"],
    ["Gmail MCP 설정하기", "setup"],
    ["Claude Code를 설치하고 싶어", "setup"],
    ["MCP를 configure 하려면?", "setup"],
  ] as const)("%s → %s", (question, expected) => {
    expect(classifyQuestionIntent(question)).toBe(expected);
  });
});

describe("classifyQuestionIntent — page-lookup detection", () => {
  it.each([
    ["MCP 설정 페이지 있어?", "page-lookup"],
    ["Claude Code 가이드 어디 있어?", "page-lookup"],
    ["MCP 관련 문서 찾아줘", "page-lookup"],
    ["Codex 설치 가이드 링크", "page-lookup"],
  ] as const)("%s → %s", (question, expected) => {
    expect(classifyQuestionIntent(question)).toBe(expected);
  });
});

describe("classifyQuestionIntent — troubleshooting detection", () => {
  it.each([
    ["MCP 연결이 안 돼", "troubleshooting"],
    ["Codex 설치 오류가 나", "troubleshooting"],
    ["MCP 설정이 실패해", "troubleshooting"],
    ["Claude Code가 안 됨", "troubleshooting"],
  ] as const)("%s → %s", (question, expected) => {
    expect(classifyQuestionIntent(question)).toBe(expected);
  });
});

describe("classifyQuestionIntent — broad-planning detection", () => {
  it.each([
    ["vibe coding 시작하기 전에 뭘 준비해야 해?", "broad-planning"],
    ["AI 코딩 프로젝트 설계 순서가 어떻게 돼?", "broad-planning"],
    ["MCP 도입 전에 체크리스트가 뭐야?", "broad-planning"],
  ] as const)("%s → %s", (question, expected) => {
    expect(classifyQuestionIntent(question)).toBe(expected);
  });
});

describe("classifyQuestionIntent — vibe-coding real-world scenarios", () => {
  it.each([
    // concept: tool-name + question word (original bug)
    ["MCP가 뭐야?", "concept"],
    ["CLI가 뭐야?", "concept"],
    ["vibe coding이 뭐임?", "concept"],
    ["Codex가 먼지 알고 싶어", "concept"],
    ["webhook이 뭐야", "concept"],
    ["API가 뭔데?", "concept"],
    ["claude code 그게 뭐야", "concept"],
    ["MCP 뜻이 뭐야", "concept"],
    // setup: explicit action verb required
    ["MCP 설정 방법", "setup"],
    ["Codex CLI 설치 어떻게 해?", "setup"],
    ["claude code 설치하고 싶어", "setup"],
    ["MCP 연결 방법 알려줘", "setup"],
    ["Gmail MCP 어떻게 설정해?", "setup"],
    // troubleshooting
    ["MCP 연결이 안 돼", "troubleshooting"],
    ["Codex 설치 오류 났어", "troubleshooting"],
    ["MCP 설정이 자꾸 실패해", "troubleshooting"],
    ["claude code 실행이 안됨", "troubleshooting"],
    // page-lookup
    ["MCP 설정 페이지 있어?", "page-lookup"],
    ["Claude Code 가이드 어디 있어?", "page-lookup"],
    ["vibe coding 관련 문서 찾아줘", "page-lookup"],
    // broad-planning
    ["vibe coding 시작하기 전에 뭘 준비해야 해?", "broad-planning"],
    ["AI 코딩 프로젝트 설계 순서가 어떻게 돼?", "broad-planning"],
    ["MCP 도입 순서 체크리스트가 뭐야?", "broad-planning"],
  ] as const)("%s → %s", (question, expected) => {
    expect(classifyQuestionIntent(question)).toBe(expected);
  });
});

describe("classifyQuestionIntent — edge cases and negative scenarios", () => {
  it("classifies unknown subject + concept word as concept", () => {
    // "RAG"는 KNOWN_SUBJECTS 밖이지만 뭐지 패턴으로 concept 판정
    expect(classifyQuestionIntent("RAG가 뭐지?")).toBe("concept");
  });

  it("classifies '뭐 지' (with space) as concept", () => {
    expect(classifyQuestionIntent("MCP가 뭐 지?")).toBe("concept");
  });

  it("classifies 'Gmail 사용법' as setup (usage = how-to guide)", () => {
    expect(classifyQuestionIntent("Gmail 사용법")).toBe("setup");
  });

  it("classifies 'claude webhook 사용법' as setup", () => {
    expect(classifyQuestionIntent("claude webhook 사용법")).toBe("setup");
  });

  it("classifies 'claude 기능 중 webhook을 어떻게 사용하는지 알고 싶은 거야' as setup", () => {
    expect(classifyQuestionIntent("[Guide] claude 기능 중 webhook을 어떻게 사용하는지 알고 싶은 거야")).toBe("setup");
  });

  it("classifies 'API 예시' as general (reference, not how-to)", () => {
    expect(classifyQuestionIntent("API 예시")).toBe("general");
  });

  it("classifies 'MCP 오류 해결 문서 있어?' as page-lookup (page shape wins immediately)", () => {
    expect(classifyQuestionIntent("MCP 오류 해결 문서 있어?")).toBe("page-lookup");
  });

  it("classifies '설정 문서 링크가 안 열려' as page-lookup (has link + page noun)", () => {
    // 링크 + 안됨: page-lookup 판정이 즉시 승리
    expect(classifyQuestionIntent("설정 문서 링크가 안 열려")).toBe("page-lookup");
  });
});

describe("extractQuestionSubjects", () => {
  it("extracts mcp from concept question", () => {
    expect(extractQuestionSubjects("MCP가 뭐야?")).toContain("mcp");
  });

  it("extracts multiple subjects", () => {
    const subjects = extractQuestionSubjects("Claude Code CLI 설치 방법");
    expect(subjects).toContain("claude");
    expect(subjects).toContain("cli");
  });

  it("extracts webhook subject", () => {
    expect(extractQuestionSubjects("Gmail webhook 사용법")).toContain("webhook");
  });

  it("extracts vibe coding as compound subject", () => {
    expect(extractQuestionSubjects("vibe coding이 뭔지")).toContain("vibe coding");
  });
});
