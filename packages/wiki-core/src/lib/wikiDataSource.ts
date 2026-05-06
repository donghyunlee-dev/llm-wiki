import { buildSnapshotWikiDocuments } from "./confluenceSnapshots";
import {
  htmlToPlainText,
  normalizeConfluencePage,
  type RawConfluencePage,
} from "./confluenceReadModel";
import type { CategorySlug, WikiDocument } from "./wikiDocuments";

export const PUBLIC_WIKI_SPACE_ID = "63111172";
const ALLOWED_REMOTE_CATEGORIES = new Set<CategorySlug>(["guides", "projects", "faq"]);
const ALLOWED_REMOTE_TITLES = new Set(["Playbook"]);
const BLOCKED_REMOTE_TITLE_PARTS = ["onboarding"];
const BLOCKED_ONBOARDING_QA_PATTERN = /\bs\d+-\d{3}\b/i;

export type RemoteWikiPageRecord = {
  category: CategorySlug;
  slug: string;
  page: RawConfluencePage;
};

export type PolicyDocument = {
  id: string;
  version: number;
  title: string;
  summary: string;
  contentText: string;
  sourceUrl?: string;
  cacheKey: string;
  sourceKind: "policy" | "ops";
};

export type WikiDataSourceMode = "snapshot" | "remote";

export type SnapshotWikiDataSource = {
  mode?: "snapshot";
};

export type RemoteWikiDataSource = {
  mode: "remote";
  endpoint: string;
  fetch?: typeof fetch;
};

export type WikiDataSourceOptions = SnapshotWikiDataSource | RemoteWikiDataSource;

