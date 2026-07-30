import { describe, expect, it, vi } from "vitest";
import { mcpLambdaHandler, type HandlerEnv } from "./index";

const ENV: HandlerEnv = {
  ATLASSIAN_SITE_NAME: "sfoodxproject",
  ATLASSIAN_USER_EMAIL: "svc@example.com",
  ATLASSIAN_API_TOKEN: "token",
  CONFLUENCE_SPACE_ID: "63111172",
  MCP_API_KEY: "secret",
};

function jsonResponse(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Pass apiKey: null to omit the x-api-key header entirely.
function postEvent(body: unknown, apiKey: string | null = "secret") {
  return {
    requestContext: { http: { method: "POST" } },
    headers: {
      "content-type": "application/json",
      ...(apiKey ? { "x-api-key": apiKey } : {}),
    },
    body: JSON.stringify(body),
  };
}

function rpc(method: string, params?: unknown, id: number | null = 1) {
  return { jsonrpc: "2.0", id, method, params };
}

describe("mcpLambdaHandler", () => {
  it("handles initialize", async () => {
    const response = await mcpLambdaHandler(postEvent(rpc("initialize")), {
      env: ENV,
      fetch: vi.fn(),
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.result.protocolVersion).toBe("2024-11-05");
    expect(body.result.serverInfo.name).toBe("sfood-wiki-mcp");
  });

  it("lists the five tools", async () => {
    const response = await mcpLambdaHandler(postEvent(rpc("tools/list")), {
      env: ENV,
      fetch: vi.fn(),
    });
    const body = JSON.parse(response.body);
    expect(body.result.tools).toHaveLength(5);
  });

  it("dispatches tools/call to a Confluence search", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ results: [{ id: "1", title: "T" }] }));
    const response = await mcpLambdaHandler(
      postEvent(rpc("tools/call", { name: "search_wiki", arguments: { query: "t" } })),
      { env: ENV, fetch: mockFetch },
    );
    const body = JSON.parse(response.body);
    const payload = JSON.parse(body.result.content[0].text);
    expect(payload.count).toBe(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("returns 401 for an invalid API key", async () => {
    const response = await mcpLambdaHandler(postEvent(rpc("initialize"), "wrong"), {
      env: ENV,
      fetch: vi.fn(),
    });
    expect(response.statusCode).toBe(401);
  });

  it("returns 401 for a missing API key", async () => {
    const response = await mcpLambdaHandler(postEvent(rpc("initialize"), null), {
      env: ENV,
      fetch: vi.fn(),
    });
    expect(response.statusCode).toBe(401);
  });

  it("returns 202 with no body for notifications", async () => {
    const response = await mcpLambdaHandler(
      postEvent({ jsonrpc: "2.0", method: "notifications/initialized" }),
      { env: ENV, fetch: vi.fn() },
    );
    expect(response.statusCode).toBe(202);
    expect(response.body).toBe("");
  });

  it("returns 204 for CORS preflight", async () => {
    const response = await mcpLambdaHandler(
      { requestContext: { http: { method: "OPTIONS" } } },
      { env: ENV, fetch: vi.fn() },
    );
    expect(response.statusCode).toBe(204);
  });

  it("rejects non-POST methods with 405", async () => {
    const response = await mcpLambdaHandler(
      { requestContext: { http: { method: "GET" } } },
      { env: ENV, fetch: vi.fn() },
    );
    expect(response.statusCode).toBe(405);
  });

  it("returns 500 when Confluence env is missing", async () => {
    const response = await mcpLambdaHandler(postEvent(rpc("tools/list")), {
      env: { MCP_API_KEY: "secret" },
      fetch: vi.fn(),
    });
    expect(response.statusCode).toBe(500);
  });

  it("responds to a request with explicit id null (not a notification)", async () => {
    const response = await mcpLambdaHandler(
      postEvent({ jsonrpc: "2.0", id: null, method: "tools/list" }),
      { env: ENV, fetch: vi.fn() },
    );
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.id).toBeNull();
    expect(body.result.tools).toHaveLength(5);
  });

  it("rejects an empty JSON-RPC batch with -32600", async () => {
    const response = await mcpLambdaHandler(postEvent([]), {
      env: ENV,
      fetch: vi.fn(),
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).error.code).toBe(-32600);
  });

  it("returns -32600 for a malformed request shape", async () => {
    const response = await mcpLambdaHandler(
      postEvent({ jsonrpc: "2.0", id: 5, method: 123 }),
      { env: ENV, fetch: vi.fn() },
    );
    const body = JSON.parse(response.body);
    expect(body.error.code).toBe(-32600);
    expect(body.id).toBe(5);
  });

  it("does not crash on malformed base64 bodies", async () => {
    const response = await mcpLambdaHandler(
      {
        requestContext: { http: { method: "POST" } },
        headers: { "x-api-key": "secret" },
        body: "!!!not-base64!!!",
        isBase64Encoded: true,
      },
      { env: ENV, fetch: vi.fn() },
    );
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).error.code).toBe(-32700);
  });

  it("returns a JSON-RPC parse error for malformed bodies", async () => {
    const response = await mcpLambdaHandler(
      {
        requestContext: { http: { method: "POST" } },
        headers: { "x-api-key": "secret" },
        body: "{ not json",
      },
      { env: ENV, fetch: vi.fn() },
    );
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).error.code).toBe(-32700);
  });
});
