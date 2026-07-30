// Self-contained Confluence REST client for the MCP server.
// Intentionally has NO dependency on @sfood/wiki-core or any other workspace
// package so this service can build and deploy in full isolation.

export type ConfluenceConfig = {
  siteName: string;
  userEmail: string;
  apiToken: string;
  spaceId: string;
  fetch?: typeof fetch;
};

export type SearchResult = {
  id: string;
  title: string;
  excerpt: string;
  url: string;
};

export type PageContent = {
  id: string;
  title: string;
  url: string;
  text: string;
};

export type ChildPage = {
  id: string;
  title: string;
  url: string;
};

export type SpaceSummary = {
  id: string;
  key: string;
  name: string;
};

export class ConfluenceHttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ConfluenceHttpError";
    this.status = status;
  }
}

const MAX_PAGE_TEXT_LENGTH = 8000;
const DEFAULT_SEARCH_LIMIT = 25;
const CHILD_PAGE_LIMIT = 50;
// Defensive bound so a cyclic/repeated `_links.next` cannot loop until the
// Lambda times out. 50 pages * 50 items is well beyond realistic page trees.
const MAX_PAGINATION_PAGES = 50;

// The v1 `content/search` CQL endpoint's `space=` field expects a space KEY,
// not the numeric space id this service is configured with (the same numeric
// id the v2 pages API's `space-id` param requires) — see AIAW space bug found
// during live testing. Search is implemented as a local text match over pages
// fetched via the v2 API instead, matching the existing wiki-core approach.
export async function searchConfluencePages(
  config: ConfluenceConfig,
  query: string,
  limit = DEFAULT_SEARCH_LIMIT,
  spaceOverride?: string,
): Promise<SearchResult[]> {
  const space = spaceOverride || config.spaceId;
  const safeLimit = clampLimit(limit);
  const normalizedQuery = query.toLocaleLowerCase();
  const results: SearchResult[] = [];

  for await (const page of fetchPagesInSpace(config, space)) {
    if (results.length >= safeLimit) break;

    const titleMatch = page.title.toLocaleLowerCase().includes(normalizedQuery);
    const bodyMatchIndex = page.bodyText.toLocaleLowerCase().indexOf(normalizedQuery);

    if (!titleMatch && bodyMatchIndex === -1) continue;

    results.push({
      id: page.id,
      title: page.title,
      excerpt: buildExcerpt(page.bodyText, bodyMatchIndex),
      url: page.url,
    });
  }

  return results;
}

const EXCERPT_WINDOW = 160;

function buildExcerpt(bodyText: string, matchIndex: number): string {
  if (!bodyText) return "";
  if (matchIndex === -1) return bodyText.slice(0, EXCERPT_WINDOW).trim();

  const start = Math.max(0, matchIndex - EXCERPT_WINDOW / 2);
  return bodyText.slice(start, start + EXCERPT_WINDOW).trim();
}

type SpacePage = {
  id: string;
  title: string;
  bodyText: string;
  url: string;
};

async function* fetchPagesInSpace(
  config: ConfluenceConfig,
  spaceId: string,
): AsyncGenerator<SpacePage> {
  const siteBaseUrl = resolveSiteBaseUrl(config.siteName);
  const request = createConfluenceRequest(config);
  let nextPathOrUrl =
    `/wiki/api/v2/pages?space-id=${encodeURIComponent(spaceId)}` +
    "&status=current&body-format=storage&limit=100";
  let pageCount = 0;

  while (nextPathOrUrl && pageCount < MAX_PAGINATION_PAGES) {
    pageCount += 1;
    const response = await request(nextPathOrUrl);

    if (!isRecord(response) || !Array.isArray(response.results)) {
      break;
    }

    const linkBase = readLinkBase(response, siteBaseUrl);

    for (const item of response.results) {
      if (!isRecord(item)) continue;
      const bodyHtml =
        isRecord(item.body) &&
        isRecord(item.body.storage) &&
        typeof item.body.storage.value === "string"
          ? item.body.storage.value
          : "";

      yield {
        id: readString(item.id),
        title: typeof item.title === "string" ? item.title : "",
        bodyText: stripHtml(bodyHtml),
        url: readWebUrl(item, linkBase),
      };
    }

    nextPathOrUrl = readNextLink(response, siteBaseUrl);
  }
}

export async function getConfluencePage(
  config: ConfluenceConfig,
  pageId: string,
): Promise<PageContent> {
  const siteBaseUrl = resolveSiteBaseUrl(config.siteName);
  const request = createConfluenceRequest(config);
  const response = await request(
    `/wiki/api/v2/pages/${encodeURIComponent(pageId)}?body-format=storage`,
  );

  if (!isRecord(response)) {
    throw new Error("Confluence page response must be an object.");
  }

  const bodyHtml =
    isRecord(response.body) &&
    isRecord(response.body.storage) &&
    typeof response.body.storage.value === "string"
      ? response.body.storage.value
      : "";

  return {
    id: readString(response.id),
    title: typeof response.title === "string" ? response.title : "",
    url: readWebUrl(response, readLinkBase(response, siteBaseUrl)),
    text: trimText(stripHtml(bodyHtml)),
  };
}

