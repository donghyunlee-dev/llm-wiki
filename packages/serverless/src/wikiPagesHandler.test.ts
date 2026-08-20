import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetWikiPagesCacheForTests, wikiPagesHandler } from "./wikiPagesHandler";

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

function pageListResponse(overrides: { title?: string } = {}) {
  return jsonResponse({
    results: [
      {
        id: "123",
        status: "current",
        title: overrides.title ?? "Guide",
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
  });
}

function pageMetadataResponse() {
  return jsonResponse({
    results: [
      {
        key: "wiki.metadata",
        value: {
          docType: "guide",
          audience: "beginner",
          status: "published",
          prerequisites: [],
          next: [],
          related: [],
        },
      },
    ],
  });
}

describe("wikiPagesHandler", () => {
  beforeEach(() => {
    __resetWikiPagesCacheForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns Confluence-backed pages with the remote source contract", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(pageListResponse())
      .mockResolvedValueOnce(pageMetadataResponse());

    const response = await wikiPagesHandler({ httpMethod: "GET" }, {
      env,
      fetch: mockFetch,
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({
      pages: [
        {
          slug: "guide",
          page: {
            id: "123",
            title: "Guide",
          },
        },
      ],
    });
  });

  it("serves a repeated request within the TTL from cache without calling Confluence again", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(pageListResponse())
      .mockResolvedValueOnce(pageMetadataResponse());

    const first = await wikiPagesHandler({ httpMethod: "GET" }, { env, fetch: mockFetch });
    const second = await wikiPagesHandler({ httpMethod: "GET" }, { env, fetch: mockFetch });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(JSON.parse(second.body)).toEqual(JSON.parse(first.body));
  });

  it("refetches from Confluence after the cache TTL expires and serves the refreshed data", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-20T00:00:00.000Z"));

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(pageListResponse())
      .mockResolvedValueOnce(pageMetadataResponse())
      .mockResolvedValueOnce(pageListResponse({ title: "Updated Guide" }))
      .mockResolvedValueOnce(pageMetadataResponse());

    const first = await wikiPagesHandler({ httpMethod: "GET" }, { env, fetch: mockFetch });
    vi.setSystemTime(new Date("2026-08-20T00:31:00.000Z"));
    const second = await wikiPagesHandler({ httpMethod: "GET" }, { env, fetch: mockFetch });

    expect(mockFetch).toHaveBeenCalledTimes(4);
    expect(JSON.parse(first.body).pages[0].page.title).toBe("Guide");
    expect(JSON.parse(second.body).pages[0].page.title).toBe("Updated Guide");
  });

  it("returns 502 without serving stale data when a post-expiry refetch fails", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-20T00:00:00.000Z"));

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(pageListResponse())
      .mockResolvedValueOnce(pageMetadataResponse())
      .mockResolvedValueOnce(new Response("Bad gateway", { status: 502 }));

    await wikiPagesHandler({ httpMethod: "GET" }, { env, fetch: mockFetch });
    vi.setSystemTime(new Date("2026-08-20T00:31:00.000Z"));
    const response = await wikiPagesHandler({ httpMethod: "GET" }, { env, fetch: mockFetch });

    expect(response.statusCode).toBe(502);
    expect(JSON.parse(response.body)).toMatchObject({ code: "WIKI_SOURCE_UNAVAILABLE" });
  });

  it("shares a single in-flight Confluence fetch across concurrent cold-cache requests", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(pageListResponse())
      .mockResolvedValueOnce(pageMetadataResponse());

    const [first, second] = await Promise.all([
      wikiPagesHandler({ httpMethod: "GET" }, { env, fetch: mockFetch }),
      wikiPagesHandler({ httpMethod: "GET" }, { env, fetch: mockFetch }),
    ]);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(JSON.parse(first.body)).toEqual(JSON.parse(second.body));
  });

  it("does not cache an upstream failure and retries on the next request", async () => {
    const failingFetch = vi.fn(async () => new Response("Bad gateway", { status: 502 }));
    const failedResponse = await wikiPagesHandler({ httpMethod: "GET" }, { env, fetch: failingFetch });
    expect(failedResponse.statusCode).toBe(502);

    const recoveringFetch = vi
      .fn()
      .mockResolvedValueOnce(pageListResponse())
      .mockResolvedValueOnce(pageMetadataResponse());
    const recoveredResponse = await wikiPagesHandler({ httpMethod: "GET" }, { env, fetch: recoveringFetch });

    expect(recoveredResponse.statusCode).toBe(200);
    expect(recoveringFetch).toHaveBeenCalledTimes(2);
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
