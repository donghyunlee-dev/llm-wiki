import { describe, expect, it, vi } from "vitest";
import {
  EMPTY_PROMPT_RULES,
  buildInitialPromptRulesPageHtml,
  loadPromptRulesFromConfluence,
  parsePromptRulesFromHtml,
} from "./promptRulesLoader";
import { getConfluencePageDetail } from "./confluenceClient";

vi.mock("./confluenceClient", () => ({
  getConfluencePageDetail: vi.fn(),
}));

const SAMPLE_PAGE_HTML = `
<p><em>이 페이지는 Claude 루틴이 자동으로 관리합니다. 마지막 갱신: 2026-05-28 20:00</em></p>
<h2>추가 답변 지침</h2>
<ul>
  <li>사용자가 한국어로 도구명을 물어볼 때 영어 표기도 함께 검색 범위에 포함한다</li>
  <li>Jira 관련 질문에는 설정 페이지보다 개요 페이지를 먼저 안내한다</li>
</ul>
<h2>추가 키워드 힌트</h2>
<ul>
  <li>코덱스 → codex, Codex CLI, openai codex</li>
  <li>클로드 코드 → claude code, claude-code</li>
</ul>
<h2>감지된 반복 실패 패턴</h2>
<ul>
  <li>jira 연동 (3회): 관련 가이드 페이지 미발견</li>
</ul>
`;

describe("parsePromptRulesFromHtml", () => {
  it("extracts additional instructions from the correct section", () => {
    const rules = parsePromptRulesFromHtml(SAMPLE_PAGE_HTML);

    expect(rules.additionalInstructions).toHaveLength(2);
    expect(rules.additionalInstructions[0]).toContain("한국어로 도구명");
    expect(rules.additionalInstructions[1]).toContain("Jira 관련 질문");
  });

  it("extracts keyword hints", () => {
    const rules = parsePromptRulesFromHtml(SAMPLE_PAGE_HTML);

    expect(rules.keywordHints).toHaveLength(2);
    expect(rules.keywordHints[0]).toBe("코덱스 → codex, Codex CLI, openai codex");
    expect(rules.keywordHints[1]).toBe("클로드 코드 → claude code, claude-code");
  });

  it("extracts lastUpdated timestamp", () => {
    const rules = parsePromptRulesFromHtml(SAMPLE_PAGE_HTML);

    expect(rules.lastUpdated).toBe("2026-05-28 20:00");
  });

  it("returns empty arrays for missing sections", () => {
    const rules = parsePromptRulesFromHtml("<h2>다른 섹션</h2><ul><li>항목</li></ul>");

    expect(rules.additionalInstructions).toEqual([]);
    expect(rules.keywordHints).toEqual([]);
  });

  it("returns empty rules for empty HTML", () => {
    const rules = parsePromptRulesFromHtml("");

    expect(rules).toEqual(EMPTY_PROMPT_RULES);
  });

  it("handles empty <ul></ul> sections without crashing", () => {
    const rules = parsePromptRulesFromHtml(buildInitialPromptRulesPageHtml());

    expect(rules.additionalInstructions).toEqual([]);
    expect(rules.keywordHints).toEqual([]);
  });

  it("strips HTML tags from list item text", () => {
    const html = `
      <h2>추가 답변 지침</h2>
      <ul><li><strong>중요:</strong> 비개발자 대상으로 설명한다</li></ul>
    `;
    const rules = parsePromptRulesFromHtml(html);

    expect(rules.additionalInstructions[0]).toBe("중요: 비개발자 대상으로 설명한다");
  });
});

describe("loadPromptRulesFromConfluence", () => {
  it("fetches page and parses rules", async () => {
    vi.mocked(getConfluencePageDetail).mockResolvedValueOnce({
      id: "page-1",
      title: "Prompt Rules",
      version: 1,
      bodyHtml: SAMPLE_PAGE_HTML,
    });

    const config = {
      siteName: "sfoodxproject",
      userEmail: "user@example.com",
      apiToken: "token",
    };

    const rules = await loadPromptRulesFromConfluence(config, "page-1");

    expect(getConfluencePageDetail).toHaveBeenCalledWith(config, "page-1");
    expect(rules.additionalInstructions).toHaveLength(2);
    expect(rules.keywordHints).toHaveLength(2);
  });
});

describe("buildInitialPromptRulesPageHtml", () => {
  it("produces parseable HTML with empty sections", () => {
    const html = buildInitialPromptRulesPageHtml();
    const rules = parsePromptRulesFromHtml(html);

    expect(rules.additionalInstructions).toEqual([]);
    expect(rules.keywordHints).toEqual([]);
  });
});
