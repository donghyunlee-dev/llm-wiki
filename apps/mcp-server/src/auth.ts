// API Key based client authentication for the MCP server.
// Clients send the shared key in the `x-api-key` header.

export type AuthResult =
  | { ok: true }
  | { ok: false; status: number; message: string };

const API_KEY_HEADER = "x-api-key";

export function authorizeRequest(
  headers: Record<string, string | undefined>,
  expectedKey: string | undefined,
): AuthResult {
  if (!expectedKey) {
    return {
      ok: false,
      status: 500,
      message: "MCP server is not configured: MCP_API_KEY is missing.",
    };
  }

  const provided = readHeader(headers, API_KEY_HEADER);

  if (!provided) {
    return {
      ok: false,
      status: 401,
      message: "Missing API key. Provide the x-api-key header.",
    };
  }

  if (!timingSafeEqual(provided, expectedKey)) {
    return { ok: false, status: 401, message: "Invalid API key." };
  }

  return { ok: true };
}

function readHeader(
  headers: Record<string, string | undefined>,
  name: string,
): string | undefined {
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === target && typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

// Length-independent comparison to avoid leaking key length via timing.
function timingSafeEqual(a: string, b: string): boolean {
  let mismatch = a.length === b.length ? 0 : 1;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
