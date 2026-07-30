import { listConfluenceSpaces, type ConfluenceConfig } from "../confluence";
import type { ToolModule } from "./index";

export const getSpaceListTool: ToolModule = {
  name: "get_space_list",
  description:
    "List the Confluence spaces the service account can access (id, key, name).",
  inputSchema: {
    type: "object",
    properties: {},
  },
  async run(_args: Record<string, unknown>, config: ConfluenceConfig) {
    const spaces = await listConfluenceSpaces(config);
    return { count: spaces.length, spaces };
  },
};
