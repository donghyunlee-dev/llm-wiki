import { fetchConfluencePageRecords } from "@sfood/wiki-core";

declare const process: {
  env: HandlerEnv;
};

type LambdaEvent = {
  httpMethod?: string;
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

type HandlerEnv = {
  ATLASSIAN_SITE_NAME?: string;
  ATLASSIAN_USER_EMAIL?: string;
  ATLASSIAN_API_TOKEN?: string;
  CONFLUENCE_SPACE_ID?: string;
  WIKI_ALLOWED_ORIGIN?: string;
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

export async function wikiPagesHandler(
  event: LambdaEvent = {},
  options: HandlerOptions = {},
): Promise<LambdaResponse> {
  const env = options.env ?? process.env;
  const method = resolveMethod(event);

  if (method === "OPTIONS") {
    return jsonResponse(204, null, env);
  }

  if (method !== "GET") {
    return jsonResponse(405, {
      message: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    }, env);
  }

  const missingKeys = REQUIRED_ENV_KEYS.filter((key) => !env[key]);

  if (missingKeys.length) {
    return jsonResponse(500, {
      message: "Wiki source is not configured",
      code: "WIKI_SOURCE_NOT_CONFIGURED",
      details: {
        missing: missingKeys,
      },
    }, env);
  }

  const config = {
    siteName: env.ATLASSIAN_SITE_NAME!,
    userEmail: env.ATLASSIAN_USER_EMAIL!,
    apiToken: env.ATLASSIAN_API_TOKEN!,
    spaceId: env.CONFLUENCE_SPACE_ID!,
  };

  try {
    const pages = await fetchConfluencePageRecords({
      ...config,
      fetch: options.fetch,
    });

    return jsonResponse(200, { pages }, env);
  } catch {
    return jsonResponse(502, {
      message: "Wiki source is unavailable",
      code: "WIKI_SOURCE_UNAVAILABLE",
    }, env);
  }
}

function resolveMethod(event: LambdaEvent) {
  return event.requestContext?.http?.method ?? event.httpMethod ?? "GET";
}

function jsonResponse(statusCode: number, payload: unknown, env: HandlerEnv): LambdaResponse {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": env.WIKI_ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    },
    body: payload === null ? "" : JSON.stringify(payload),
  };
}
