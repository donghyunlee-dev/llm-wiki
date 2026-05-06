import { buildSnapshotWikiDocuments } from "./confluenceSnapshots";

export type CategorySlug = "guides" | "projects" | "library" | "faq";

export type WikiDocument = {
  id: string;
  parentId?: string;
  slug: string;
  category: CategorySlug;
  title: string;
  summary: string;
  updatedAt: string;
  sourceUrl?: string;
  metadata: {
    docType:
      | "overview"
      | "concept"
      | "tutorial"
      | "howto"
      | "reference"
      | "troubleshooting"
      | "example";
    visibility: "public";
    audience: "beginner" | "intermediate" | "advanced";
    status: "published";
    prerequisites: string[];
    next: string[];
    related: string[];
  };
  headings: Array<{
    id: string;
    level: number;
    text: string;
  }>;
  contentHtml: string;
};

export type SearchGroups = Record<CategorySlug, WikiDocument[]>;

type RankedSearchDocument = {
  document: WikiDocument;
  score: number;
};

const WIKI_DOCUMENTS: WikiDocument[] = buildSnapshotWikiDocuments();

export function listWikiDocumentsFrom(documents: WikiDocument[]) {
  return [...documents];
}

export function listWikiDocumentsByCategoryFrom(
  documents: WikiDocument[],
  category: CategorySlug,
) {
  return documents.filter((document) => document.category === category);
}

export function getWikiDocumentFrom(
  documents: WikiDocument[],
  category: CategorySlug,
  slug: string,
) {
  return documents.find(
    (document) => document.category === category && document.slug === slug,
  );
}

export function getWikiDocumentByIdFrom(documents: WikiDocument[], id: string) {
  return documents.find((document) => document.id === id);
}

export function getParentWikiDocumentFrom(documents: WikiDocument[], document: WikiDocument) {
  return document.parentId ? getWikiDocumentByIdFrom(documents, document.parentId) : undefined;
}

export function validateWikiGraphReferencesFrom(documents: WikiDocument[]) {
  const ids = new Set(documents.map((document) => document.id));

  return documents.flatMap((document) => {
    const referencedIds = [
      document.parentId,
      ...document.metadata.prerequisites,
      ...document.metadata.next,
      ...document.metadata.related,
    ].filter((id): id is string => Boolean(id));

    return referencedIds
      .filter((id) => !ids.has(id))
      .map((id) => ({
        documentId: document.id,
        missingId: id,
      }));
  });
}

export function resolveWikiDocumentsByIdsFrom(
  documents: WikiDocument[],
  ids: string[],
) {
  return ids
    .map((id) => getWikiDocumentByIdFrom(documents, id))
    .filter((document): document is WikiDocument => Boolean(document));
}

export function listWikiDocuments() {
  return listWikiDocumentsFrom(WIKI_DOCUMENTS);
}

export function listWikiDocumentsByCategory(category: CategorySlug) {
  return listWikiDocumentsByCategoryFrom(WIKI_DOCUMENTS, category);
}

export function getWikiDocument(category: CategorySlug, slug: string) {
  return getWikiDocumentFrom(WIKI_DOCUMENTS, category, slug);
}

export function getWikiDocumentById(id: string) {
  return getWikiDocumentByIdFrom(WIKI_DOCUMENTS, id);
}

export function searchWikiDocumentsIn(documents: WikiDocument[], query: string): SearchGroups {
  const emptyGroups: SearchGroups = {
    guides: [],
    projects: [],
    library: [],
    faq: [],
  };

  const rankedDocuments = rankSearchDocumentsIn(documents, query);

  if (!rankedDocuments.length) {
    return emptyGroups;
  }

  for (const { document } of rankedDocuments) {
    emptyGroups[document.category].push(document);
  }

  return emptyGroups;
}

function rankSearchDocumentsIn(documents: WikiDocument[], query: string): RankedSearchDocument[] {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return [];
  }

  const tokens = tokenizeSearchTokens(query);

  return documents
    .map((document) => ({
      document,
      score: scoreDocumentForSearch(document, normalizedQuery, tokens),
    }))
    .filter((item) => item.score > 0)
    .sort((first, second) => second.score - first.score);
}

