import { describe, expect, it, vi } from "vitest";
import { fetchConfluencePageRecords } from "./confluenceClient";

const metadata = {
  docType: "tutorial",
  visibility: "public",
  audience: "beginner",
  status: "published",
  prerequisites: [],
  next: [],
  related: [],
};

function jsonResponse(value: unknown) {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("fetchConfluencePageRecords", () => {
  it("maps Confluence pages and wiki metadata into remote wiki records", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            {
              id: "123",
              parentId: "100",
              status: "current",
              title: "Agent 시작하기",
              spaceId: "63111172",
              version: {
                number: 7,
                createdAt: "2026-04-29T01:02:03.000Z",
              },
              body: {
                storage: {
                  value: "<h1>Agent 시작하기</h1>",
                },
              },
              _links: {
                webui: "/wiki/spaces/LLMWIKI/pages/123",
              },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            {
              id: "prop-1",
              key: "wiki.metadata",
              value: metadata,
            },
          ],
        }),
      );

    const records = await fetchConfluencePageRecords({
      siteName: "sfoodxproject",
      userEmail: "user@example.com",
      apiToken: "token",
      spaceId: "63111172",
      fetch: mockFetch,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://sfoodxproject.atlassian.net/wiki/api/v2/pages?space-id=63111172&status=current&body-format=storage&limit=100",
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "application/json",
          Authorization: expect.stringMatching(/^Basic /),
        }),
      }),
    );
    expect(records).toEqual([
      {
        category: "guides",
        slug: "agent-시작하기",
        page: {
          id: "123",
          parentId: "100",
          title: "Agent 시작하기",
          spaceId: "63111172",
          status: "current",
          version: 7,
          bodyHtml: "<h1>Agent 시작하기</h1>",
          sourceUrl: "https://sfoodxproject.atlassian.net/wiki/spaces/LLMWIKI/pages/123",
          metadata,
          updatedAt: "2026-04-29",
        },
      },
    ]);
  });

  it("uses a follow-up property fetch when the metadata list does not include a value", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            {
              id: "456",
              status: "current",
              title: "업무 승인 요청 도구",
              spaceId: "63111172",
              body: {
                storage: {
                  value: "<p>example</p>",
                },
              },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            {
              id: "prop-2",
              key: "wiki.metadata",
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: "prop-2",
          key: "wiki.metadata",
          value: {
            ...metadata,
            docType: "example",
          },
        }),
      );

    const records = await fetchConfluencePageRecords({
      siteName: "https://example.atlassian.net",
      userEmail: "user@example.com",
      apiToken: "token",
      fetch: mockFetch,
    });

    expect(records[0]?.category).toBe("projects");
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("infers visible metadata from guide-style titles when wiki metadata is missing", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            {
              id: "84705630",
              status: "current",
              title: "[Guide] Gmail MCP Setup",
              spaceId: "63111172",
              version: {
                number: 2,
                createdAt: "2026-04-29T01:02:03.000Z",
              },
              body: {
                storage: {
                  value: "<p>Gmail mail setup</p>",
                },
              },
              _links: {
                webui: "/wiki/spaces/AIAW/pages/84705630",
              },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          results: [],
        }),
      );

    const records = await fetchConfluencePageRecords({
      siteName: "sfoodxproject",
      userEmail: "user@example.com",
      apiToken: "token",
      spaceId: "63111172",
      fetch: mockFetch,
    });

    expect(records).toEqual([
      {
        category: "guides",
        slug: "guide-gmail-mcp-setup",
        page: {
          id: "84705630",
          title: "[Guide] Gmail MCP Setup",
          spaceId: "63111172",
          status: "current",
          version: 2,
          bodyHtml: "<p>Gmail mail setup</p>",
          sourceUrl: "https://sfoodxproject.atlassian.net/wiki/spaces/AIAW/pages/84705630",
          metadata: {
            docType: "tutorial",
            visibility: "public",
            audience: "beginner",
            status: "published",
            prerequisites: [],
            next: [],
            related: [],
          },
          updatedAt: "2026-04-29",
        },
      },
    ]);
  });

  it("omits pages without wiki metadata", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            {
              id: "789",
              status: "current",
              title: "No Metadata",
              spaceId: "63111172",
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          results: [],
        }),
      );

    const records = await fetchConfluencePageRecords({
      siteName: "sfoodxproject",
      userEmail: "user@example.com",
      apiToken: "token",
      fetch: mockFetch,
    });

    expect(records).toEqual([]);
  });
});
