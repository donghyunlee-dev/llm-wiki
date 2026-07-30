import { findConfluencePageByTitle, type ConfluenceConfig } from "../confluence";
import type { ToolModule } from "./index";

export const getPageByTitleTool: ToolModule = {
  name: "get_page_by_title",
  description:
    "Find a Confluence page by exact title and return its body as plain text. Returns null when no page matches.",
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Exact page title." },
      space_key: {
        type: "string",
        description: "Optional space id to override the default search space.",
      },
    },
    required: ["title"],
  },
  async run(args: Record<string, unknown>, config: ConfluenceConfig) {
    const title = readRequiredString(args.title, "title");
    const spaceOverride =
      typeof args.space_key === "string" && args.space_key.trim()
        ? args.space_key.trim()
        : undefined;
    const page = await findConfluencePageByTitle(config, title, spaceOverride);
    return { found: page !== null, page };
  },
};

function readRequiredString(value: unknown, name: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} is required and must be a non-empty string.`);
  }
  return value.trim();
}
