import fs from "node:fs";
import path from "node:path";

const TASK_DIR = path.dirname(new URL(import.meta.url).pathname);
const REPO_ROOT = path.resolve(TASK_DIR, "../../..");
const ENV_PATH = path.join(REPO_ROOT, "apps/web/.env.local");
const TARGETS_PATH = path.join(TASK_DIR, "targets.json");
const METADATA_KEY = "wiki.metadata";

function loadEnv(filePath) {
  const env = {};
  const content = fs.readFileSync(filePath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function requireEnv(env, key) {
  const value = env[key];

  if (!value) {
    throw new Error(`${key} is required in ${ENV_PATH}`);
  }

  return value;
}

function resolveSiteBaseUrl(siteName) {
  const trimmed = siteName.trim().replace(/\/+$/, "");

  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    return trimmed;
  }

  return `https://${trimmed}.atlassian.net`;
}

function createClient() {
  const env = loadEnv(ENV_PATH);
  const siteBaseUrl = resolveSiteBaseUrl(requireEnv(env, "ATLASSIAN_SITE_NAME"));
  const userEmail = requireEnv(env, "ATLASSIAN_USER_EMAIL");
  const apiToken = requireEnv(env, "ATLASSIAN_API_TOKEN");
  const spaceId = requireEnv(env, "CONFLUENCE_SPACE_ID");
  const authorization = Buffer.from(`${userEmail}:${apiToken}`, "utf8").toString("base64");

  async function request(pathOrUrl, options = {}) {
    const url = pathOrUrl.startsWith("http")
      ? pathOrUrl
      : `${siteBaseUrl}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${authorization}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Confluence ${options.method || "GET"} ${url} failed: ${response.status} ${text}`);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  return { request, siteBaseUrl, spaceId };
}

async function listPages(client) {
  const pages = [];
  let next =
    `/wiki/api/v2/pages?space-id=${encodeURIComponent(client.spaceId)}` +
    "&status=current&limit=100";

  while (next) {
    const response = await client.request(next);
    pages.push(...response.results);
    next = response._links?.next || "";
  }

  return pages.map((page) => ({
    id: page.id,
    title: page.title,
    status: page.status,
    spaceId: page.spaceId,
    parentId: page.parentId || "",
  }));
}

async function getMetadataProperty(client, pageId) {
  const response = await client.request(
    `/wiki/api/v2/pages/${encodeURIComponent(pageId)}/properties?key=${encodeURIComponent(METADATA_KEY)}`,
  );
  const property = response.results?.find((item) => item.key === METADATA_KEY);

  if (!property) {
    return null;
  }

  if (property.value) {
    return property;
  }

  return client.request(
    `/wiki/api/v2/pages/${encodeURIComponent(pageId)}/properties/${encodeURIComponent(property.id)}`,
  );
}

async function putMetadataProperty(client, pageId, metadata) {
  const existing = await getMetadataProperty(client, pageId);

  if (!existing) {
    const created = await client.request(
      `/wiki/api/v2/pages/${encodeURIComponent(pageId)}/properties`,
      {
        method: "POST",
        body: JSON.stringify({
          key: METADATA_KEY,
          value: metadata,
        }),
      },
    );

    return { action: "created", propertyId: created.id };
  }

  const nextVersion = Number(existing.version?.number || 1) + 1;
  const updated = await client.request(
    `/wiki/api/v2/pages/${encodeURIComponent(pageId)}/properties/${encodeURIComponent(existing.id)}`,
    {
      method: "PUT",
      body: JSON.stringify({
        key: METADATA_KEY,
        value: metadata,
        version: {
          number: nextVersion,
        },
      }),
    },
  );

  return { action: "updated", propertyId: updated.id, version: updated.version?.number };
}

function readTargets() {
  return JSON.parse(fs.readFileSync(TARGETS_PATH, "utf8"));
}

async function health() {
  const client = createClient();
  const space = await client.request(`/wiki/api/v2/spaces/${encodeURIComponent(client.spaceId)}`);
  console.log(JSON.stringify({
    id: space.id,
    key: space.key,
    name: space.name,
    status: space.status,
    homepageId: space.homepageId,
  }, null, 2));
}

async function inspect() {
  const client = createClient();
  const pages = await listPages(client);
  const rows = [];

  for (const page of pages) {
    const property = await getMetadataProperty(client, page.id);
    rows.push({
      ...page,
      hasMetadata: Boolean(property),
      metadata: property?.value
        ? {
            docType: property.value.docType,
            visibility: property.value.visibility,
            audience: property.value.audience,
            status: property.value.status,
          }
        : null,
    });
  }

  console.log(JSON.stringify(rows, null, 2));
}

async function summary() {
  const client = createClient();
  const pages = await listPages(client);
  const counts = {
    total: pages.length,
    withMetadata: 0,
    missingMetadata: 0,
    public: 0,
    internal: 0,
    ops: 0,
  };
  const missing = [];

  for (const page of pages) {
    const property = await getMetadataProperty(client, page.id);

    if (!property) {
      counts.missingMetadata += 1;
      missing.push({ pageId: page.id, title: page.title });
      continue;
    }

    counts.withMetadata += 1;

    if (property.value?.visibility === "public") {
      counts.public += 1;
    }

    if (property.value?.visibility === "internal") {
      counts.internal += 1;
    }

    if (property.value?.docType === "ops") {
      counts.ops += 1;
    }
  }

  console.log(JSON.stringify({ counts, missing }, null, 2));
}

async function applyTargets() {
  const client = createClient();
  const targets = readTargets();
  const pages = await listPages(client);
  const pagesById = new Map(pages.map((page) => [page.id, page]));
  const results = [];

  for (const target of targets) {
    const page = pagesById.get(target.pageId);

    if (!page) {
      throw new Error(`Target page not found in space ${client.spaceId}: ${target.pageId}`);
    }

    const result = await putMetadataProperty(client, target.pageId, target.metadata);
    results.push({
      pageId: target.pageId,
      title: page.title,
      ...result,
      metadata: {
        docType: target.metadata.docType,
        visibility: target.metadata.visibility,
        audience: target.metadata.audience,
        status: target.metadata.status,
      },
    });
  }

  console.log(JSON.stringify(results, null, 2));
}

function inferMetadata(page) {
  const title = page.title;

  if (title === "AI Agent Wiki" || title === "How to use Wiki") {
    return baseMetadata("overview", "beginner");
  }

  if (
    title === "Project" ||
    title === "Project Index" ||
    title === "Blueprint" ||
    title === "SfoodMall Goods Sync Service" ||
    title.startsWith("[Blueprint]")
  ) {
    return baseMetadata("example", "intermediate");
  }

  if (title === "FAQ" || title.startsWith("[FAQ]")) {
    return baseMetadata("troubleshooting", "beginner");
  }

  if (title === "Playbook" || title.startsWith("[Playbook]")) {
    return baseMetadata("troubleshooting", "intermediate");
  }

  if (title === "Guide" || title.startsWith("[Guide]")) {
    return baseMetadata(title.includes("Index") ? "overview" : "howto", "beginner");
  }

  if (title === "Onboarding" || title === "Onboarding INDEX") {
    return baseMetadata("tutorial", "beginner");
  }

  if (/^\d{2}\./.test(title)) {
    return baseMetadata("tutorial", "beginner");
  }

  if (/^\[(intro|level|s\d|terms)-/.test(title) || title.startsWith("[blueprint-ready]")) {
    if (title.includes("용어") || title.startsWith("[terms-")) {
      return baseMetadata("reference", "beginner");
    }

    if (title.includes("괜찮나요") || title.includes("믿어도") || title.includes("정확히")) {
      return baseMetadata("troubleshooting", "beginner");
    }

    return baseMetadata("concept", "beginner");
  }

  return null;
}

function inferAnyMetadata(page) {
  if (isExcludedPublicTarget(page)) {
    return inferInternalMetadata(page);
  }

  return inferMetadata(page) || inferInternalMetadata(page);
}

function inferInternalMetadata(page) {
  const title = page.title;

  if (title === "Ops" || title.startsWith("[Ops]")) {
    return {
      ...baseMetadata("ops", "advanced"),
      visibility: "internal",
      status: "reviewed",
    };
  }

  return {
    ...baseMetadata("reference", "intermediate"),
    visibility: "internal",
    status: "reviewed",
  };
}

function baseMetadata(docType, audience) {
  return {
    docType,
    visibility: "public",
    audience,
    status: "published",
    prerequisites: [],
    next: [],
    related: [],
  };
}

function isExcludedPublicTarget(page) {
  const title = page.title;
  const excludedPrefixes = [
    "[Ops]",
    "[PRD]",
    "[Analysis]",
    "[API Spec]",
    "[Data Model]",
    "[Architecture]",
    "[Migration]",
    "[Operations]",
  ];

  return (
    title === "Ops" ||
    title === "Development Prompt" ||
    title === "AI Wiki Portal Platform" ||
    title === "AI Wiki Portal Platform Overview" ||
    title.includes(" PRD") ||
    title.includes(" API Spec") ||
    title.includes(" Data Model") ||
    title.includes(" Architecture") ||
    excludedPrefixes.some((prefix) => title.startsWith(prefix))
  );
}

async function planCandidates() {
  const client = createClient();
  const pages = await listPages(client);
  const candidates = pages
    .filter((page) => !isExcludedPublicTarget(page))
    .map((page) => ({
      pageId: page.id,
      title: page.title,
      metadata: inferMetadata(page),
    }))
    .filter((candidate) => candidate.metadata);

  console.log(JSON.stringify(candidates, null, 2));
}

async function applyCandidates() {
  const client = createClient();
  const pages = await listPages(client);
  const candidates = pages
    .filter((page) => !isExcludedPublicTarget(page))
    .map((page) => ({
      pageId: page.id,
      title: page.title,
      metadata: inferMetadata(page),
    }))
    .filter((candidate) => candidate.metadata);
  const results = [];

  for (const candidate of candidates) {
    const result = await putMetadataProperty(client, candidate.pageId, candidate.metadata);
    results.push({
      pageId: candidate.pageId,
      title: candidate.title,
      ...result,
      metadata: {
        docType: candidate.metadata.docType,
        visibility: candidate.metadata.visibility,
        audience: candidate.metadata.audience,
        status: candidate.metadata.status,
      },
    });
  }

  console.log(JSON.stringify(results, null, 2));
}

async function applyAllMissing() {
  const client = createClient();
  const pages = await listPages(client);
  const results = [];

  for (const page of pages) {
    const existing = await getMetadataProperty(client, page.id);

    if (existing) {
      results.push({
        pageId: page.id,
        title: page.title,
        action: "skipped-existing",
        metadata: {
          docType: existing.value?.docType,
          visibility: existing.value?.visibility,
          audience: existing.value?.audience,
          status: existing.value?.status,
        },
      });
      continue;
    }

    const metadata = inferAnyMetadata(page);
    const result = await putMetadataProperty(client, page.id, metadata);
    results.push({
      pageId: page.id,
      title: page.title,
      ...result,
      metadata: {
        docType: metadata.docType,
        visibility: metadata.visibility,
        audience: metadata.audience,
        status: metadata.status,
      },
    });
  }

  console.log(JSON.stringify(results, null, 2));
}

async function reconcileAll() {
  const client = createClient();
  const pages = await listPages(client);
  const results = [];

  for (const page of pages) {
    const metadata = inferAnyMetadata(page);
    const result = await putMetadataProperty(client, page.id, metadata);
    results.push({
      pageId: page.id,
      title: page.title,
      ...result,
      metadata: {
        docType: metadata.docType,
        visibility: metadata.visibility,
        audience: metadata.audience,
        status: metadata.status,
      },
    });
  }

  console.log(JSON.stringify(results, null, 2));
}

const command = process.argv[2];

if (command === "health") {
  await health();
} else if (command === "inspect") {
  await inspect();
} else if (command === "summary") {
  await summary();
} else if (command === "apply-targets") {
  await applyTargets();
} else if (command === "plan-candidates") {
  await planCandidates();
} else if (command === "apply-candidates") {
  await applyCandidates();
} else if (command === "apply-all-missing") {
  await applyAllMissing();
} else if (command === "reconcile-all") {
  await reconcileAll();
} else {
  console.error(
    "Usage: node confluence-metadata.mjs <health|inspect|summary|plan-candidates|apply-candidates|apply-all-missing|reconcile-all|apply-targets>",
  );
  process.exit(1);
}
