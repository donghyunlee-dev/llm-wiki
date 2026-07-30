export type WikiSearchStatus = "idle" | "loading" | "success" | "error";

export type WikiSearchResult = {
  answer: string;
  sources: WikiSearchSource[];
};

export type WikiSearchSource = {
  id?: string;
  title: string;
  href: string;
};

export type WikiSidebarDocument = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  contentHtml: string;
  relatedDocuments: WikiSearchSource[];
};

type WikiSearchResponse = {
  answer?: unknown;
  confluenceData?: unknown;
  recommendedDocuments?: unknown;
  relatedDocuments?: unknown;
};

type CleanWikiPage = {
  id?: unknown;
  slug?: unknown;
  title?: unknown;
  summary?: unknown;
  href?: unknown;
  contentHtml?: unknown;
  related?: unknown;
};

type CleanDocumentsResponse = {
  pages?: unknown;
};

type WikiDocumentLike = {
  id?: unknown;
  pageId?: unknown;
  title?: unknown;
  href?: unknown;
  slug?: unknown;
};

export const DEFAULT_WIKI_BASE_URL = "https://ax-wiki.s-food.ai";

// Mirrors @sfood/wiki-core's stripTitleTypePrefix (apps/edge-sidebar deliberately has no
// dependency on wiki-core — see README) — strips a leading "[Type]" bracket for display only,
// never touching href/matching logic.
export function stripTitleTypePrefix(title: string): string {
  return title.replace(/^\[[^\]]+\]\s*/, "");
}

function stripDuplicateTitleHeading(contentHtml: string, rawTitle: string): string {
  const match = contentHtml.match(/^\s*<h1[^>]*>([\s\S]*?)<\/h1>/i);

  if (!match) {
    return contentHtml;
  }

  const headingText = match[1]?.replace(/<[^>]+>/g, "").trim() ?? "";

  if (headingText !== rawTitle.trim()) {
    return contentHtml;
  }

  return contentHtml.slice(match[0].length);
}

export function normalizeWikiBaseUrl(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return DEFAULT_WIKI_BASE_URL;
  }

  return trimmed.replace(/\/+$/, "");
}

export function buildWikiSearchUrl(baseUrl: string, question: string): string {
  const normalizedBaseUrl = normalizeWikiBaseUrl(baseUrl);
  const params = new URLSearchParams({ q: question.trim() });

  return `${normalizedBaseUrl}/search?${params.toString()}`;
}

export function resolveWikiHref(baseUrl: string, href: string): string {
  const normalizedBaseUrl = normalizeWikiBaseUrl(baseUrl);
  const trimmedHref = href.trim();

  if (!trimmedHref) {
    return normalizedBaseUrl;
  }

  if (/^https?:\/\//i.test(trimmedHref)) {
    return trimmedHref;
  }

  return `${normalizedBaseUrl}${trimmedHref.startsWith("/") ? "" : "/"}${trimmedHref}`;
}

export async function requestWikiSearch(baseUrl: string, question: string): Promise<WikiSearchResult> {
  const normalizedBaseUrl = normalizeWikiBaseUrl(baseUrl);
  // Built with a real endpoint (production Lambda Function URL), this is used verbatim instead of
  // the dev-only `{baseUrl}/api/wiki/ai/search` relative path, which only exists via Vite's dev
  // middleware and is never served by the deployed static site.
  const endpoint = import.meta.env.VITE_AI_SEARCH_ENDPOINT?.trim() || `${normalizedBaseUrl}/api/wiki/ai/search`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ question: question.trim() })
  });

  if (!response.ok) {
    throw new Error(`Wiki search failed with ${response.status}`);
  }

  const data = (await response.json()) as WikiSearchResponse;
  return normalizeWikiSearchResponse(data);
}

export async function requestWikiDocumentByHref(baseUrl: string, href: string): Promise<WikiSidebarDocument> {
  const normalizedBaseUrl = normalizeWikiBaseUrl(baseUrl);
  // Same production-endpoint override as requestWikiSearch above.
  const endpoint = import.meta.env.VITE_WIKI_DOCUMENTS_ENDPOINT?.trim() || `${normalizedBaseUrl}/api/wiki/documents`;
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(`Wiki documents failed with ${response.status}`);
  }

  const data = (await response.json()) as CleanDocumentsResponse;
  const document = findCleanDocumentByHref(data.pages, normalizedBaseUrl, href);

  if (!document) {
    throw new Error("가이드 본문을 찾지 못했습니다.");
  }

  return document;
}

