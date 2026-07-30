import { ConfluenceHttpError, type ConfluenceConfig } from "../confluence";
import { searchWikiTool } from "./searchWiki";
import { getPageTool } from "./getPage";
import { getPageByTitleTool } from "./getPageByTitle";
import { getPageChildrenTool } from "./getPageChildren";
import { getSpaceListTool } from "./getSpaceList";

export type ToolModule = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  run(args: Record<string, unknown>, config: ConfluenceConfig): Promise<unknown>;
};

export type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

export type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

const TOOLS: ToolModule[] = [
  searchWikiTool,
  getPageTool,
  getPageByTitleTool,
  getPageChildrenTool,
  getSpaceListTool,
];

export function listToolDefinitions(): ToolDefinition[] {
  return TOOLS.map(({ name, description, inputSchema }) => ({
    name,
    description,
    inputSchema,
  }));
}

export async function callTool(
  name: unknown,
  args: unknown,
  config: ConfluenceConfig,
): Promise<ToolResult> {
  const tool = TOOLS.find((candidate) => candidate.name === name);

  if (!tool) {
    return errorResult(`Unknown tool: ${String(name)}`);
  }

  const safeArgs = isRecord(args) ? args : {};

  try {
    const result = await tool.run(safeArgs, config);
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  } catch (error) {
    return errorResult(describeError(error));
  }
}

function errorResult(message: string): ToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

function describeError(error: unknown): string {
  if (error instanceof ConfluenceHttpError) {
    return `Confluence request failed (status ${error.status}).`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error.";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
