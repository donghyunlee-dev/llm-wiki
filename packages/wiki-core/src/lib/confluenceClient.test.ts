import { describe, expect, it, vi } from "vitest";
import { fetchConfluencePageRecords } from "./confluenceClient";

const metadata = {
  docType: "guide",
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

  it("fetches lesson.presentation and flattened course metadata for a lesson docType page", async () => {
    const lessonMetadata = {
      ...metadata,
      docType: "lesson",
      courseId: "ai-foundation",
      order: 1,
      chapter: "AI 이해의 시작",
      estimatedMinutes: 5,
      learningObjectives: ["목표 1"],
      lastReviewedAt: "2026-08-04",
    };
    const presentation = {
      schemaVersion: 1,
      lessonId: "today-route",
      theme: "ai-foundation",
      scenes: [
        {
          sceneId: "today-route-main",
          anchor: "오늘의 흐름",
          type: "concept",
          layout: "visual-split",
          motion: "step-reveal",
          reveal: "manual",
          narration: "내레이션",
          blocks: [
            { order: 1, kind: "hook", content: "질문" },
            { order: 2, kind: "visual", visualKind: "step-cards", html: "<div>카드</div>", css: ".card{color:red}" },
          ],
          interaction: { kind: "step-reveal", steps: ["카드 공개"] },
          completionEvidence: "증거",
          transitionToNext: "다음 안내",
        },
      ],
    };

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            {
              id: "123",
              status: "current",
              title: "오늘의 흐름",
              spaceId: "63111172",
              version: { number: 1, createdAt: "2026-04-29T01:02:03.000Z" },
              body: { storage: { value: "<h1>오늘의 흐름</h1>" } },
              _links: { webui: "/wiki/spaces/LLMWIKI/pages/123" },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ results: [{ id: "prop-1", key: "wiki.metadata", value: lessonMetadata }] }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ results: [{ id: "prop-2", key: "lesson.presentation", value: presentation }] }),
      );

    const records = await fetchConfluencePageRecords({
      siteName: "sfoodxproject",
      userEmail: "user@example.com",
      apiToken: "token",
      spaceId: "63111172",
      fetch: mockFetch,
    });

    expect(records[0].page.metadata).toEqual({
      docType: "lesson",
      audience: "beginner",
      status: "published",
      prerequisites: [],
      next: [],
      related: [],
      courseId: "ai-foundation",
      order: 1,
      chapter: "AI 이해의 시작",
      estimatedMinutes: 5,
      learningObjectives: ["목표 1"],
      lastReviewedAt: "2026-08-04",
    });
    expect(records[0].page.presentation).toEqual(presentation);
  });

  it("does not fetch lesson.presentation for a non-lesson docType page", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            {
              id: "123",
              status: "current",
              title: "가이드",
              spaceId: "63111172",
              body: { storage: { value: "<h1>가이드</h1>" } },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ results: [{ id: "prop-1", key: "wiki.metadata", value: metadata }] }));

    const records = await fetchConfluencePageRecords({
      siteName: "sfoodxproject",
      userEmail: "user@example.com",
      apiToken: "token",
      spaceId: "63111172",
      fetch: mockFetch,
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(records[0].page.presentation).toBeUndefined();
  });

  it("drops lesson.presentation entirely when schemaVersion does not match", async () => {
    const lessonMetadata = { ...metadata, docType: "lesson" };
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            {
              id: "123",
              status: "current",
              title: "레슨",
              spaceId: "63111172",
              body: { storage: { value: "<h1>레슨</h1>" } },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ results: [{ id: "prop-1", key: "wiki.metadata", value: lessonMetadata }] }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            {
              id: "prop-2",
              key: "lesson.presentation",
              value: { schemaVersion: 2, lessonId: "x", theme: "y", scenes: [] },
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

    expect(records[0].page.presentation).toBeUndefined();
  });

  it("normalizes numeric prerequisites entries to strings", async () => {
    const lessonMetadata = { ...metadata, docType: "lesson", prerequisites: [183075057] };
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            {
              id: "123",
              status: "current",
              title: "레슨",
              spaceId: "63111172",
              body: { storage: { value: "<h1>레슨</h1>" } },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ results: [{ id: "prop-1", key: "wiki.metadata", value: lessonMetadata }] }),
      )
      .mockResolvedValueOnce(jsonResponse({ results: [] }));

    const records = await fetchConfluencePageRecords({
      siteName: "sfoodxproject",
      userEmail: "user@example.com",
      apiToken: "token",
      spaceId: "63111172",
      fetch: mockFetch,
    });

    expect(records[0].page.metadata.prerequisites).toEqual(["183075057"]);
  });

  it("uses a follow-up property fetch when the property list returns a numeric id without a value", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            {
              id: "789",
              status: "current",
              title: "[Guide] Index",
              spaceId: "63111172",
              body: { storage: { value: "<p>index</p>" } },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            {
              id: 98765,
              key: "wiki.metadata",
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: 98765,
          key: "wiki.metadata",
          value: { ...metadata, docType: "nav" },
        }),
      );

    const records = await fetchConfluencePageRecords({
      siteName: "sfoodxproject",
      userEmail: "user@example.com",
      apiToken: "token",
      spaceId: "63111172",
      fetch: mockFetch,
    });

    expect(records[0]?.page.metadata.docType).toBe("nav");
    expect(mockFetch).toHaveBeenCalledTimes(3);
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
            docType: "page",
          },
        }),
      );

    const records = await fetchConfluencePageRecords({
      siteName: "https://example.atlassian.net",
      userEmail: "user@example.com",
      apiToken: "token",
      fetch: mockFetch,
    });

    expect(records[0]?.page.metadata.docType).toBe("page");
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
            docType: "guide",
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

  it("rejects pages with removed legacy docType values", async () => {
    const legacyTypes = ["overview", "concept", "howto", "example", "troubleshooting", "reference", "tutorial", "index", "router", "registry"];

    for (const oldType of legacyTypes) {
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse({
            results: [
              {
                id: "100",
                status: "current",
                title: "Legacy Doc",
                spaceId: "63111172",
                version: { number: 1, createdAt: "2026-04-29T00:00:00.000Z" },
                body: { storage: { value: "<p>body</p>" } },
                _links: { webui: "/wiki/spaces/LLMWIKI/pages/100" },
              },
            ],
          }),
        )
        .mockResolvedValueOnce(
          jsonResponse({
            results: [
              {
                id: "prop-legacy",
                key: "wiki.metadata",
                value: { ...metadata, docType: oldType },
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

      // Legacy docType → metadata parse fails → page is omitted
      expect(records, `${oldType} should produce no records`).toHaveLength(0);
    }
  });
});
