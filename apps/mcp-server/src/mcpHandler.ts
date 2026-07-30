// Minimal MCP (Model Context Protocol) JSON-RPC 2.0 routing.
// Implements the subset required for a stateless request/response transport:
// initialize, ping, tools/list, tools/call, and notifications.

import type { ConfluenceConfig } from "./confluence";
import { callTool, listToolDefinitions } from "./tools/index";

export const MCP_PROTOCOL_VERSION = "2024-11-05";

const SERVER_INFO = {
  name: "sfood-wiki-mcp",
  version: "0.1.0",
};

type JsonRpcId = string | number | null;

export type JsonRpcRequest = {
  jsonrpc?: unknown;
  id?: JsonRpcId;
  method?: unknown;
  params?: unknown;
};

export type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result?: unknown;
  error?: { code: number; message: string };
};

// Returns a response for requests (with id) and null for notifications.
export async function handleRpcMessage(
  message: JsonRpcRequest,
  config: ConfluenceConfig,
): Promise<JsonRpcResponse | null> {
  // A JSON-RPC notification omits `id` entirely; it gets no response.
  // `id: null` is still a request and must receive a response with id null.
  if (message.id === undefined) {
    return null;
  }

  const id = message.id as JsonRpcId;

  // Malformed request objects are -32600 Invalid Request; only a well-formed
  // request with an unrecognized method falls through to -32601 below.
  if (message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return failure(id, -32600, "Invalid Request.");
  }

  const method = message.method;

  switch (method) {
    case "initialize":
      return success(id, {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });

    case "ping":
      return success(id, {});

    case "tools/list":
      return success(id, { tools: listToolDefinitions() });

    case "tools/call": {
      const params = isRecord(message.params) ? message.params : {};
      const result = await callTool(params.name, params.arguments, config);
      return success(id, result);
    }

    default:
      return failure(id, -32601, `Method not found: ${method}`);
  }
}

export function success(id: JsonRpcId, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

export function failure(
  id: JsonRpcId,
  code: number,
  message: string,
): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
