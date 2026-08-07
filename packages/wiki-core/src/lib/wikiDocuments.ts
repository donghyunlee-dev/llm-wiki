import { buildSnapshotWikiDocuments } from "./confluenceSnapshots";
import { classifyQuestionIntent, extractQuestionSubjects } from "./intentClassifier";
import type { LessonPresentationDocument } from "./lessonSemanticBlocks";

export type WikiSection = "guides" | "faq" | "library";

export type WikiDocument = {
  id: string;
  parentId?: string;
  slug: string;
  title: string;
  summary: string;
  updatedAt: string;
  sourceUrl?: string;
  metadata: {
    docType: "guide" | "page" | "faq" | "library" | "policy" | "nav" | "ops" | "playbook" | "lesson";
    audience: "beginner" | "intermediate" | "advanced";
    status: "published";
    prerequisites: string[];
    next: string[];
    related: string[];
    // lesson docType 전용, 평탄화된 필드(Course Manifest) — 다른 docType은 항상 undefined.
    courseId?: string;
    order?: number;
    chapter?: string;
    estimatedMinutes?: number;
    learningObjectives?: string[];
    lastReviewedAt?: string;
  };
  // 별도 Confluence Content Property(`lesson.presentation`)의 값 — lesson docType 전용.
  presentation?: LessonPresentationDocument;
  headings: Array<{
    id: string;
    level: number;
    text: string;
  }>;
  contentHtml: string;
};

export type SearchGroups = Record<WikiSection, WikiDocument[]>;

export function getWikiDocumentSection(document: WikiDocument): WikiSection | null {
  const dt = document.metadata.docType;
  if (dt === "guide" || dt === "page") return "guides";
  if (dt === "faq") return "faq";
  if (dt === "library") return "library";
  return null;
}

export function getWikiDocumentHref(document: WikiDocument): string | null {
  const section = getWikiDocumentSection(document);
  return section ? `/${section}/${document.slug}` : null;
}

/**
 * Strips a leading "[Type]" bracket prefix (e.g. "[Guide]", "[FAQ]") from a document title.
 * Confluence authors use this prefix for editorial sorting, but the UI already shows the
 * document type separately (docType badge/eyebrow), so displaying it a second time in the
 * title reads as a duplicate.
 */
export function stripTitleTypePrefix(title: string): string {
  return title.replace(/^\[[^\]]+\]\s*/, "");
}

type RankedSearchDocument = {
  document: WikiDocument;
  score: number;
};

export type SearchQuestionMode =
  | "concept"
  | "setup"
  | "troubleshooting"
  | "comparison"
  | "planning"
  | "general";

export type SearchQuestionProfile = {
  mode: SearchQuestionMode;
  normalizedQuestion: string;
  tokens: string[];
};

const GENERIC_SEARCH_TOKENS = new Set([
  "설명",
  "설명해",
  "설명하",
  "설명하세요",
  "설명해줘",
  "알려",
  "알려줘",
  "알려주세",
  "말해",
  "말해줘",
  "대해",
  "관련",
  "관해",
  "뭐",
  "뭐야",
  "뭐지",
  "무엇",
  "무엇인지",
  "주세요",
]);

const WIKI_DOCUMENTS: WikiDocument[] = buildSnapshotWikiDocuments();

export function listWikiDocumentsFrom(documents: WikiDocument[]) {
  return [...documents];
}

export function listWikiDocumentsBySectionFrom(
  documents: WikiDocument[],
  section: WikiSection,
) {
  return documents.filter((document) => getWikiDocumentSection(document) === section);
}