function scoreDocumentForSearch(
  document: WikiDocument,
  normalizedQuery: string,
  tokens: string[],
) {
  const title = document.title.toLocaleLowerCase("ko-KR");
  const summary = document.summary.toLocaleLowerCase("ko-KR");
  const headings = document.headings
    .map((heading) => heading.text)
    .join(" ")
    .toLocaleLowerCase("ko-KR");
  const body = stripHtml(document.contentHtml).toLocaleLowerCase("ko-KR");
  const slug = document.slug.toLocaleLowerCase("ko-KR");
  const docType = document.metadata.docType.toLocaleLowerCase("ko-KR");
  const haystack = [title, summary, headings, body, slug, docType].join(" ");
  const emailIntent = hasEmailSetupIntent(tokens);

  if (haystack.includes(normalizedQuery)) {
    return 100;
  }

  const tokenScore = tokens.reduce((score, token) => {
    const variants = expandSearchTokenVariants(token);

    if (variants.some((variant) => title.includes(variant))) {
      return score + 12;
    }

    if (variants.some((variant) => summary.includes(variant))) {
      return score + 8;
    }

    if (variants.some((variant) => headings.includes(variant))) {
      return score + 6;
    }

    if (variants.some((variant) => body.includes(variant))) {
      return score + 3;
    }

    if (variants.some((variant) => slug.includes(variant))) {
      return score + 2;
    }

    if (variants.some((variant) => docType.includes(variant))) {
      return score + 1;
    }

    return score;
  }, 0);

  if (!emailIntent) {
    return tokenScore;
  }

  const emailServiceTerms = [
    "gmail",
    "google workspace",
    "google mail",
    "outlook",
    "microsoft 365",
    "office 365",
    "m365",
    "ms365",
    "smtp",
  ];

  const emailSupportTerms = ["mail", "메일", "email", "e-mail"];

  const serviceBoost = emailServiceTerms.some((term) => haystack.includes(term)) ? 14 : 0;
  const supportBoost = emailSupportTerms.some((term) => haystack.includes(term)) ? 4 : 0;

  return tokenScore + serviceBoost + supportBoost;
}

function tokenizeSearchTokens(query: string) {
  return query
    .toLocaleLowerCase("ko-KR")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((token) => normalizeSearchToken(token))
    .flatMap((token) => expandSearchTokenVariants(token))
    .filter((token) => token.length >= 2);
}

function normalizeSearchText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("ko-KR")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSearchToken(token: string) {
  const trimmed = token.trim().toLocaleLowerCase("ko-KR");

  if (!trimmed) {
    return "";
  }

  return stripKoreanParticles(trimmed);
}

function expandSearchTokenVariants(token: string) {
  const normalized = normalizeSearchToken(token);

  if (!normalized) {
    return [];
  }

  const variants = new Set<string>([normalized]);
  const synonymGroups: string[][] = [
    ["mail", "메일", "email", "e-mail"],
    ["gmail", "gamil", "지메일", "gmail mail", "gmail 메일"],
    ["outlook", "아웃룩"],
    ["microsoft", "microsoft 365", "office 365", "m365", "ms365"],
    ["setup", "설정", "설정하기", "세팅", "구성"],
    ["configure", "설정", "구성"],
  ];

  for (const group of synonymGroups) {
    if (group.includes(normalized)) {
      for (const synonym of group) {
        variants.add(synonym.toLocaleLowerCase("ko-KR"));
      }
    }
  }

  if (/^[a-z0-9]+$/i.test(normalized)) {
    variants.add(normalized.replace(/-/g, ""));
  }

  return [...variants].filter(Boolean);
}

function hasEmailSetupIntent(tokens: string[]) {
  return tokens.some((token) => ["mail", "메일", "email", "e-mail", "gmail", "gamil", "outlook", "m365", "ms365"].includes(token));
}

