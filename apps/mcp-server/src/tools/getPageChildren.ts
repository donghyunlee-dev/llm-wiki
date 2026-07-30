import { listConfluenceChildPages, type ConfluenceConfig } from "../confluence";
import type { ToolModule } from "./index";

export const getPageChildrenTool: ToolModule = {
  name: "get_page_children",
  description:
    "List the direct child pages of a Confluence page (id, title, url).",
  inputSchema: {
    type: "object",
    properties: {
      page_id: { type: "string", description: "Parent Confluence page id." },
    },
    required: ["page_id"],
  },
  async run(args: Record<string, unknown>, config: ConfluenceConfig) {
    const pageId = readRequiredString(args.page_id, "page_id");
    const children = await listConfluenceChildPages(config, pageId);
    return { count: children.length, children };
  },
};

function readRequiredString(value: unknown, name: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} is required and must be a non-empty string.`);
  }
  return value.trim();
}
