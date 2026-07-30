import { describe, expect, it, vi } from "vitest";
import {
  findConfluencePageByTitle,
  getConfluencePage,
  listConfluenceChildPages,
  listConfluenceSpaces,
  searchConfluencePages,
  type ConfluenceConfig,
} from "./confluence";

function jsonResponse(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function baseConfig(mockFetch: typeof fetch): ConfluenceConfig {
  return {
    siteName: "sfoodxproject",
    userEmail: "svc@example.com",
    apiToken: "token",
    spaceId: "63111172",
    fetch: mockFetch,
  };
}

describe("searchConfluencePages", () => {
  it("fetches pages by numeric space id via the v2 API", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        results: [
          {
            id: "123",
            title: "반품 규정",
            body: { storage: { value: "<p>반품은 7일 이내 가능합니다.</p>" } },
            _links: { webui: "/spaces/POLICY/pages/123" },
          },
        ],
        _links: { base: "https://sfoodxproject.atlassian.net/wiki" },
      }),
    );

    const results = await searchConfluencePages(baseConfig(mockFetch), "반품", 10);

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/wiki/api/v2/pages?space-id=63111172");
    expect(calledUrl).toContain("limit=100");
    expect(results).toEqual([
      {
        id: "123",
        title: "반품 규정",
        excerpt: "반품은 7일 이내 가능합니다.",
        url: "https://sfoodxproject.atlassian.net/wiki/spaces/POLICY/pages/123",
      },
    ]);
  });

  it("matches on body text even when the title does not contain the query", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        results: [
          {
            id: "1",
            title: "설치 가이드",
            body: { storage: { value: "<p>여기에 반품 절차를 설명합니다.</p>" } },
          },
        ],
      }),
    );

    const results = await searchConfluencePages(baseConfig(mockFetch), "반품");
    expect(results.map((r) => r.id)).toEqual(["1"]);
  });

  it("excludes pages that do not match the query", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        results: [
          { id: "1", title: "설치 가이드", body: { storage: { value: "<p>설치 절차</p>" } } },
        ],
      }),
    );

    const results = await searchConfluencePages(baseConfig(mockFetch), "반품");
    expect(results).toEqual([]);
  });

  it("matches case-insensitively", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        results: [{ id: "1", title: "Claude Code Guide", body: undefined }],
      }),
    );

    const results = await searchConfluencePages(baseConfig(mockFetch), "claude");
    expect(results.map((r) => r.id)).toEqual(["1"]);
  });

  it("honors the limit parameter", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        results: [
          { id: "1", title: "반품 A" },
          { id: "2", title: "반품 B" },
          { id: "3", title: "반품 C" },
        ],
      }),
    );

    const results = await searchConfluencePages(baseConfig(mockFetch), "반품", 2);
    expect(results.map((r) => r.id)).toEqual(["1", "2"]);
  });

  it("returns an empty array when there are no results", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(jsonResponse({ results: [] }));
    const results = await searchConfluencePages(baseConfig(mockFetch), "없음");
    expect(results).toEqual([]);
  });

  it("honors a space override", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(jsonResponse({ results: [] }));
    await searchConfluencePages(baseConfig(mockFetch), "q", 5, "999");
    expect(mockFetch.mock.calls[0][0] as string).toContain("space-id=999");
  });
});

describe("getConfluencePage", () => {
  it("returns body converted to plain text", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        id: "456",
        title: "설치 가이드",
        body: { storage: { value: "<h1>제목</h1><p>본문&nbsp;내용</p>" } },
        _links: { webui: "/spaces/G/pages/456" },
      }),
    );

    const page = await getConfluencePage(baseConfig(mockFetch), "456");

    expect(page.id).toBe("456");
    expect(page.title).toBe("설치 가이드");
    expect(page.text).toBe("제목 본문 내용");
    expect(page.url).toContain("https://");
  });

  it("resolves the webui link against the response's own _links.base, not the bare site origin", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        id: "456",
        title: "설치 가이드",
        body: { storage: { value: "<p>내용</p>" } },
        _links: {
          webui: "/spaces/G/pages/456",
          base: "https://sfoodxproject.atlassian.net/wiki",
        },
      }),
    );

    const page = await getConfluencePage(baseConfig(mockFetch), "456");

    expect(page.url).toBe("https://sfoodxproject.atlassian.net/wiki/spaces/G/pages/456");
  });

  it("trims very long bodies to 8000 characters", async () => {
    const longBody = "a".repeat(9000);
    const mockFetch = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        id: "1",
        title: "t",
        body: { storage: { value: longBody } },
      }),
    );

    const page = await getConfluencePage(baseConfig(mockFetch), "1");
    expect(page.text.length).toBe(8001); // 8000 chars + ellipsis
    expect(page.text.endsWith("…")).toBe(true);
  });

  it("throws ConfluenceHttpError with status 404 for missing pages", async () => {
    const mockFetch = vi.fn().mockResolvedValue(jsonResponse({}, 404));
    await expect(
      getConfluencePage(baseConfig(mockFetch), "nope"),
    ).rejects.toMatchObject({ name: "ConfluenceHttpError", status: 404 });
  });
});

describe("findConfluencePageByTitle", () => {
  it("looks up pages via the v2 API by numeric space id, not v1 CQL", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            { id: "10", title: "다른 제목" },
            { id: "11", title: "정확한 제목" },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: "11",
          title: "정확한 제목",
          body: { storage: { value: "<p>내용</p>" } },
        }),
      );

    const page = await findConfluencePageByTitle(baseConfig(mockFetch), "정확한 제목");

    const firstCallUrl = mockFetch.mock.calls[0][0] as string;
    expect(firstCallUrl).toContain("/wiki/api/v2/pages?space-id=63111172");
    expect(firstCallUrl).not.toContain("content/search");
    expect(page?.id).toBe("11");
    expect(page?.text).toBe("내용");
  });

  it("returns null when nothing matches", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(jsonResponse({ results: [] }));
    const page = await findConfluencePageByTitle(baseConfig(mockFetch), "없는 제목");
    expect(page).toBeNull();
  });

  it("honors a space override", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(jsonResponse({ results: [] }));
    await findConfluencePageByTitle(baseConfig(mockFetch), "제목", "999");
    expect(mockFetch.mock.calls[0][0] as string).toContain("space-id=999");
  });
});

describe("listConfluenceChildPages", () => {
  it("follows pagination and returns all children", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          results: [{ id: "2", title: "Child A", _links: { webui: "/a" } }],
          _links: { next: "/wiki/api/v2/pages/1/children?cursor=abc" },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          results: [{ id: "3", title: "Child B", _links: { webui: "/b" } }],
        }),
      );

    const children = await listConfluenceChildPages(baseConfig(mockFetch), "1");
    expect(children.map((child) => child.id)).toEqual(["2", "3"]);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("does not follow a pagination link to a foreign origin", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        results: [{ id: "2", title: "Child A", _links: { webui: "/a" } }],
        _links: { next: "https://evil.example.com/steal?token=1" },
      }),
    );

    const children = await listConfluenceChildPages(baseConfig(mockFetch), "1");
    expect(children.map((child) => child.id)).toEqual(["2"]);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe("listConfluenceSpaces", () => {
  it("returns id/key/name for each space", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        results: [{ id: "100", key: "WIKI", name: "AI Agent Wiki" }],
      }),
    );

    const spaces = await listConfluenceSpaces(baseConfig(mockFetch));
    expect(spaces).toEqual([{ id: "100", key: "WIKI", name: "AI Agent Wiki" }]);
  });
});
