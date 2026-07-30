import { describe, expect, it, vi } from "vitest";
import type { ConfluenceConfig } from "./confluence";
import { callTool, listToolDefinitions } from "./tools/index";

function jsonResponse(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function configWith(mockFetch: typeof fetch): ConfluenceConfig {
  return {
    siteName: "sfoodxproject",
    userEmail: "svc@example.com",
    apiToken: "token",
    spaceId: "63111172",
    fetch: mockFetch,
  };
}

function parseContent(result: { content: Array<{ text: string }> }) {
  return JSON.parse(result.content[0].text);
}

describe("listToolDefinitions", () => {
  it("exposes the five read-only tools", () => {
    const names = listToolDefinitions().map((tool) => tool.name);
    expect(names).toEqual([
      "search_wiki",
      "get_page",
      "get_page_by_title",
      "get_page_children",
      "get_space_list",
    ]);
  });
});

describe("callTool", () => {
  it("runs search_wiki and returns serialized results", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ results: [{ id: "1", title: "T" }] }));
    const result = await callTool("search_wiki", { query: "t" }, configWith(mockFetch));
    expect(result.isError).toBeUndefined();
    expect(parseContent(result)).toEqual({
      count: 1,
      results: [{ id: "1", title: "T", excerpt: "", url: "https://sfoodxproject.atlassian.net" }],
    });
  });

  it("returns isError when a required argument is missing", async () => {
    const mockFetch = vi.fn();
    const result = await callTool("search_wiki", {}, configWith(mockFetch));
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("query");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("maps a 404 from get_page to a clear error message", async () => {
    const mockFetch = vi.fn().mockResolvedValue(jsonResponse({}, 404));
    const result = await callTool("get_page", { page_id: "999" }, configWith(mockFetch));
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Page not found: 999");
  });

  it("rejects an unknown tool", async () => {
    const result = await callTool("nope", {}, configWith(vi.fn()));
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Unknown tool");
  });

  it("runs get_space_list without arguments", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ results: [{ id: "1", key: "K", name: "N" }] }));
    const result = await callTool("get_space_list", undefined, configWith(mockFetch));
    expect(parseContent(result)).toEqual({
      count: 1,
      spaces: [{ id: "1", key: "K", name: "N" }],
    });
  });
});
