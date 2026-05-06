import type { RawConfluencePage } from "./confluenceReadModel";
import {
  PUBLIC_WIKI_SPACE_ID,
  type RemoteWikiPageRecord,
} from "./wikiDataSource";
import type { CategorySlug } from "./wikiDocuments";

const METADATA_PROPERTY_KEY = "wiki.metadata";

type FetchLike = typeof fetch;

export type ConfluenceClientConfig = {
  siteName: string;
  userEmail: string;
  apiToken: string;
  spaceId?: string;
  fetch?: FetchLike;
};

type ConfluencePageResult = {
  id: string;
  parentId?: string;
  status: string;
  title: string;
  spaceId: string;
  version?: {
    number?: number;
    createdAt?: string;
  };
  body?: {
    storage?: {
      value?: string;
    };
  };
  _links?: {
    webui?: string;
  };
};

type ConfluencePropertyListResponse = {
  results: Array<{
    id?: string;
    key?: string;
    value?: unknown;
  }>;
};

type ConfluencePropertyResponse = {
  id?: string;
  key?: string;
  value?: unknown;
};

export async function fetchConfluencePageRecords(
  config: ConfluenceClientConfig,
): Promise<RemoteWikiPageRecord[]> {
  const siteBaseUrl = resolveSiteBaseUrl(config.siteName);
  const spaceId = config.spaceId || PUBLIC_WIKI_SPACE_ID;
  const request = createConfluenceRequest(config);
  const pages = await fetchAllPages(siteBaseUrl, spaceId, request);
  const records: RemoteWikiPageRecord[] = [];

  for (const page of pages) {
    const metadata = await fetchPageMetadata(siteBaseUrl, page.id, request);
    const resolvedMetadata = metadata ?? inferMetadataFromTitle(page.title);

    if (!resolvedMetadata) {
      continue;
    }

    records.push({
      category: resolveCategory(resolvedMetadata.docType),
      slug: slugifyPageTitle(page.title, page.id),
      page: {
        id: page.id,
        ...(page.parentId ? { parentId: page.parentId } : {}),
        title: page.title,
        spaceId: page.spaceId,
        status: page.status,
        version: page.version?.number ?? 1,
        bodyHtml: page.body?.storage?.value ?? "",
        sourceUrl: resolvePageUrl(siteBaseUrl, page._links?.webui),
        metadata: resolvedMetadata,
        updatedAt: normalizeUpdatedAt(page.version?.createdAt),
      },
    });
  }

  return records;
}

async function fetchAllPages(
  siteBaseUrl: string,
  spaceId: string,
  request: (pathOrUrl: string) => Promise<unknown>,
) {
  const pages: ConfluencePageResult[] = [];
  let nextPathOrUrl =
    `/wiki/api/v2/pages?space-id=${encodeURIComponent(spaceId)}` +
    "&status=current&body-format=storage&limit=100";

  while (nextPathOrUrl) {
    const response = await request(nextPathOrUrl);
    const pageList = readPageListResponse(response);

    pages.push(...pageList.results);
    nextPathOrUrl = pageList.next
      ? resolveConfluencePathOrUrl(siteBaseUrl, pageList.next)
      : "";
  }

  return pages;
}

async function fetchPageMetadata(
  siteBaseUrl: string,
  pageId: string,
  request: (pathOrUrl: string) => Promise<unknown>,
) {
  const response = await request(
    `/wiki/api/v2/pages/${encodeURIComponent(pageId)}/properties?key=${encodeURIComponent(METADATA_PROPERTY_KEY)}`,
  );
  const propertyList = readPropertyListResponse(response);
  const property = propertyList.results.find((item) => item.key === METADATA_PROPERTY_KEY);

  if (!property) {
    return null;
  }

  if (property.value) {
    return readMetadataValue(property.value);
  }

  if (!property.id) {
    return null;
  }

  const propertyResponse = await request(
    resolveConfluencePathOrUrl(
      siteBaseUrl,
      `/wiki/api/v2/pages/${encodeURIComponent(pageId)}/properties/${encodeURIComponent(property.id)}`,
    ),
  );
  const propertyDetail = readPropertyResponse(propertyResponse);

  if (propertyDetail.key !== METADATA_PROPERTY_KEY || !propertyDetail.value) {
    return null;
  }

  return readMetadataValue(propertyDetail.value);
}