export function normalizeWikiSearchResponse(data: WikiSearchResponse): WikiSearchResult {
  const answer =
    typeof data.answer === "string" && data.answer.trim()
      ? data.answer.trim()
      : "위키 검색 응답을 받았지만 표시할 답변 본문이 없습니다.";

  const sources = [
    ...readDocumentSources(data.confluenceData),
    ...readDocumentSources(data.recommendedDocuments),
    ...readDocumentSources(data.relatedDocuments)
  ].reduce<WikiSearchSource[]>((accumulated, source) => {
    const sourceKey = source.id ?? source.title;
    const existingIndex = accumulated.findIndex((item) => (item.id ?? item.title) === sourceKey);

    if (existingIndex < 0) {
      return [...accumulated, source];
    }

    if (isSpecificDocumentHref(source.href) && !isSpecificDocumentHref(accumulated[existingIndex]?.href ?? "")) {
      return accumulated.map((item, index) => (index === existingIndex ? source : item));
    }

    return accumulated;
  }, []);

  return { answer, sources };
}

export function findCleanDocumentByHref(value: unknown, baseUrl: string, href: string): WikiSidebarDocument | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const target = parseWikiHref(baseUrl, href);

  for (const raw of value) {
    if (typeof raw !== "object" || raw === null) {
      continue;
    }

    const page = raw as CleanWikiPage;
    const id = typeof page.id === "string" ? page.id : "";
    const slug = typeof page.slug === "string" ? page.slug : "";
    const rawTitle = typeof page.title === "string" ? page.title : "";
    const rawContentHtml = typeof page.contentHtml === "string" ? page.contentHtml : "";

    const matches = target.id ? id === target.id : slug === target.slug;
    if (!matches || !rawTitle) {
      continue;
    }

    return {
      id,
      slug,
      title: stripTitleTypePrefix(rawTitle),
      summary: typeof page.summary === "string" ? page.summary : "",
      contentHtml: stripDuplicateTitleHeading(rawContentHtml, rawTitle),
      relatedDocuments: readCleanRelated(page.related),
    };
  }

  return null;
}

function readCleanRelated(value: unknown): WikiSearchSource[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item !== "object" || item === null) {
        return null;
      }
      const related = item as { title?: unknown; href?: unknown };
      const title = typeof related.title === "string" ? stripTitleTypePrefix(related.title.trim()) : "";
      const href = typeof related.href === "string" ? related.href.trim() : "";
      return title && href ? { title, href } : null;
    })
    .filter((item): item is WikiSearchSource => item !== null);
}

function readDocumentSources(value: unknown): WikiSearchSource[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): WikiSearchSource | null => {
      if (!isWikiDocumentLike(item) || typeof item.title !== "string") {
        return null;
      }

      const id = readDocumentId(item);
      const title = stripTitleTypePrefix(item.title.trim());
      const href = readDocumentHref(item);

      return title && href ? { id, title, href } : null;
    })
    .filter((item): item is WikiSearchSource => item !== null);
}

function isWikiDocumentLike(value: unknown): value is WikiDocumentLike {
  return typeof value === "object" && value !== null;
}

function parseWikiHref(baseUrl: string, href: string) {
  const resolvedHref = resolveWikiHref(baseUrl, href);

  try {
    const url = new URL(resolvedHref);
    const parts = url.pathname.split("/").filter(Boolean);
    const wikiIndex = parts.indexOf("wiki");
    const guidesIndex = parts.indexOf("guides");

    if (wikiIndex >= 0 && parts[wikiIndex + 1]) {
      return { id: decodeURIComponent(parts[wikiIndex + 1]), slug: "" };
    }

    if (guidesIndex >= 0 && parts[guidesIndex + 1]) {
      return { id: "", slug: decodeURIComponent(parts[guidesIndex + 1]) };
    }

    return { id: "", slug: decodeURIComponent(parts.at(-1) ?? "") };
  } catch {
    const parts = href.split("?")[0]?.split("#")[0]?.split("/").filter(Boolean) ?? [];
    const wikiIndex = parts.indexOf("wiki");
    const guidesIndex = parts.indexOf("guides");

    if (wikiIndex >= 0 && parts[wikiIndex + 1]) {
      return { id: decodeURIComponent(parts[wikiIndex + 1]), slug: "" };
    }

    if (guidesIndex >= 0 && parts[guidesIndex + 1]) {
      return { id: "", slug: decodeURIComponent(parts[guidesIndex + 1]) };
    }

    return { id: "", slug: decodeURIComponent(parts.at(-1) ?? "") };
  }
}

function readDocumentId(document: WikiDocumentLike): string | undefined {
  if (typeof document.pageId === "string" && document.pageId.trim()) {
    return document.pageId.trim();
  }

  if (typeof document.id === "string" && document.id.trim()) {
    return document.id.trim();
  }

  return undefined;
}

function readDocumentHref(document: WikiDocumentLike): string {
  if (typeof document.href === "string" && document.href.trim()) {
    return document.href.trim();
  }

  if (typeof document.slug === "string" && document.slug.trim()) {
    return `/guides/${document.slug.trim()}`;
  }

  if (typeof document.pageId === "string" && document.pageId.trim()) {
    return `/wiki/${document.pageId.trim()}`;
  }

  if (typeof document.id === "string" && document.id.trim()) {
    return `/wiki/${document.id.trim()}`;
  }

  return "";
}

function isSpecificDocumentHref(href: string) {
  return /\/(guides|faq|library)\//.test(href);
}
