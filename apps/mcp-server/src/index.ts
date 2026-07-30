// AWS Lambda Function URL entry point for the SFOOD wiki MCP server.
// Stateless MCP Streamable HTTP transport: clients POST JSON-RPC 2.0 messages.

import { authorizeRequest } from "./auth";
import type { ConfluenceConfig } from "./confluence";
import {
  failure,
  handleRpcMessage,
  type JsonRpcRequest,
  type JsonRpcResponse,
} from "./mcpHandler";

declare const process: { env: HandlerEnv };

export type HandlerEnv = {
  ATLASSIAN_SITE_NAME?: string;
  ATLASSIAN_USER_EMAIL?: string;
  ATLASSIAN_API_TOKEN?: string;
  CONFLUENCE_SPACE_ID?: string;
  MCP_API_KEY?: string;
  MCP_ALLOWED_ORIGIN?: string;
};

type LambdaEvent = {
  httpMethod?: string;
  requestContext?: { http?: { method?: string } };
  headers?: Record<string, string | undefined>;
  body?: string | null;
  isBase64Encoded?: boolean;
};

type LambdaResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};

type HandlerOptions = {
  env?: HandlerEnv;
  fetch?: typeof fetch;
};

const REQUIRED_ENV_KEYS = [
  "ATLASSIAN_SITE_NAME",
  "ATLASSIAN_USER_EMAIL",
  "ATLASSIAN_API_TOKEN",
  "CONFLUENCE_SPACE_ID",
] as const;

export async function mcpLambdaHandler(
  event: LambdaEvent = {},
  options: HandlerOptions = {},
): Promise<LambdaResponse> {
  const env = options.env ?? process.env;
  const method = resolveMethod(event);

  if (method === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(env), body: "" };
  }

  if (method !== "POST") {
    return jsonResponse(405, { message: "Method not allowed. Use POST." }, env);
  }

  const auth = authorizeRequest(event.headers ?? {}, env.MCP_API_KEY);
  if (!auth.ok) {
    return jsonResponse(auth.status, { message: auth.message }, env);
  }

  const missingKeys = REQUIRED_ENV_KEYS.filter((key) => !env[key]);
  if (missingKeys.length) {
    return jsonResponse(
      500,
      { message: "MCP server is not configured.", missing: missingKeys },
      env,
    );
  }

  const config: ConfluenceConfig = {
    siteName: env.ATLASSIAN_SITE_NAME!,
    userEmail: env.ATLASSIAN_USER_EMAIL!,
    apiToken: env.ATLASSIAN_API_TOKEN!,
    spaceId: env.CONFLUENCE_SPACE_ID!,
    fetch: options.fetch,
  };

  const parsed = parseBody(event);
  if (!parsed.ok) {
    return jsonResponse(200, failure(null, -32700, "Parse error."), env);
  }

  // An empty JSON-RPC batch is itself an invalid request.
  if (Array.isArray(parsed.value) && parsed.value.length === 0) {
    return jsonResponse(200, failure(null, -32600, "Invalid Request."), env);
  }

  const messages = Array.isArray(parsed.value) ? parsed.value : [parsed.value];
  const responses: JsonRpcResponse[] = [];

  for (const message of messages) {
    if (!isRecord(message)) {
      responses.push(failure(null, -32600, "Invalid request."));
      continue;
    }
    const response = await handleRpcMessage(message as JsonRpcRequest, config);
    if (response) {
      responses.push(response);
    }
  }

  // Notifications only → 202 Accepted, no body (per MCP Streamable HTTP).
  if (responses.length === 0) {
    return { statusCode: 202, headers: corsHeaders(env), body: "" };
  }

  const payload = Array.isArray(parsed.value) ? responses : responses[0];
  return jsonResponse(200, payload, env);
}

export const handler = (event: LambdaEvent): Promise<LambdaResponse> =>
  mcpLambdaHandler(event);

function resolveMethod(event: LambdaEvent): string {
  return event.requestContext?.http?.method ?? event.httpMethod ?? "POST";
}

function parseBody(
  event: LambdaEvent,
): { ok: true; value: unknown } | { ok: false } {
  const raw = event.body ?? "";

  if (!raw.trim()) {
    return { ok: false };
  }

  // Decoding and parsing both run inside the guard so malformed base64 or
  // JSON from a client can never crash the handler.
  try {
    const decoded = event.isBase64Encoded ? decodeBase64Utf8(raw) : raw;
    return { ok: true, value: JSON.parse(decoded) };
  } catch {
    return { ok: false };
  }
}

function decodeBase64Utf8(raw: string): string {
  const binary = atob(raw);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function jsonResponse(
  statusCode: number,
  payload: unknown,
  env: HandlerEnv,
): LambdaResponse {
  return {
    statusCode,
    headers: {
      ...corsHeaders(env),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(payload),
  };
}

function corsHeaders(env: HandlerEnv): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": env.MCP_ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, x-api-key, mcp-session-id, mcp-protocol-version",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