export async function loadWikiDocuments(
  options: WikiDataSourceOptions = {},
): Promise<WikiDocument[]> {
  if (options.mode !== "remote") {
    return buildSnapshotWikiDocuments();
  }

  const response = await (options.fetch ?? fetch)(options.endpoint, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load wiki documents from ${options.endpoint}`);
  }

  const payload = await response.json();
  return buildWikiDocumentsFromPayload(payload);
}

export function buildWikiDocumentsFromPayload(
  payload: unknown,
) {
  const records = parseRemoteWikiPageRecords(payload);

  return buildWikiDocumentsFromRecords(records);
}

export function buildWikiDocumentsFromRecords(records: RemoteWikiPageRecord[]) {
  return records.map((record) =>
    normalizeConfluencePage(record.page, record.category, record.slug),
  );
}

export function buildPolicyDocumentsFromRecords(
  records: RemoteWikiPageRecord[],
  sourceKind: PolicyDocument["sourceKind"],
) {
  return records.map((record) => buildPolicyDocumentFromRecord(record, sourceKind));
}

export function parseRemoteWikiPageRecords(payload: unknown): RemoteWikiPageRecord[] {
  const records = readRecordArray(payload);
  const validRecords = records
    .map((record, index) => parseRemoteWikiPageRecord(record, index))
    .filter((record) => record.page.status === "current")
    .filter((record) => record.page.metadata.visibility === "public")
    .filter((record) => record.page.metadata.status === "published")
    .filter((record) => record.page.metadata.docType !== "ops")
    .filter((record) => record.page.metadata.docType !== "policy")
    .filter(isAllowedRemotePage);

  return validRecords;
}

export function parseRemotePolicyPageRecords(payload: unknown): RemoteWikiPageRecord[] {
  const records = readRecordArray(payload);

  return records
    .map((record, index) => parseRemoteWikiPageRecord(record, index))
    .filter((record) => record.page.status === "current")
    .filter((record) => record.page.metadata.status === "published")
    .filter((record) => record.page.metadata.docType === "policy");
}

export function parseRemoteOpsPageRecords(payload: unknown): RemoteWikiPageRecord[] {
  const records = readRecordArray(payload);

  return records
    .map((record, index) => parseRemoteWikiPageRecord(record, index))
    .filter((record) => record.page.status === "current")
    .filter((record) => record.page.metadata.status === "published")
    .filter((record) => record.page.metadata.docType === "ops");
}

function isAllowedRemotePage(record: RemoteWikiPageRecord) {
  if (isBlockedRemotePage(record)) {
    return false;
  }

  return ALLOWED_REMOTE_CATEGORIES.has(record.category) ||
    ALLOWED_REMOTE_TITLES.has(record.page.title);
}

function isBlockedRemotePage(record: RemoteWikiPageRecord) {
  const searchableTitle = `${record.slug} ${record.page.title}`.toLocaleLowerCase("ko-KR");

  return BLOCKED_REMOTE_TITLE_PARTS.some((part) => searchableTitle.includes(part)) ||
    BLOCKED_ONBOARDING_QA_PATTERN.test(searchableTitle);
}

function buildPolicyDocumentFromRecord(
  record: RemoteWikiPageRecord,
  sourceKind: PolicyDocument["sourceKind"],
): PolicyDocument {
  const contentText = htmlToPlainText(record.page.bodyHtml).replace(/\s+/g, " ").trim();
  const summary = summarizePolicyText(contentText);

  return {
    id: record.page.id,
    version: record.page.version,
    title: record.page.title,
    summary,
    contentText: contentText.slice(0, 4000),
    sourceUrl: record.page.sourceUrl,
    cacheKey: `${record.page.id}:${record.page.version}:${sourceKind}`,
    sourceKind,
  };
}

function summarizePolicyText(contentText: string) {
  const compact = contentText.replace(/\s+/g, " ").trim();

  if (!compact) {
    return "";
  }

  const firstSentence = compact.split(/(?<=[.!?。！？])\s+/)[0]?.trim() ?? compact;
  return firstSentence.slice(0, 240);
}

function readRecordArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (isRecord(payload) && Array.isArray(payload.pages)) {
    return payload.pages;
  }

  throw new Error("Remote wiki source payload must be an array or an object with pages.");
}

function parseRemoteWikiPageRecord(record: unknown, index: number): RemoteWikiPageRecord {
  if (!isRecord(record)) {
    throw new Error(`Remote wiki record at index ${index} must be an object.`);
  }

  const category = readCategory(record.category, index);
  const slug = readString(record.slug, `records[${index}].slug`);
  const page = readRawConfluencePage(record.page, index);

  if (page.spaceId !== PUBLIC_WIKI_SPACE_ID) {
    throw new Error(`Remote wiki record at index ${index} is outside the public wiki space.`);
  }

  return {
    category,
    slug,
    page,
  };
}

function readRawConfluencePage(page: unknown, index: number): RawConfluencePage {
  if (!isRecord(page)) {
    throw new Error(`records[${index}].page must be an object.`);
  }

  const metadata = readMetadata(page.metadata, index);

  return {
    id: readString(page.id, `records[${index}].page.id`),
    parentId: readOptionalNonEmptyString(page.parentId, `records[${index}].page.parentId`),
    title: readString(page.title, `records[${index}].page.title`),
    spaceId: readString(page.spaceId, `records[${index}].page.spaceId`),
    status: readString(page.status, `records[${index}].page.status`),
    version: readNumber(page.version, `records[${index}].page.version`),
    bodyHtml: readOptionalString(page.bodyHtml, `records[${index}].page.bodyHtml`),
    sourceUrl: readString(page.sourceUrl, `records[${index}].page.sourceUrl`),
    metadata,
    updatedAt: readString(page.updatedAt, `records[${index}].page.updatedAt`),
  };
}

function readMetadata(metadata: unknown, index: number): RawConfluencePage["metadata"] {
  if (!isRecord(metadata)) {
    throw new Error(`records[${index}].page.metadata must be an object.`);
  }

  return {
    docType: readDocType(metadata.docType, index),
    visibility: readVisibility(metadata.visibility, index),
    audience: readAudience(metadata.audience, index),
    status: readMetadataStatus(metadata.status, index),
    prerequisites: readStringArray(metadata.prerequisites, `records[${index}].page.metadata.prerequisites`),
    next: readStringArray(metadata.next, `records[${index}].page.metadata.next`),
    related: readStringArray(metadata.related, `records[${index}].page.metadata.related`),
  };
}

function readCategory(value: unknown, index: number): CategorySlug {
  if (value === "guides" || value === "projects" || value === "library" || value === "faq") {
    return value;
  }

  throw new Error(`records[${index}].category must be a known wiki category.`);
}

function readDocType(value: unknown, index: number): RawConfluencePage["metadata"]["docType"] {
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

  throw new Error(`records[${index}].page.metadata.docType must be a known document type.`);
}

function readVisibility(value: unknown, index: number): RawConfluencePage["metadata"]["visibility"] {
  if (value === "public" || value === "internal") {
    return value;
  }

  throw new Error(`records[${index}].page.metadata.visibility must be public or internal.`);
}

function readAudience(value: unknown, index: number): RawConfluencePage["metadata"]["audience"] {
  if (value === "beginner" || value === "intermediate" || value === "advanced") {
    return value;
  }

  throw new Error(`records[${index}].page.metadata.audience must be a known audience.`);
}

function readMetadataStatus(value: unknown, index: number): RawConfluencePage["metadata"]["status"] {
  if (value === "draft" || value === "reviewed" || value === "published") {
    return value;
  }

  throw new Error(`records[${index}].page.metadata.status must be a known metadata status.`);
}

function readString(value: unknown, fieldName: string) {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  throw new Error(`${fieldName} must be a non-empty string.`);
}

function readOptionalString(value: unknown, fieldName: string) {
  if (typeof value === "string") {
    return value;
  }

  throw new Error(`${fieldName} must be a string.`);
}

function readOptionalNonEmptyString(value: unknown, fieldName: string) {
  if (typeof value === "undefined") {
    return undefined;
  }

  return readString(value, fieldName);
}

function readNumber(value: unknown, fieldName: string) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  throw new Error(`${fieldName} must be a finite number.`);
}

function readStringArray(value: unknown, fieldName: string) {
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value;
  }

  throw new Error(`${fieldName} must be an array of strings.`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
