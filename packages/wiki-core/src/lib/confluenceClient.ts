import type { RawConfluencePage } from "./confluenceReadModel";
import { readLessonPresentationValue, type LessonPresentationDocument } from "./lessonSemanticBlocks";
import {
  PUBLIC_WIKI_SPACE_ID,
  type RemoteWikiPageRecord,
} from "./wikiDataSource";

const METADATA_PROPERTY_KEY = "wiki.metadata";
const LESSON_PRESENTATION_PROPERTY_KEY = "lesson.presentation";

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

const METADATA_FETCH_BATCH_SIZE = 20;

export async function fetchConfluencePageRecords(
  config: ConfluenceClientConfig,
): Promise<RemoteWikiPageRecord[]> {
  const siteBaseUrl = resolveSiteBaseUrl(config.siteName);
  const spaceId = config.spaceId || PUBLIC_WIKI_SPACE_ID;
  const request = createConfluenceRequest(config);
  const pages = await fetchAllPages(siteBaseUrl, spaceId, request);
  const records: RemoteWikiPageRecord[] = [];

  for (let i = 0; i < pages.length; i += METADATA_FETCH_BATCH_SIZE) {
    const batch = pages.slice(i, i + METADATA_FETCH_BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (page) => {
        const metadata = await fetchPageMetadata(siteBaseUrl, page.id, request);
        const resolvedMetadata = metadata ?? inferMetadataFromTitle(page.title);

        if (!resolvedMetadata) {
          return null;
        }

        const presentation =
          resolvedMetadata.docType === "lesson"
            ? await fetchLessonPresentation(siteBaseUrl, page.id, request)
            : undefined;

        return {
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
            ...(presentation ? { presentation } : {}),
            updatedAt: normalizeUpdatedAt(page.version?.createdAt),
          },
        } satisfies RemoteWikiPageRecord;
      }),
    );

    for (const result of batchResults) {
      if (result !== null) {
        records.push(result);
      }
    }
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
    try {
      return readMetadataValue(property.value);
    } catch {
      return null;
    }
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

  try {
    return readMetadataValue(propertyDetail.value);
  } catch {
    return null;
  }
}

/**
 * `wiki.metadata`와는 별개인 Content Property. lesson docType 문서에만 존재하며, 실제 학습
 * 콘텐츠(Scene/블록/내레이션 등)를 담는다. 다른 docType 문서에는 이 property가 없으므로
 * lesson docType으로 판명된 문서에만 호출해 API 요청 수를 늘리지 않는다.
 */