export async function findConfluencePageByTitle(
  config: ConfluenceConfig,
  title: string,
  spaceOverride?: string,
): Promise<PageContent | null> {
  const space = spaceOverride || config.spaceId;

  for await (const page of fetchPagesInSpace(config, space)) {
    if (page.title === title) {
      return getConfluencePage(config, page.id);
    }
  }

  return null;
}

export async function listConfluenceChildPages(
  config: ConfluenceConfig,
  parentId: string,
): Promise<ChildPage[]> {
  const siteBaseUrl = resolveSiteBaseUrl(config.siteName);
  const request = createConfluenceRequest(config);
  const children: ChildPage[] = [];
  let nextPathOrUrl =
    `/wiki/api/v2/pages/${encodeURIComponent(parentId)}/children` +
    `?limit=${CHILD_PAGE_LIMIT}`;
  let pageCount = 0;

  while (nextPathOrUrl && pageCount < MAX_PAGINATION_PAGES) {
    pageCount += 1;
    const response = await request(nextPathOrUrl);

    if (!isRecord(response) || !Array.isArray(response.results)) {
      break;
    }

    for (const item of response.results) {
      if (!isRecord(item)) continue;
      children.push({
        id: readString(item.id),
        title: typeof item.title === "string" ? item.title : "",
        url: readWebUrl(item, siteBaseUrl),
      });
    }

    nextPathOrUrl = readNextLink(response, siteBaseUrl);
  }

  return children;
}

export async function listConfluenceSpaces(
  config: ConfluenceConfig,
): Promise<SpaceSummary[]> {
  const siteBaseUrl = resolveSiteBaseUrl(config.siteName);
  const request = createConfluenceRequest(config);
  const spaces: SpaceSummary[] = [];
  let nextPathOrUrl = "/wiki/api/v2/spaces?limit=50&status=current";
  let pageCount = 0;

  while (nextPathOrUrl && pageCount < MAX_PAGINATION_PAGES) {
    pageCount += 1;
    const response = await request(nextPathOrUrl);

    if (!isRecord(response) || !Array.isArray(response.results)) {
      break;
    }

    for (const item of response.results) {
      if (!isRecord(item)) continue;
      spaces.push({
        id: readString(item.id),
        key: typeof item.key === "string" ? item.key : "",
        name: typeof item.name === "string" ? item.name : "",
      });
    }

    nextPathOrUrl = readNextLink(response, siteBaseUrl);
  }

  return spaces;
}

function createConfluenceRequest(config: ConfluenceConfig) {
  const siteBaseUrl = resolveSiteBaseUrl(config.siteName);
  const fetchImpl = config.fetch ?? fetch;
  const authorization = `Basic ${btoa(`${config.userEmail}:${config.apiToken}`)}`;

  return async (pathOrUrl: string): Promise<unknown> => {
    const url = resolveConfluencePathOrUrl(siteBaseUrl, pathOrUrl);
    const response = await fetchImpl(url, {
      headers: {
        Accept: "application/json",
        Authorization: authorization,
      },
    });

    if (!response.ok) {
      throw new ConfluenceHttpError(
        response.status,
        `Confluence request failed with status ${response.status}.`,
      );
    }

    return response.json();
  };
}

function resolveSiteBaseUrl(siteName: string): string {
  const trimmed = siteName.trim().replace(/\/+$/, "");
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    return trimmed;
  }
  return `https://${trimmed}.atlassian.net`;
}

function resolveConfluencePathOrUrl(siteBaseUrl: string, pathOrUrl: string): string {
  if (pathOrUrl.startsWith("https://") || pathOrUrl.startsWith("http://")) {
    return pathOrUrl;
  }
  return `${siteBaseUrl}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

function readLinkBase(response: Record<string, unknown>, fallback: string): string {
  if (isRecord(response._links) && typeof response._links.base === "string") {
    return response._links.base;
  }
  return fallback;
}

function readWebUrl(item: Record<string, unknown>, base: string): string {
  if (isRecord(item._links) && typeof item._links.webui === "string") {
    return resolveConfluencePathOrUrl(base, item._links.webui);
  }
  return base;
}

function readNextLink(response: Record<string, unknown>, siteBaseUrl: string): string {
  if (!isRecord(response._links) || typeof response._links.next !== "string") {
    return "";
  }

  const resolved = resolveConfluencePathOrUrl(siteBaseUrl, response._links.next);

  // Only follow pagination links that stay on the configured Atlassian origin.
  // This prevents a malicious/corrupted response from redirecting an
  // authenticated (credential-bearing) request to an attacker-controlled host.
  if (!resolved.startsWith(`${siteBaseUrl}/`) && resolved !== siteBaseUrl) {
    return "";
  }

  return resolved;
}

function clampLimit(limit: number): number {
  if (!Number.isFinite(limit) || limit < 1) return 1;
  if (limit > 100) return 100;
  return Math.floor(limit);
}

function stripHtml(html: string): string {
  return decodeEntities(
    html
      .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    );
}

function trimText(text: string): string {
  if (text.length <= MAX_PAGE_TEXT_LENGTH) {
    return text;
  }
  return `${text.slice(0, MAX_PAGE_TEXT_LENGTH)}…`;
}

function readString(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  if (typeof value === "number") {
    return String(value);
  }
  throw new Error("Expected a non-empty string or number value.");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
