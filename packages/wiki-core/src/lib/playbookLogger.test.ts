import { describe, expect, it, vi } from "vitest";
import {
  buildDailyPageTitle,
  buildPlaybookEntryRowHtml,
  buildPlaybookLogTableHtml,
  logSearchToPlaybook,
  type PlaybookSearchEntry,
} from "./playbookLogger";
import {
  createConfluencePage,
  findConfluenceChildPageByTitle,
  getConfluencePageDetail,
  updateConfluencePage,
} from "./confluenceClient";

vi.mock("./confluenceClient", () => ({
  createConfluencePage: vi.fn(),
  findConfluenceChildPageByTitle: vi.fn(),
  getConfluencePageDetail: vi.fn(),
  updateConfluencePage: vi.fn(),
}));

const config = {
  siteName: "sfoodxproject",
  userEmail: "user@example.com",
  apiToken: "token",
  spaceId: "63111172",
  playbookPageId: "playbook-parent",
};

function entry(overrides: Partial<PlaybookSearchEntry> = {}): PlaybookSearchEntry {
  return {
    timestamp: new Date("2026-05-18T15:30:00.000Z"),
    question: "MCP 설정 방법은?",
    answerSummary: "MCP 설정은 Node.js 준비 후 진행합니다.",
    recommendedDocuments: [{ title: "Guide MCP Setup", href: "/guides/mcp" }],
    sufficiency: "충분",
    missingKeywords: [],
    ...overrides,
  };
}

describe("playbookLogger", () => {
  it("builds daily Playbook page titles in KST", () => {
    expect(buildDailyPageTitle(new Date("2026-05-18T15:30:00.000Z"))).toBe("Playbook - 2026-05-19");
  });

  it("creates a daily page with a single log table", async () => {
    vi.mocked(findConfluenceChildPageByTitle).mockResolvedValueOnce(null);
    vi.mocked(createConfluencePage).mockResolvedValueOnce("daily-page");

    await logSearchToPlaybook(config, entry());

    expect(findConfluenceChildPageByTitle).toHaveBeenCalledWith(
      config,
      "playbook-parent",
      "Playbook - 2026-05-19",
    );
    expect(createConfluencePage).toHaveBeenCalledWith(
      config,
      "playbook-parent",
      "Playbook - 2026-05-19",
      expect.stringContaining("<table>"),
    );
    const createdBody = vi.mocked(createConfluencePage).mock.calls[0]?.[3] ?? "";
    expect(createdBody.match(/<table>/g)).toHaveLength(1);
    expect(createdBody).toContain("<th>검색 일시</th>");
    expect(createdBody).toContain("<td>MCP 설정 방법은?</td>");
  });

  it("appends entries as rows to the existing daily log table", async () => {
    const firstEntry = entry({ question: "첫 질문" });
    const secondEntry = entry({ question: "두 번째 질문" });
    const existingBody = `<h1>Playbook - 2026-05-19</h1>\n${buildPlaybookLogTableHtml(firstEntry)}`;

    vi.mocked(findConfluenceChildPageByTitle).mockResolvedValueOnce({
      id: "daily-page",
      title: "Playbook - 2026-05-19",
      version: 3,
    });
    vi.mocked(getConfluencePageDetail).mockResolvedValueOnce({
      id: "daily-page",
      title: "Playbook - 2026-05-19",
      version: 3,
      bodyHtml: existingBody,
    });

    await logSearchToPlaybook(config, secondEntry);

    const updatedBody = vi.mocked(updateConfluencePage).mock.calls[0]?.[3] ?? "";
    expect(updateConfluencePage).toHaveBeenCalledWith(
      config,
      "daily-page",
      "Playbook - 2026-05-19",
      expect.any(String),
      3,
    );
    expect(updatedBody.match(/<table>/g)).toHaveLength(1);
    expect(updatedBody.match(/<tbody>/g)).toHaveLength(1);
    expect(updatedBody).toContain(buildPlaybookEntryRowHtml(firstEntry));
    expect(updatedBody).toContain(buildPlaybookEntryRowHtml(secondEntry));
  });
});