async function fetchLessonPresentation(
  siteBaseUrl: string,
  pageId: string,
  request: (pathOrUrl: string) => Promise<unknown>,
): Promise<LessonPresentationDocument | undefined> {
  const response = await request(
    `/wiki/api/v2/pages/${encodeURIComponent(pageId)}/properties?key=${encodeURIComponent(LESSON_PRESENTATION_PROPERTY_KEY)}`,
  );
  const propertyList = readPropertyListResponse(response);
  const property = propertyList.results.find((item) => item.key === LESSON_PRESENTATION_PROPERTY_KEY);

  if (!property) {
    return undefined;
  }

  if (property.value) {
    return readLessonPresentationValue(property.value);
  }

  if (!property.id) {
    return undefined;
  }

  const propertyResponse = await request(
    resolveConfluencePathOrUrl(
      siteBaseUrl,
      `/wiki/api/v2/pages/${encodeURIComponent(pageId)}/properties/${encodeURIComponent(property.id)}`,
    ),
  );
  const propertyDetail = readPropertyResponse(propertyResponse);

  if (propertyDetail.key !== LESSON_PRESENTATION_PROPERTY_KEY || !propertyDetail.value) {
    return undefined;
  }

  return readLessonPresentationValue(propertyDetail.value);
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

function createConfluenceWriteRequest(config: ConfluenceClientConfig) {
  const siteBaseUrl = resolveSiteBaseUrl(config.siteName);
  const fetchImpl = config.fetch ?? fetch;
  const authorization = `Basic ${btoa(`${config.userEmail}:${config.apiToken}`)}`;

  return async (pathOrUrl: string, method: "POST" | "PUT", body: unknown) => {
    const url = resolveConfluencePathOrUrl(siteBaseUrl, pathOrUrl);
    const response = await fetchImpl(url, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Confluence write failed with status ${response.status}: ${text}`);
    }

    return response.json();
  };
}

export type ConfluencePageSummary = {
  id: string;
  title: string;
  version: number;
};

export type ConfluencePageDetail = ConfluencePageSummary & {
  bodyHtml: string;
};

export async function findConfluenceChildPageByTitle(
  config: ConfluenceClientConfig,
  parentId: string,
  title: string,
): Promise<ConfluencePageSummary | null> {
  const siteBaseUrl = resolveSiteBaseUrl(config.siteName);
  const request = createConfluenceRequest(config);
  let nextPath = `/wiki/api/v2/pages/${encodeURIComponent(parentId)}/children?limit=50`;

  while (nextPath) {
    const response = await request(nextPath);

    if (!isRecord(response) || !Array.isArray(response.results)) {
      break;
    }

    for (const item of response.results) {
      if (!isRecord(item)) continue;
      const itemTitle = typeof item.title === "string" ? item.title : "";
      if (itemTitle === title) {
        return {
          id: readString(item.id, "child.id"),
          title: itemTitle,
          version: isRecord(item.version) && typeof item.version.number === "number"
            ? item.version.number
            : 1,
        };
      }
    }

    nextPath = isRecord(response._links) && typeof response._links.next === "string"
      ? resolveConfluencePathOrUrl(siteBaseUrl, response._links.next)
      : "";
  }

  return null;
}

export async function getConfluencePageDetail(
  config: ConfluenceClientConfig,
  pageId: string,
): Promise<ConfluencePageDetail> {
  const request = createConfluenceRequest(config);
  const response = await request(
    `/wiki/api/v2/pages/${encodeURIComponent(pageId)}?body-format=storage`,
  );

  if (!isRecord(response)) {
    throw new Error("Confluence page detail response must be an object.");
  }

  const bodyHtml = isRecord(response.body) &&
    isRecord(response.body.storage) &&
    typeof response.body.storage.value === "string"
    ? response.body.storage.value
    : "";

  return {
    id: readString(response.id, "page.id"),
    title: readString(response.title, "page.title"),
    version: isRecord(response.version) && typeof response.version.number === "number"
      ? response.version.number
      : 1,
    bodyHtml,
  };
}

export async function createConfluencePage(
  config: ConfluenceClientConfig,
  parentId: string,
  title: string,
  bodyHtml: string,
): Promise<string> {
  const spaceId = config.spaceId || PUBLIC_WIKI_SPACE_ID;
  const write = createConfluenceWriteRequest(config);
  const response = await write("/wiki/api/v2/pages", "POST", {
    spaceId,
    parentId,
    title,
    status: "current",
    body: {
      storage: {
        value: bodyHtml,
        representation: "storage",
      },
    },
  });

  if (!isRecord(response) || typeof response.id !== "string") {
    throw new Error("Confluence create page response did not include id.");
  }

  return response.id;
}

export async function updateConfluencePage(
  config: ConfluenceClientConfig,
  pageId: string,
  title: string,
  bodyHtml: string,
  currentVersion: number,
): Promise<void> {
  const write = createConfluenceWriteRequest(config);
  await write(`/wiki/api/v2/pages/${encodeURIComponent(pageId)}`, "PUT", {
    id: pageId,
    status: "current",
    title,
    version: { number: currentVersion + 1 },
    body: {
      storage: {
        value: bodyHtml,
        representation: "storage",
      },
    },
  });
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
        id: typeof property.id === "string" ? property.id : typeof property.id === "number" ? String(property.id) : undefined,
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
    audience: readAudience(value.audience),
    status: readStatus(value.status),
    prerequisites: readStringArray(value.prerequisites),
    next: readStringArray(value.next),
    related: readStringArray(value.related),
    // lesson docType 전용 평탄화 필드(Course Manifest) — 다른 docType 문서에는 없다.
    ...(typeof value.courseId === "string" && value.courseId.trim() ? { courseId: value.courseId } : {}),
    ...(typeof value.order === "number" && Number.isInteger(value.order) ? { order: value.order } : {}),
    ...(typeof value.chapter === "string" && value.chapter.trim() ? { chapter: value.chapter } : {}),
    ...(typeof value.estimatedMinutes === "number" && Number.isFinite(value.estimatedMinutes)
      ? { estimatedMinutes: value.estimatedMinutes }
      : {}),
    ...(Array.isArray(value.learningObjectives)
      ? { learningObjectives: readStringArray(value.learningObjectives) }
      : {}),
    ...(typeof value.lastReviewedAt === "string" && value.lastReviewedAt.trim()
      ? { lastReviewedAt: value.lastReviewedAt }
      : {}),
  };
}

function inferMetadataFromTitle(title: string): RawConfluencePage["metadata"] | null {
  const normalizedTitle = title.trim().toLocaleLowerCase("ko-KR");

  if (normalizedTitle.startsWith("[guide]") || normalizedTitle.startsWith("guide")) {
    return {
      docType: "guide",
      audience: "beginner",
      status: "published",
      prerequisites: [],
      next: [],
      related: [],
    };
  }

  if (normalizedTitle.startsWith("[faq]") || normalizedTitle.startsWith("faq")) {
    return {
      docType: "faq",
      audience: "beginner",
      status: "published",
      prerequisites: [],
      next: [],
      related: [],
    };
  }

  if (
    normalizedTitle.startsWith("[blueprint]") ||
    normalizedTitle.startsWith("blueprint") ||
    normalizedTitle.startsWith("[playbook]") ||
    normalizedTitle === "playbook"
  ) {
    return {
      docType: "playbook",
      audience: "intermediate",
      status: "published",
      prerequisites: [],
      next: [],
      related: [],
    };
  }

  if (normalizedTitle.startsWith("[project]") || normalizedTitle.startsWith("project")) {
    return {
      docType: "page",
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
    value === "guide" ||
    value === "page" ||
    value === "faq" ||
    value === "library" ||
    value === "policy" ||
    value === "nav" ||
    value === "ops" ||
    value === "playbook" ||
    value === "lesson"
  ) {
    return value;
  }

  throw new Error("wiki.metadata.docType is invalid.");
}

function readAudience(value: unknown): RawConfluencePage["metadata"]["audience"] {
  if (value === "beginner" || value === "intermediate" || value === "advanced") {
    return value;
  }

  return "beginner";
}

function readStatus(value: unknown): RawConfluencePage["metadata"]["status"] {
  if (value === "draft" || value === "reviewed" || value === "published") {
    return value;
  }

  return "published";
}

function readString(value: unknown, fieldName: string) {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  throw new Error(`${fieldName} must be a non-empty string.`);
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  // 실측 콘텐츠에서 `prerequisites`가 페이지 ID를 문자열 대신 숫자로 담고 있는 경우가
  // 확인됨 — 문자열로 정규화한다.
  if (!value.every((item) => typeof item === "string" || typeof item === "number")) {
    return [];
  }

  return value.map((item) => String(item));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
