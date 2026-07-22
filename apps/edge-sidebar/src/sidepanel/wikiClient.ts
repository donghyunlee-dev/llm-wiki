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

type WikiPagesResponse = {
  pages?: unknown;
};

type WikiDocumentLike = {
  id?: unknown;
  pageId?: unknown;
  title?: unknown;
  href?: unknown;
  slug?: unknown;
  summary?: unknown;
  contentHtml?: unknown;
  bodyHtml?: unknown;
  page?: unknown;
  metadata?: unknown;
};

type SidebarDocumentRaw = WikiSidebarDocument & { relatedIds: string[] };

export const DEFAULT_WIKI_BASE_URL = "http://localhost:5173";

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
  const response = await fetch(`${normalizedBaseUrl}/api/wiki/ai/search`, {
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
  const response = await fetch(`${normalizedBaseUrl}/api/wiki-pages`);

  if (!response.ok) {
    throw new Error(`Wiki pages failed with ${response.status}`);
  }

  const data = (await response.json()) as WikiPagesResponse;
  const document = findWikiDocumentByHref(data.pages, normalizedBaseUrl, href);

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

export function findWikiDocumentByHref(value: unknown, baseUrl: string, href: string): WikiSidebarDocument | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const allDocs = value
    .map(readSidebarDocument)
    .filter((doc): doc is SidebarDocumentRaw => doc !== null);

  const target = parseWikiHref(baseUrl, href);

  const rawDoc = allDocs.find((doc) => {
    if (target.id) {
      return doc.id === target.id;
    }
    return doc.slug === target.slug;
  }) ?? null;

  if (!rawDoc) {
    return null;
  }

  const docsById = new Map(allDocs.map((doc) => [doc.id, doc]));
  const relatedDocuments = rawDoc.relatedIds
    .map((id) => docsById.get(id))
    .filter((doc): doc is SidebarDocumentRaw => doc !== undefined)
    .map((doc): WikiSearchSource => ({ title: doc.title, href: `/guides/${doc.slug}` }));

  return {
    id: rawDoc.id,
    slug: rawDoc.slug,
    title: rawDoc.title,
    summary: rawDoc.summary,
    contentHtml: rawDoc.contentHtml,
    relatedDocuments,
  };
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
      const title = item.title.trim();
      const href = readDocumentHref(item);

      return title && href ? { id, title, href } : null;
    })
    .filter((item): item is WikiSearchSource => item !== null);
}

function isWikiDocumentLike(value: unknown): value is WikiDocumentLike {
  return typeof value === "object" && value !== null;
}

function readSidebarDocument(value: unknown): SidebarDocumentRaw | null {
  if (!isWikiDocumentLike(value)) {
    return null;
  }

  const nestedPage = isWikiDocumentLike(value.page) ? value.page : null;
  const rawId = typeof value.id === "string" ? value.id : typeof nestedPage?.id === "string" ? nestedPage.id : "";
  const rawSlug = typeof value.slug === "string" ? value.slug : "";
  const rawTitle = typeof value.title === "string" ? value.title : typeof nestedPage?.title === "string" ? nestedPage.title : "";
  const rawContentHtml =
    typeof value.contentHtml === "string"
      ? value.contentHtml
      : typeof value.bodyHtml === "string"
        ? value.bodyHtml
        : typeof nestedPage?.bodyHtml === "string"
          ? nestedPage.bodyHtml
          : typeof nestedPage?.contentHtml === "string"
            ? nestedPage.contentHtml
            : "";

  const rawMetadata = nestedPage?.metadata;
  const relatedIds: string[] =
    typeof rawMetadata === "object" && rawMetadata !== null && Array.isArray((rawMetadata as Record<string, unknown>)["related"])
      ? ((rawMetadata as Record<string, unknown[]>)["related"]).filter((id): id is string => typeof id === "string")
      : [];

  if (
    !rawId ||
    !rawSlug ||
    !rawTitle ||
    !rawContentHtml
  ) {
    return null;
  }

  return {
    id: rawId,
    slug: rawSlug,
    title: rawTitle,
    summary:
      typeof value.summary === "string"
        ? value.summary
        : typeof nestedPage?.summary === "string"
          ? nestedPage.summary
          : "",
    contentHtml: rewriteConfluenceStorageLinks(rawContentHtml),
    relatedDocuments: [],
    relatedIds,
  };
}

export function rewriteConfluenceStorageLinks(html: string): string {
  return html.replace(/<ac:link([^>]*)>([\s\S]*?)<\/ac:link>/gi, (_match, attrs, inner) => {
    const anchorMatch = attrs.match(/ac:anchor="([^"]+)"/i);
    if (anchorMatch) {
      const anchorId = anchorMatch[1] as string;
      const linkText = extractConfluenceLinkText(inner as string) || anchorId;
      return `<a href="#${anchorId}">${escapeHtml(linkText)}</a>`;
    }

    const pageIdMatch =
      (inner as string).match(/ri:content-id="([^"]+)"/i) ||
      (inner as string).match(/ri:page-id="([^"]+)"/i);
    const pageId = pageIdMatch?.[1]?.trim() ?? "";

    const linkText =
      extractConfluenceLinkText(inner as string) ||
      ((inner as string).match(/ri:content-title="([^"]+)"/i)?.[1]?.trim() ?? "");

    if (!linkText) {
      return "";
    }

    if (pageId) {
      return `<a href="/wiki/${pageId}">${escapeHtml(linkText)}</a>`;
    }

    return escapeHtml(linkText);
  });
}

function extractConfluenceLinkText(inner: string): string {
  const cdataMatch = inner.match(
    /<ac:plain-text-link-body[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/ac:plain-text-link-body>/i,
  );
  if (cdataMatch?.[1]?.trim()) {
    return cdataMatch[1].trim();
  }

  const plainMatch = inner.match(
    /<ac:plain-text-link-body[^>]*>([\s\S]*?)<\/ac:plain-text-link-body>/i,
  );
  if (plainMatch?.[1]?.trim()) {
    return plainMatch[1].trim();
  }

  const linkBodyMatch = inner.match(/<ac:link-body[^>]*>([\s\S]*?)<\/ac:link-body>/i);
  if (linkBodyMatch?.[1]?.trim()) {
    return linkBodyMatch[1].trim();
  }

  return "";
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