export function getWikiDocumentFrom(
  documents: WikiDocument[],
  section: WikiSection,
  slug: string,
) {
  return documents.find(
    (document) => getWikiDocumentSection(document) === section && document.slug === slug,
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

export function listWikiDocumentsBySection(section: WikiSection) {
  return listWikiDocumentsBySectionFrom(WIKI_DOCUMENTS, section);
}

export function getWikiDocument(section: WikiSection, slug: string) {
  return getWikiDocumentFrom(WIKI_DOCUMENTS, section, slug);
}

export function getWikiDocumentById(id: string) {
  return getWikiDocumentByIdFrom(WIKI_DOCUMENTS, id);
}

export function searchWikiDocumentsIn(documents: WikiDocument[], query: string): SearchGroups {
  const emptyGroups: SearchGroups = {
    guides: [],
    faq: [],
    library: [],
  };

  const rankedDocuments = rankSearchDocumentsIn(documents, query);

  if (!rankedDocuments.length) {
    return emptyGroups;
  }

  for (const { document } of rankedDocuments) {
    const section = getWikiDocumentSection(document);
    if (section) {
      emptyGroups[section].push(document);
    }
  }

  return emptyGroups;
}

function rankSearchDocumentsIn(documents: WikiDocument[], query: string): RankedSearchDocument[] {
  const profile = inferSearchQuestionProfile(query);

  if (!profile.normalizedQuestion) {
    return [];
  }

  return documents
    .filter(
      (document) =>
        document.metadata.docType !== "ops" &&
        document.metadata.docType !== "policy" &&
        document.metadata.docType !== "playbook" &&
        document.metadata.docType !== "lesson",
    )
    .map((document) => ({
      document,
      score: scoreDocumentForSearch(document, profile),
    }))
    .filter((item) => item.score > 0)
    .sort((first, second) => second.score - first.score);
}

function scoreDocumentForSearch(
  document: WikiDocument,
  profile: SearchQuestionProfile,
) {
  const normalizedQuery = profile.normalizedQuestion;
  const tokens = profile.tokens;
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
  const signals = detectDocumentSignals({
    title,
    summary,
    headings,
    body,
    slug,
    docType,
  });
  const scope = detectDocumentScope({
    title,
    summary,
    headings,
    body,
    slug,
    docType,
  });
  const docTypeAffinity = getSearchDocTypeAffinity(profile.mode, docType, signals, scope);

  if (haystack.includes(normalizedQuery)) {
    return 120 + getSearchModeAffinity(profile.mode, signals, scope) + getSearchScopeAffinity(profile.mode, scope) + docTypeAffinity;
  }

  const tokenMatches = tokens.map((token) => {
    const variants = expandSearchTokenVariants(token);

    return {
      title: variants.some((variant) => title.includes(variant)),
      summary: variants.some((variant) => summary.includes(variant)),
      headings: variants.some((variant) => headings.includes(variant)),
      body: variants.some((variant) => body.includes(variant)),
      slug: variants.some((variant) => slug.includes(variant)),
      docType: variants.some((variant) => docType.includes(variant)),
    };
  });
  const tokenScore = tokenMatches.reduce((score, match) => {
    if (match.title) {
      return score + 12;
    }

    if (match.summary) {
      return score + 8;
    }

    if (match.headings) {
      return score + 6;
    }

    if (match.body) {
      return score + 3;
    }

    if (match.slug) {
      return score + 2;
    }

    if (match.docType) {
      return score + 1;
    }

    return score;
  }, 0);

  if (tokenScore === 0) {
    return 0;
  }

  let score = tokenScore + getSearchModeAffinity(profile.mode, signals, scope) + getSearchScopeAffinity(profile.mode, scope) + docTypeAffinity;
  const matchedTokenCount = tokenMatches.filter((match) =>
    match.title || match.summary || match.headings || match.body || match.slug || match.docType
  ).length;
  const titleMatchedCount = tokenMatches.filter((match) => match.title || match.slug).length;
  const strongFieldMatchedCount = tokenMatches.filter((match) =>
    match.title || match.summary || match.headings || match.slug
  ).length;

  if (matchedTokenCount >= 2) {
    score += matchedTokenCount * 8;
  }

  if (strongFieldMatchedCount >= 2) {
    score += strongFieldMatchedCount * 4;
  }

  if (titleMatchedCount >= 2) {
    score += 28;
  }

  if (profile.mode === "concept" && docType === "page" && titleMatchedCount >= 2) {
    score += 18;
  }

  if (document.parentId) {
    score += profile.mode === "planning" ? 3 : 1;
  }

  if (document.headings.length) {
    score += 1;
  }

  if (emailIntent) {
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

    score += serviceBoost + supportBoost;
  }

  return score;
}

export function inferSearchQuestionProfile(question: string): SearchQuestionProfile {
  const normalizedQuestion = normalizeSearchText(question);
  const tokens = tokenizeSearchTokens(question);

  return {
    mode: inferSearchQuestionMode(normalizedQuestion),
    normalizedQuestion,
    tokens,
  };
}

function inferSearchQuestionMode(normalizedQuestion: string): SearchQuestionMode {
  const intent = classifyQuestionIntent(normalizedQuestion);

  switch (intent) {
    case "concept": return "concept";
    case "setup": return "setup";
    case "troubleshooting": return "troubleshooting";
    case "comparison": return "comparison";
    case "broad-planning": return "planning";
    default: return "general";
  }
}

function detectDocumentSignals(fields: {
  title: string;
  summary: string;
  headings: string;
  body: string;
  slug: string;
  docType: string;
}) {
  const haystack = [
    fields.title,
    fields.summary,
    fields.headings,
    fields.body,
    fields.slug,
    fields.docType,
  ].join(" ");

  return {
    concept: /(?:목적|개요|정의|설명|무엇인가|무엇인지|란 무엇|종합 가이드|먼저 무엇을 연결해야 하나)/.test(haystack),
    setup: /(?:설치|설정|연결|구성|세팅|install|setup|connect|enable|configure|login|명령|command)/.test(haystack),
    troubleshooting: /(?:오류|문제|해결|troubleshoot|failed|fail|안 되|안되|에러)/.test(haystack),
    comparison: /(?:비교|차이|vs|대신|선택|고를|추천)/.test(haystack),
    planning: /(?:준비|순서|체크리스트|먼저|권장|시작하기 전에|무엇부터|흐름|운영|배포)/.test(haystack),
  };
}

function detectDocumentScope(fields: {
  title: string;
  summary: string;
  headings: string;
  body: string;
  slug: string;
  docType: string;
}) {
  const haystack = [
    fields.title,
    fields.summary,
    fields.headings,
    fields.body,
    fields.slug,
    fields.docType,
  ].join(" ");

  const specificTerms = [
    "filesystem",
    "browser",
    "playwright",
    "desktop control",
    "agent browser",
    "jira",
    "claude",
    "codex",
    "gmail",
    "microsoft 365",
    "outlook",
    "gemini",
    "cursor",
    "cline",
  ];

  const broadTerms = [
    "종합 가이드",
    "목적",
    "개요",
    "정의",
    "설명",
    "무엇인가",
    "mcp 설정하기",
    "mcp란 무엇인가",
  ];

  return {
    specific: specificTerms.some((term) => haystack.includes(term)),
    broad: broadTerms.some((term) => haystack.includes(term)),
  };
}

function getSearchScopeAffinity(
  mode: SearchQuestionMode,
  scope: ReturnType<typeof detectDocumentScope>,
) {
  switch (mode) {
    case "concept":
      return (scope.broad ? 20 : 0) - (scope.specific ? 16 : 0);
    case "setup":
      return (scope.specific ? 12 : 0) + (scope.broad ? 4 : 0);
    case "troubleshooting":
      return (scope.specific ? 10 : 0);
    case "comparison":
      return (scope.broad ? 8 : 0);
    case "planning":
      return (scope.broad ? 14 : 0) - (scope.specific ? 4 : 0);
    default:
      return (scope.broad ? 4 : 0) - (scope.specific ? 2 : 0);
  }
}

function getSearchModeAffinity(
  mode: SearchQuestionMode,
  signals: ReturnType<typeof detectDocumentSignals>,
  scope: ReturnType<typeof detectDocumentScope>,
) {
  switch (mode) {
    case "concept":
      return (signals.concept ? 52 : 0) + (signals.planning ? 8 : 0) - ((signals.setup && scope.specific) ? 12 : 0) - (signals.troubleshooting ? 8 : 0);
    case "setup":
      return (signals.setup ? 36 : 0) + (signals.concept ? 4 : 0) + (signals.troubleshooting ? 8 : 0) - (signals.comparison ? 2 : 0);
    case "troubleshooting":
      return (signals.troubleshooting ? 42 : 0) + (signals.setup ? 8 : 0) - (signals.concept ? 8 : 0);
    case "comparison":
      return (signals.comparison ? 36 : 0) + (signals.concept ? 4 : 0);
    case "planning":
      return (signals.planning ? 38 : 0) + (signals.concept ? 8 : 0) + (signals.setup ? 4 : 0);
    default:
      return (signals.concept ? 10 : 0) + (signals.setup ? 10 : 0) + (signals.troubleshooting ? 10 : 0) + (signals.comparison ? 10 : 0) + (signals.planning ? 10 : 0);
  }
}

function getSearchDocTypeAffinity(
  mode: SearchQuestionMode,
  docType: string,
  signals: ReturnType<typeof detectDocumentSignals>,
  scope: ReturnType<typeof detectDocumentScope>,
) {
  if (docType === "nav") return 0;
  if (docType === "policy") return -10;
  if (docType === "ops" || docType === "playbook") return -20;

  const isGuide = docType === "guide";
  const isPage = docType === "page";
  const isFaq = docType === "faq";
  const isLibrary = docType === "library";

  switch (mode) {
    case "concept":
      if (isGuide) return signals.concept || scope.broad ? 20 : 10;
      if (isPage) return signals.setup && scope.specific ? -8 : 0;
      if (isFaq) return -8;
      if (isLibrary) return 4;
      return 0;
    case "setup":
      if (isPage) {
        if (signals.troubleshooting) return 8;
        return signals.setup || scope.specific ? 18 : 6;
      }
      if (isGuide) return scope.broad ? 8 : 4;
      if (isFaq) return signals.troubleshooting ? 12 : 4;
      if (isLibrary) return signals.setup ? 4 : 0;
      return 0;
    case "troubleshooting":
      if (isFaq) return signals.troubleshooting || scope.specific ? 20 : 10;
      if (isPage) return signals.troubleshooting ? 8 : 4;
      if (isGuide) return -4;
      return 0;
    case "comparison":
      if (isGuide) return signals.comparison ? 10 : 4;
      if (isLibrary) return signals.comparison ? 8 : 4;
      if (isPage) return signals.comparison ? 4 : 0;
      return 0;
    case "planning":
      if (isGuide || isPage) return signals.planning || scope.broad ? 18 : 8;
      if (isLibrary) return signals.planning ? 8 : 4;
      return 0;
    default:
      if (isGuide) return scope.broad ? 6 : 3;
      if (isPage) return scope.specific ? 4 : 2;
      if (isFaq) return scope.specific ? 3 : 1;
      if (isLibrary) return scope.specific ? 3 : 1;
      return 0;
  }
}

function tokenizeSearchTokens(query: string) {
  return query
    .toLocaleLowerCase("ko-KR")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((token) => normalizeSearchToken(token))
    .flatMap((token) => expandSearchTokenVariants(token))
    .filter((token) => token.length >= 2)
    .filter((token) => !isGenericSearchToken(token));
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
    for (const stem of deriveEnglishTokenStems(normalized)) {
      variants.add(stem);
    }
  }

  return [...variants].filter(Boolean);
}

function deriveEnglishTokenStems(token: string) {
  const stems = new Set<string>();

  if (!/^[a-z][a-z0-9-]{2,}$/i.test(token)) {
    return stems;
  }

  if (!token.endsWith("s")) {
    stems.add(`${token}s`);
    return stems;
  }

  if (token.length > 4 && !token.endsWith("ss")) {
    stems.add(token.slice(0, -1));
  }

  if (token.endsWith("ies") && token.length > 4) {
    stems.add(`${token.slice(0, -3)}y`);
  }

  return stems;
}

function isGenericSearchToken(token: string) {
  return GENERIC_SEARCH_TOKENS.has(token) ||
    /(설명|알려|말해)(하|해|줘|주세요)?/.test(token) ||
    /(무엇|뭐)(인가|인지|야|지)?/.test(token);
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

export function buildFallbackSearchQuery(question: string) {
  const subjects = extractQuestionSubjects(question);
  const tokens = tokenizeSearchTokens(question);
  const orderedTokens = [...subjects, ...tokens];
  const unique = Array.from(new Set(orderedTokens.filter(Boolean)));
  return unique.join(" ").trim();
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
  const rankedIds = new Set([...scopedMatches, ...globalMatches].map((d) => d.id));
  const indexLinkedExtras = expandedDocuments.filter(
    (d) => !rankedIds.has(d.id) && matchedIndexes.some((idx) => d.parentId === idx.id),
  );

  return uniqueDocuments([...scopedMatches, ...globalMatches, ...indexLinkedExtras]).slice(0, limit);
}

export function expandSearchContextDocuments(
  documents: WikiDocument[],
  seedDocuments: WikiDocument[],
  limit = 12,
) {
  const resolvedDocuments: WikiDocument[] = [];
  const seenIds = new Set<string>();
  const seedIds = new Set(seedDocuments.map((document) => document.id));

  const addDocument = (document: WikiDocument | undefined) => {
    if (!document || seenIds.has(document.id)) {
      return;
    }

    seenIds.add(document.id);
    resolvedDocuments.push(document);
  };

  for (const document of seedDocuments) {
    addDocument(document);
  }

  for (const seed of seedDocuments) {
    addDocument(getParentWikiDocumentFrom(documents, seed));

    for (const linkedDocument of resolveWikiDocumentsByIdsFrom(documents, [
      ...seed.metadata.prerequisites,
      ...seed.metadata.next,
      ...seed.metadata.related,
    ])) {
      addDocument(linkedDocument);
    }
  }

  for (const candidate of documents) {
    if (seedIds.has(candidate.id)) {
      continue;
    }

    if (candidate.parentId && seedIds.has(candidate.parentId)) {
      addDocument(candidate);
      continue;
    }

    const linksToSeed = [
      ...candidate.metadata.prerequisites,
      ...candidate.metadata.next,
      ...candidate.metadata.related,
    ].some((id) => seedIds.has(id));

    if (linksToSeed) {
      addDocument(candidate);
    }
  }

  return resolvedDocuments.slice(0, limit);
}

export function isIndexWikiDocument(document: WikiDocument) {
  return document.metadata.docType === "nav";
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