function createConfluenceRequest(config: ConfluenceClientConfig) {
  const siteBaseUrl = resolveSiteBaseUrl(config.siteName);
  const fetchImpl = config.fetch ?? fetch;
  const authorization = `Basic ${btoa(`${config.userEmail}:${config.apiToken}`)}`;

  return async (pathOrUrl: string) => {
    const url = resolveConfluencePathOrUrl(siteBaseUrl, pathOrUrl);
    const response = await fetchImpl(url, {
      headers: {
        Accept: "application/json",
        Authorization: authorization,
      },
    });

    if (!response.ok) {
      throw new Error(`Confluence request failed with status ${response.status}.`);
    }

    return response.json();
  };
}

function readPageListResponse(response: unknown) {
  if (!isRecord(response) || !Array.isArray(response.results)) {
    throw new Error("Confluence page response must include results.");
  }

  return {
    results: response.results.map(readPageResult),
    next: isRecord(response._links) && typeof response._links.next === "string"
      ? response._links.next
      : "",
  };
}

function readPageResult(page: unknown): ConfluencePageResult {
  if (!isRecord(page)) {
    throw new Error("Confluence page result must be an object.");
  }

  return {
    id: readString(page.id, "page.id"),
    parentId: typeof page.parentId === "string" && page.parentId.trim()
      ? page.parentId
      : undefined,
    status: readString(page.status, "page.status"),
    title: readString(page.title, "page.title"),
    spaceId: readString(page.spaceId, "page.spaceId"),
    version: isRecord(page.version)
      ? {
          number: typeof page.version.number === "number" ? page.version.number : undefined,
          createdAt: typeof page.version.createdAt === "string" ? page.version.createdAt : undefined,
        }
      : undefined,
    body: isRecord(page.body) && isRecord(page.body.storage)
      ? {
          storage: {
            value: typeof page.body.storage.value === "string" ? page.body.storage.value : "",
          },
        }
      : undefined,
    _links: isRecord(page._links) && typeof page._links.webui === "string"
      ? { webui: page._links.webui }
      : undefined,
  };
}

function readPropertyListResponse(response: unknown): ConfluencePropertyListResponse {
  if (!isRecord(response) || !Array.isArray(response.results)) {
    throw new Error("Confluence property response must include results.");
  }

  return {
    results: response.results
      .filter(isRecord)
      .map((property) => ({
        id: typeof property.id === "string" ? property.id : undefined,
        key: typeof property.key === "string" ? property.key : undefined,
        value: property.value,
      })),
  };
}

function readPropertyResponse(response: unknown): ConfluencePropertyResponse {
  if (!isRecord(response)) {
    throw new Error("Confluence property detail response must be an object.");
  }

  return {
    id: typeof response.id === "string" ? response.id : undefined,
    key: typeof response.key === "string" ? response.key : undefined,
    value: response.value,
  };
}

function readMetadataValue(value: unknown): RawConfluencePage["metadata"] {
  if (!isRecord(value)) {
    throw new Error("Confluence metadata value must be an object.");
  }

  return {
    docType: readDocType(value.docType),
    visibility: readVisibility(value.visibility),
    audience: readAudience(value.audience),
    status: readStatus(value.status),
    prerequisites: readStringArray(value.prerequisites),
    next: readStringArray(value.next),
    related: readStringArray(value.related),
  };
}

function resolveCategory(docType: RawConfluencePage["metadata"]["docType"]): CategorySlug {
  if (docType === "example") {
    return "projects";
  }

  if (docType === "reference" || docType === "ops") {
    return "library";
  }

  if (docType === "troubleshooting") {
    return "faq";
  }

  return "guides";
}

