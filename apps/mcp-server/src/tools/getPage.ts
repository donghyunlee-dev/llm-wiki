import {
  ConfluenceHttpError,
  getConfluencePage,
  type ConfluenceConfig,
} from "../confluence";
import type { ToolModule } from "./index";

export const getPageTool: ToolModule = {
  name: "get_page",
  description:
    "Fetch a Confluence page by id and return its body as plain text (id, title, url, text).",
  inputSchema: {
    type: "object",
    properties: {
      page_id: { type: "string", description: "Confluence page id." },
    },
    required: ["page_id"],
  },
  async run(args: Record<string, unknown>, config: ConfluenceConfig) {
    const pageId = readRequiredString(args.page_id, "page_id");
    try {
      return await getConfluencePage(config, pageId);
    } catch (error) {
      if (error instanceof ConfluenceHttpError && error.status === 404) {
        throw new Error(`Page not found: ${pageId} (404).`);
      }
      throw error;
    }
  },
};

function readRequiredString(value: unknown, name: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} is required and must be a non-empty string.`);
  }
  return value.trim();
}