function stripKoreanParticles(token: string) {
  const suffixes = [
    "으로부터",
    "으로서",
    "으로써",
    "으로",
    "로부터",
    "에서",
    "에게",
    "한테",
    "까지",
    "부터",
    "보다",
    "처럼",
    "만큼",
    "조차",
    "마저",
    "라도",
    "뿐",
    "만",
    "도",
    "는",
    "은",
    "을",
    "를",
    "이",
    "가",
    "와",
    "과",
    "의",
    "에",
    "로",
  ];

  let result = token;
  let changed = true;

  while (changed) {
    changed = false;

    for (const suffix of suffixes) {
      if (result.length > suffix.length && result.endsWith(suffix)) {
        result = result.slice(0, -suffix.length);
        changed = true;
        break;
      }
    }
  }

  return result;
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function getTopSearchWikiDocumentsIn(
  documents: WikiDocument[],
  query: string,
  limit = 5,
) {
  return rankSearchDocumentsIn(documents, query)
    .slice(0, limit)
    .map((item) => item.document);
}

export function getIndexFirstSearchWikiDocumentsIn(
  documents: WikiDocument[],
  query: string,
  limit = 5,
) {
  const indexDocuments = documents.filter(isIndexWikiDocument);
  const detailDocuments = documents.filter((document) => !isIndexWikiDocument(document));
  const matchedIndexes = getTopSearchWikiDocumentsIn(indexDocuments, query, 4);

  if (!matchedIndexes.length) {
    return getTopSearchWikiDocumentsIn(detailDocuments, query, limit);
  }

  const expandedDocuments = expandDetailDocumentsFromIndexes(detailDocuments, matchedIndexes);
  const scopedMatches = getTopSearchWikiDocumentsIn(expandedDocuments, query, limit);
  const globalMatches = getTopSearchWikiDocumentsIn(detailDocuments, query, limit);

  return uniqueDocuments([...scopedMatches, ...globalMatches]).slice(0, limit);
}

export function isIndexWikiDocument(document: WikiDocument) {
  const searchableText = `${document.slug} ${document.title}`.toLocaleLowerCase("ko-KR");

  return /\bindex\b/i.test(searchableText) || searchableText.includes("인덱스");
}

function expandDetailDocumentsFromIndexes(
  detailDocuments: WikiDocument[],
  indexDocuments: WikiDocument[],
) {
  const indexIds = new Set(indexDocuments.map((document) => document.id));
  const referencedIds = new Set(
    indexDocuments.flatMap((document) => [
      ...document.metadata.prerequisites,
      ...document.metadata.next,
      ...document.metadata.related,
    ]),
  );
  const scopeTokens = new Set(indexDocuments.flatMap(resolveIndexScopeTokens));

  return detailDocuments.filter((document) => {
    if (document.parentId && indexIds.has(document.parentId)) {
      return true;
    }

    if (referencedIds.has(document.id)) {
      return true;
    }

    if (
      document.metadata.prerequisites.some((id) => indexIds.has(id)) ||
      document.metadata.next.some((id) => indexIds.has(id)) ||
      document.metadata.related.some((id) => indexIds.has(id))
    ) {
      return true;
    }

    const documentText = `${document.slug} ${document.title}`.toLocaleLowerCase("ko-KR");

    return [...scopeTokens].some((token) => documentText.includes(token));
  });
}

function resolveIndexScopeTokens(document: WikiDocument) {
  const genericTokens = new Set([
    "index",
    "guide",
    "guides",
    "faq",
    "project",
    "projects",
    "blueprint",
    "playbook",
    "인덱스",
  ]);

  return `${document.slug} ${document.title}`
    .toLocaleLowerCase("ko-KR")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/[\s-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
    .filter((token) => !genericTokens.has(token));
}

function uniqueDocuments(documents: WikiDocument[]) {
  const seenIds = new Set<string>();

  return documents.filter((document) => {
    if (seenIds.has(document.id)) {
      return false;
    }

    seenIds.add(document.id);
    return true;
  });
}

export function searchWikiDocuments(query: string) {
  return searchWikiDocumentsIn(WIKI_DOCUMENTS, query);
}
