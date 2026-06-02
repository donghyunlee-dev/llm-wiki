import { describe, expect, it, vi } from "vitest";
import {
  analyzeRecentPlaybookFailures,
  extractFailurePatterns,
  parsePlaybookRows,
} from "./playbookAnalyzer";
import {
  findConfluenceChildPageByTitle,
  getConfluencePageDetail,
} from "./confluenceClient";

vi.mock("./confluenceClient", () => ({
  findConfluenceChildPageByTitle: vi.fn(),
  getConfluencePageDetail: vi.fn(),
}));

const SAMPLE_TABLE_HTML = `
<table>
  <thead>
    <tr>
      <th>검색 일시</th><th>질문</th><th>응답 요약</th>
      <th>추천 문서</th><th>충분도</th><th>부족 키워드</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>2026-05-28 10:00</td>
      <td>jira 이슈를 읽으려면?</td>
      <td>현재 위키에 해당 주제에 대한 페이지가 없습니다.</td>
      <td>없음</td>
      <td>부족</td>
      <td>jira, 이슈 읽기</td>
    </tr>
    <tr>
      <td>2026-05-28 11:00</td>
      <td>MCP 설정 방법은?</td>
      <td>MCP 설정은 가이드 페이지를 참고하세요.</td>
      <td>Guide MCP Setup</td>
      <td>충분</td>
      <td>-</td>
    </tr>
    <tr>
      <td>2026-05-28 12:00</td>
      <td>지라 연동 어떻게 해?</td>
      <td>현재 위키에 해당 주제에 대한 페이지가 없습니다.</td>
      <td>없음</td>
      <td>부족</td>
      <td>jira</td>
    </tr>
  </tbody>
</table>
`;

describe("parsePlaybookRows", () => {
  it("parses all data rows and skips header", () => {
    const rows = parsePlaybookRows(SAMPLE_TABLE_HTML);

    expect(rows).toHaveLength(3);
  });

  it("correctly reads question, sufficiency, and missingKeywords", () => {
    const rows = parsePlaybookRows(SAMPLE_TABLE_HTML);

    expect(rows[0].question).toBe("jira 이슈를 읽으려면?");
    expect(rows[0].sufficiency).toBe("부족");
    expect(rows[0].missingKeywords).toEqual(["jira", "이슈 읽기"]);
  });

  it("parses '충분' rows with empty missingKeywords", () => {
    const rows = parsePlaybookRows(SAMPLE_TABLE_HTML);

    expect(rows[1].sufficiency).toBe("충분");
    expect(rows[1].missingKeywords).toEqual([]);
  });

  it("treats '-' as empty missingKeywords", () => {
    const rows = parsePlaybookRows(SAMPLE_TABLE_HTML);

    expect(rows[1].missingKeywords).toEqual([]);
  });

  it("returns empty array for empty HTML", () => {
    expect(parsePlaybookRows("")).toEqual([]);
  });
});

describe("extractFailurePatterns", () => {
  it("aggregates repeated keywords into patterns", () => {
    const rows = [
      { question: "jira 이슈를 읽으려면?", missingKeywords: ["jira"] },
      { question: "지라 연동 어떻게 해?", missingKeywords: ["jira"] },
      { question: "slack 알림 설정은?", missingKeywords: ["slack"] },
    ];

    const patterns = extractFailurePatterns(rows);

    expect(patterns).toHaveLength(1);
    expect(patterns[0].keyword).toBe("jira");
    expect(patterns[0].count).toBe(2);
    expect(patterns[0].exampleQuestions).toHaveLength(2);
  });

  it("uses question itself when missingKeywords is empty", () => {
    const rows = [
      { question: "Jira 연동 방법", missingKeywords: [] },
      { question: "Jira 연동 방법", missingKeywords: [] },
    ];

    const patterns = extractFailurePatterns(rows);

    expect(patterns[0].keyword).toBe("jira 연동 방법");
    expect(patterns[0].count).toBe(2);
  });

  it("filters out patterns with count < 2", () => {
    const rows = [{ question: "한 번만 나온 질문", missingKeywords: ["unique-topic"] }];

    const patterns = extractFailurePatterns(rows);

    expect(patterns).toHaveLength(0);
  });

  it("returns patterns sorted by count descending", () => {
    const rows = [
      { question: "q1", missingKeywords: ["b"] },
      { question: "q2", missingKeywords: ["a"] },
      { question: "q3", missingKeywords: ["a"] },
      { question: "q4", missingKeywords: ["b"] },
      { question: "q5", missingKeywords: ["a"] },
    ];

    const patterns = extractFailurePatterns(rows);

    expect(patterns[0].keyword).toBe("a");
    expect(patterns[0].count).toBe(3);
    expect(patterns[1].keyword).toBe("b");
    expect(patterns[1].count).toBe(2);
  });
});

describe("analyzeRecentPlaybookFailures", () => {
  const config = {
    siteName: "sfoodxproject",
    userEmail: "user@example.com",
    apiToken: "token",
    spaceId: "63111172",
    playbookPageId: "playbook-parent",
  };

  it("returns empty result when no playbook pages found", async () => {
    vi.mocked(findConfluenceChildPageByTitle).mockResolvedValue(null);

    const result = await analyzeRecentPlaybookFailures(config, 3);

    expect(result.totalEntries).toBe(0);
    expect(result.insufficientCount).toBe(0);
    expect(result.failurePatterns).toEqual([]);
    expect(result.analyzedDays).toEqual([]);
  });

  it("aggregates entries across multiple days", async () => {
    vi.mocked(findConfluenceChildPageByTitle).mockResolvedValue({
      id: "daily-page",
      title: "Playbook - 2026-05-28",
      version: 1,
    });
    vi.mocked(getConfluencePageDetail).mockResolvedValue({
      id: "daily-page",
      title: "Playbook - 2026-05-28",
      version: 1,
      bodyHtml: SAMPLE_TABLE_HTML,
    });

    const result = await analyzeRecentPlaybookFailures(config, 1);

    expect(result.totalEntries).toBe(3);
    expect(result.insufficientCount).toBe(2);
  });
});
