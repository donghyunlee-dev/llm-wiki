import { handleAiSearchRequest, type OrchestrationEnv } from "@sfood/wiki-core";

declare const process: {
  env: HandlerEnv;
};

type LambdaEvent = {
  httpMethod?: string;
  body?: string | null;
  isBase64Encoded?: boolean;
  requestContext?: {
    http?: {
      method?: string;
    };
  };
};

type LambdaResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};

type HandlerEnv = OrchestrationEnv & {
  WIKI_ALLOWED_ORIGIN?: string;
};

type HandlerOptions = {
  env?: HandlerEnv;
};

export async function aiSearchHandler(
  event: LambdaEvent = {},
  options: HandlerOptions = {},
): Promise<LambdaResponse> {
  const env = options.env ?? process.env;
  const method = resolveMethod(event);

  if (method === "OPTIONS") {
    return jsonResponse(204, null, env);
  }

  if (method !== "POST") {
    return jsonResponse(405, {
      message: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    }, env);
  }

  let body: Record<string, unknown>;

  try {
    body = parseEventBody(event);
  } catch {
    return jsonResponse(400, {
      message: "Request body must be valid JSON.",
      code: "BAD_REQUEST",
    }, env);
  }

  const { status, body: resultBody } = await handleAiSearchRequest(env, {
    question: body.question,
    persona: body.persona,
    history: body.history,
  });

  return jsonResponse(status, resultBody, env);
}

function resolveMethod(event: LambdaEvent) {
  return event.requestContext?.http?.method ?? event.httpMethod ?? "POST";
}

function parseEventBody(event: LambdaEvent): Record<string, unknown> {
  if (!event.body) {
    return {};
  }

  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf-8")
    : event.body;

  const parsed = JSON.parse(raw);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Request body must be a JSON object.");
  }

  return parsed as Record<string, unknown>;
}

function jsonResponse(statusCode: number, payload: unknown, env: HandlerEnv): LambdaResponse {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": env.WIKI_ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    },
    body: payload === null ? "" : JSON.stringify(payload),
  };
}
