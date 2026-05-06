import { describe, expect, it, vi } from "vitest";
import { wikiPagesHandler } from "./wikiPagesHandler";

const env = {
  ATLASSIAN_SITE_NAME: "example",
  ATLASSIAN_USER_EMAIL: "user@example.com",
  ATLASSIAN_API_TOKEN: "token",
  CONFLUENCE_SPACE_ID: "63111172",
};

function jsonResponse(value: unknown) {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("wikiPagesHandler", () => {
  it("returns Confluence-backed pages with the remote source contract", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            {
              id: "123",
              status: "current",
              title: "Guide",
              spaceId: "63111172",
              version: {
                number: 1,
                createdAt: "2026-04-29T00:00:00.000Z",
              },
              body: {
                storage: {
                  value: "<h1>Guide</h1>",
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
              key: "wiki.metadata",
              value: {
                docType: "tutorial",
                visibility: "public",
                audience: "beginner",
                status: "published",
                prerequisites: [],
                next: [],
                related: [],
              },
            },
          ],
        }),
      );

    const response = await wikiPagesHandler({ httpMethod: "GET" }, {
      env,
      fetch: mockFetch,
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({
      pages: [
        {
          category: "guides",
          slug: "guide",
          page: {
            id: "123",
            title: "Guide",
          },
        },
      ],
    });
  });

  it("returns CORS headers for preflight requests", async () => {
    const response = await wikiPagesHandler({
      requestContext: {
        http: {
          method: "OPTIONS",
        },
      },
    }, {
      env: {
        ...env,
        WIKI_ALLOWED_ORIGIN: "https://wiki.example.com",
      },
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers["Access-Control-Allow-Origin"]).toBe("https://wiki.example.com");
  });

  it("rejects non-GET methods", async () => {
    const response = await wikiPagesHandler({ httpMethod: "POST" }, { env });

    expect(response.statusCode).toBe(405);
    expect(JSON.parse(response.body)).toMatchObject({
      code: "METHOD_NOT_ALLOWED",
    });
  });

  it("returns a configuration error when required env is missing", async () => {
    const response = await wikiPagesHandler({ httpMethod: "GET" }, {
      env: {
        ATLASSIAN_SITE_NAME: "example",
      },
    });

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toMatchObject({
      code: "WIKI_SOURCE_NOT_CONFIGURED",
      details: {
        missing: ["ATLASSIAN_USER_EMAIL", "ATLASSIAN_API_TOKEN", "CONFLUENCE_SPACE_ID"],
      },
    });
  });

  it("maps upstream failures to a 502 response", async () => {
    const response = await wikiPagesHandler({ httpMethod: "GET" }, {
      env,
      fetch: vi.fn(async () =>
        new Response("Bad gateway", {
          status: 502,
        }),
      ),
    });

    expect(response.statusCode).toBe(502);
    expect(JSON.parse(response.body)).toMatchObject({
      code: "WIKI_SOURCE_UNAVAILABLE",
    });
  });
});
