import { describe, expect, it } from "vitest";
import { aiAskHandler } from "./aiAskHandler";

describe("aiAskHandler", () => {
  it("returns CORS headers for preflight requests", async () => {
    const response = await aiAskHandler({
      requestContext: { http: { method: "OPTIONS" } },
    }, {
      env: { WIKI_ALLOWED_ORIGIN: "https://wiki.example.com" },
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers["Access-Control-Allow-Origin"]).toBe("https://wiki.example.com");
    expect(response.headers["Access-Control-Allow-Methods"]).toBe("POST,OPTIONS");
  });

  it("rejects non-POST methods", async () => {
    const response = await aiAskHandler({ httpMethod: "GET" }, { env: {} });

    expect(response.statusCode).toBe(405);
    expect(JSON.parse(response.body)).toMatchObject({ code: "METHOD_NOT_ALLOWED" });
  });

  it("returns 503 when Confluence environment is not configured", async () => {
    const response = await aiAskHandler({
      httpMethod: "POST",
      body: JSON.stringify({ pageId: "1", question: "질문" }),
    }, { env: {} });

    expect(response.statusCode).toBe(503);
    expect(JSON.parse(response.body)).toMatchObject({ code: "CONFLUENCE_UNAVAILABLE" });
  });

  it("returns 400 for an invalid JSON body", async () => {
    const response = await aiAskHandler({
      httpMethod: "POST",
      body: "{not-json",
    }, { env: {} });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toMatchObject({ code: "BAD_REQUEST" });
  });

  it("returns 400 for a JSON body that is not an object (e.g. \"null\")", async () => {
    const response = await aiAskHandler({
      httpMethod: "POST",
      body: "null",
    }, { env: {} });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toMatchObject({ code: "BAD_REQUEST" });
  });

  it("decodes a base64-encoded body before parsing", async () => {
    const payload = JSON.stringify({ pageId: "1", question: "질문" });
    const response = await aiAskHandler({
      httpMethod: "POST",
      body: Buffer.from(payload, "utf-8").toString("base64"),
      isBase64Encoded: true,
    }, { env: {} });

    // Still 503 (no Confluence config), proving the body decoded and reached handleAiAskRequest
    // instead of failing as a BAD_REQUEST from a raw-base64 JSON.parse attempt.
    expect(response.statusCode).toBe(503);
  });
});