function inferMetadataFromTitle(title: string): RawConfluencePage["metadata"] | null {
  const normalizedTitle = title.trim().toLocaleLowerCase("ko-KR");

  if (normalizedTitle.startsWith("[guide]") || normalizedTitle.startsWith("guide")) {
    return {
      docType: "tutorial",
      visibility: "public",
      audience: "beginner",
      status: "published",
      prerequisites: [],
      next: [],
      related: [],
    };
  }

  if (normalizedTitle.startsWith("[faq]") || normalizedTitle.startsWith("faq")) {
    return {
      docType: "troubleshooting",
      visibility: "public",
      audience: "beginner",
      status: "published",
      prerequisites: [],
      next: [],
      related: [],
    };
  }

  if (normalizedTitle.startsWith("[blueprint]") || normalizedTitle.startsWith("blueprint")) {
    return {
      docType: "overview",
      visibility: "public",
      audience: "intermediate",
      status: "published",
      prerequisites: [],
      next: [],
      related: [],
    };
  }

  if (normalizedTitle.startsWith("[project]") || normalizedTitle.startsWith("project")) {
    return {
      docType: "example",
      visibility: "public",
      audience: "intermediate",
      status: "published",
      prerequisites: [],
      next: [],
      related: [],
    };
  }

  if (normalizedTitle.startsWith("[playbook]") || normalizedTitle === "playbook") {
    return {
      docType: "reference",
      visibility: "public",
      audience: "intermediate",
      status: "published",
      prerequisites: [],
      next: [],
      related: [],
    };
  }

  return null;
}

function resolveSiteBaseUrl(siteName: string) {
  const trimmed = siteName.trim().replace(/\/+$/, "");

  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    return trimmed;
  }

  return `https://${trimmed}.atlassian.net`;
}

function resolveConfluencePathOrUrl(siteBaseUrl: string, pathOrUrl: string) {
  if (pathOrUrl.startsWith("https://") || pathOrUrl.startsWith("http://")) {
    return pathOrUrl;
  }

  return `${siteBaseUrl}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

function resolvePageUrl(siteBaseUrl: string, webui?: string) {
  if (!webui) {
    return siteBaseUrl;
  }

  return resolveConfluencePathOrUrl(siteBaseUrl, webui);
}

function normalizeUpdatedAt(createdAt?: string) {
  if (!createdAt) {
    return new Date().toISOString().slice(0, 10);
  }

  return createdAt.slice(0, 10);
}

function slugifyPageTitle(title: string, fallbackId: string) {
  const slug = title
    .toLocaleLowerCase("ko-KR")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");

  return slug || fallbackId;
}

function readDocType(value: unknown): RawConfluencePage["metadata"]["docType"] {
  if (
    value === "overview" ||
    value === "concept" ||
    value === "tutorial" ||
    value === "howto" ||
    value === "reference" ||
    value === "troubleshooting" ||
    value === "example" ||
    value === "ops" ||
    value === "policy"
  ) {
    return value;
  }

  throw new Error("wiki.metadata.docType is invalid.");
}

function readVisibility(value: unknown): RawConfluencePage["metadata"]["visibility"] {
  if (value === "public" || value === "internal") {
    return value;
  }

  throw new Error("wiki.metadata.visibility is invalid.");
}

function readAudience(value: unknown): RawConfluencePage["metadata"]["audience"] {
  if (value === "beginner" || value === "intermediate" || value === "advanced") {
    return value;
  }

  throw new Error("wiki.metadata.audience is invalid.");
}

function readStatus(value: unknown): RawConfluencePage["metadata"]["status"] {
  if (value === "draft" || value === "reviewed" || value === "published") {
    return value;
  }

  throw new Error("wiki.metadata.status is invalid.");
}

function readString(value: unknown, fieldName: string) {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  throw new Error(`${fieldName} must be a non-empty string.`);
}

function readStringArray(value: unknown) {
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value;
  }

  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
