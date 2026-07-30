import { searchConfluencePages, type ConfluenceConfig } from "../confluence";
import type { ToolModule } from "./index";

export const searchWikiTool: ToolModule = {
  name: "search_wiki",
  description:
    "Search the company Confluence wiki by keyword and return matching pages (id, title, excerpt, url).",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search keywords." },
      limit: {
        type: "number",
        description: "Maximum number of results (1-100, default 25).",
      },
      space_key: {
        type: "string",
        description: "Optional space id to override the default search space.",
      },
    },
    required: ["query"],
  },
  async run(args: Record<string, unknown>, config: ConfluenceConfig) {
    const query = readRequiredString(args.query, "query");
    const limit = typeof args.limit === "number" ? args.limit : undefined;
    const spaceOverride = readOptionalString(args.space_key);
    const results = await searchConfluencePages(config, query, limit, spaceOverride);
    return { count: results.length, results };
  },
};

function readRequiredString(value: unknown, name: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} is required and must be a non-empty string.`);
  }
  return value.trim();
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
