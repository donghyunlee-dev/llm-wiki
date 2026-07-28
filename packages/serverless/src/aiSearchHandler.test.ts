import { describe, expect, it } from "vitest";
import { aiSearchHandler } from "./aiSearchHandler";

describe("aiSearchHandler", () => {
  it("returns CORS headers for preflight requests", async () => {
    const response = await aiSearchHandler({
      requestContext: { http: { method: "OPTIONS" } },
    }, {
      env: { WIKI_ALLOWED_ORIGIN: "https://wiki.example.com" },
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers["Access-Control-Allow-Origin"]).toBe("https://wiki.example.com");
    expect(response.headers["Access-Control-Allow-Methods"]).toBe("POST,OPTIONS");
  });

  it("rejects non-POST methods", async () => {
    const response = await aiSearchHandler({ httpMethod: "GET" }, { env: {} });

    expect(response.statusCode).toBe(405);
    expect(JSON.parse(response.body)).toMatchObject({ code: "METHOD_NOT_ALLOWED" });
  });

  it("returns 503 when Confluence environment is not configured", async () => {
    const response = await aiSearchHandler({
      httpMethod: "POST",
      body: JSON.stringify({ question: "질문" }),
    }, { env: {} });

    expect(response.statusCode).toBe(503);
    expect(JSON.parse(response.body)).toMatchObject({ code: "CONFLUENCE_UNAVAILABLE" });
  });

  it("returns 400 for an invalid JSON body", async () => {
    const response = await aiSearchHandler({
      httpMethod: "POST",
      body: "{not-json",
    }, { env: {} });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toMatchObject({ code: "BAD_REQUEST" });
  });

  it("returns 400 for a JSON body that is not an object (e.g. \"null\")", async () => {
    const response = await aiSearchHandler({
      httpMethod: "POST",
      body: "null",
    }, { env: {} });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toMatchObject({ code: "BAD_REQUEST" });
  });
});
