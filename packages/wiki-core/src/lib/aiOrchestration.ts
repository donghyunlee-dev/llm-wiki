import { normalizePolicyNotice, normalizeAiSearchAnswerText, parseAiSearchResponseText } from "./aiSearchResponse";
import {
  aiAskJsonSchema,
  aiSearchJsonSchema,
  buildAiAskInput,
  buildAiAskPromptContext,
  buildAiSearchInput,
  buildAiSearchPromptContext,
  buildQueryUnderstandingInput,
  buildSearchFollowUpQuestion,
  queryUnderstandingJsonSchema,
  type ConversationHistoryTurn,
  type QueryUnderstanding,
} from "./aiAsk";
import { classifyQuestionIntent } from "./intentClassifier";
import { fetchConfluencePageRecords } from "./confluenceClient";
import {
  buildWikiDocumentsFromRecords,
  buildPolicyDocumentsFromRecords,
  parseRemotePolicyPageRecords,
  parseRemoteWikiPageRecords,
} from "./wikiDataSource";
import {
  buildFallbackSearchQuery,
  expandSearchContextDocuments,
  getIndexFirstSearchWikiDocumentsIn,
  getTopSearchWikiDocumentsIn,
  getParentWikiDocumentFrom,
  getWikiDocumentByIdFrom,
  getWikiDocumentHref,
  isIndexWikiDocument,
  resolveWikiDocumentsByIdsFrom,
  type WikiDocument,
} from "./wikiDocuments";
import { logSearchToPlaybook, type PlaybookSearchEntry } from "./playbookLogger";
import { isFullyUnsupportedSearchAnswerState, isNoPageStyleSearchAnswer } from "./searchAnswerState";
import {
  EMPTY_PROMPT_RULES,
  loadPromptRulesFromConfluence,
  type DynamicPromptRules,
} from "./promptRulesLoader";

const WIKI_CACHE_TTL_MS = 30 * 60 * 1000;
const AI_SEARCH_CACHE_TTL_MS = 30 * 60 * 1000;

export type OrchestrationEnv = {
  ATLASSIAN_SITE_NAME?: string;
  ATLASSIAN_USER_EMAIL?: string;
  ATLASSIAN_API_TOKEN?: string;
  CONFLUENCE_SPACE_ID?: string;
  CONFLUENCE_PLAYBOOK_PAGE_ID?: string;
  CONFLUENCE_PROMPT_RULES_PAGE_ID?: string;
  OPENAI_API_KEY?: string;
  VITE_OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  VITE_OPENAI_MODEL?: string;
};

export type OrchestrationResult = { status: number; body: unknown };

export function hasConfluenceConfig(env: OrchestrationEnv) {
  return Boolean(
    env.ATLASSIAN_SITE_NAME &&
      env.ATLASSIAN_USER_EMAIL &&
      env.ATLASSIAN_API_TOKEN &&
      env.CONFLUENCE_SPACE_ID,
  );
}

export function hasOpenAiConfig(env: OrchestrationEnv) {
  return Boolean(env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY);
}

type WikiCache = {
  expiresAt: number;
  records: ReturnType<typeof parseRemoteWikiPageRecords>;
  documents: WikiDocument[];
  policyDocuments: ReturnType<typeof buildPolicyDocumentsFromRecords>;
};

type AiSearchCacheEntry = {
  expiresAt: number;
  payload: unknown;
};

type PromptRulesCache = {
  expiresAt: number;
  rules: DynamicPromptRules;
};

let wikiCache: WikiCache | null = null;
let wikiCachePromise: Promise<WikiCache> | null = null;
const aiSearchCache = new Map<string, AiSearchCacheEntry>();
let promptRulesCache: PromptRulesCache | null = null;
let promptRulesCachePromise: Promise<PromptRulesCache> | null = null;

async function loadWikiCache(env: OrchestrationEnv) {
  const now = Date.now();

  // Fresh cache hit
  if (wikiCache && wikiCache.expiresAt > now) {
    return wikiCache;
  }

  // Stale-while-revalidate: return stale data immediately, refresh in background
  if (wikiCache && !wikiCachePromise) {
    wikiCachePromise = fetchAndBuildWikiCache(env).finally(() => {
      wikiCachePromise = null;
    });
    return wikiCache;
  }

  // Deduplicate concurrent cold-start fetches
  if (wikiCachePromise) {
    return wikiCachePromise;
  }

  // Cold start: wait for first load
  wikiCachePromise = fetchAndBuildWikiCache(env).finally(() => {
    wikiCachePromise = null;
  });

  wikiCache = await wikiCachePromise;
  return wikiCache;
}

async function fetchAndBuildWikiCache(env: OrchestrationEnv): Promise<WikiCache> {
  const pages = await fetchConfluencePageRecords({
    siteName: env.ATLASSIAN_SITE_NAME!,
    userEmail: env.ATLASSIAN_USER_EMAIL!,
    apiToken: env.ATLASSIAN_API_TOKEN!,
    spaceId: env.CONFLUENCE_SPACE_ID!,
  });
  const records = parseRemoteWikiPageRecords({ pages });
  const policyRecords = parseRemotePolicyPageRecords({ pages });

  const cache = {
    expiresAt: Date.now() + WIKI_CACHE_TTL_MS,
    records,
    documents: buildWikiDocumentsFromRecords(records),
    policyDocuments: buildPolicyDocumentsFromRecords(policyRecords, "policy"),
  };

  wikiCache = cache;
  return cache;
}

async function loadPromptRulesCache(env: OrchestrationEnv): Promise<PromptRulesCache> {
  const now = Date.now();

  if (promptRulesCache && promptRulesCache.expiresAt > now) {
    return promptRulesCache;
  }

  if (promptRulesCachePromise) {
    return promptRulesCachePromise;
  }

  promptRulesCachePromise = loadPromptRulesFromConfluence(
    {
      siteName: env.ATLASSIAN_SITE_NAME!,
      userEmail: env.ATLASSIAN_USER_EMAIL!,
      apiToken: env.ATLASSIAN_API_TOKEN!,
    },
    env.CONFLUENCE_PROMPT_RULES_PAGE_ID!,
  )
    .then((rules) => {
      promptRulesCache = { expiresAt: Date.now() + WIKI_CACHE_TTL_MS, rules };
      return promptRulesCache;
    })
    .catch((error) => {
      console.error("[promptRulesCache] Failed to load prompt rules from Confluence:", error);
      if (!promptRulesCache) {
        promptRulesCache = { expiresAt: Date.now() + WIKI_CACHE_TTL_MS, rules: EMPTY_PROMPT_RULES };
      }
      return promptRulesCache;
    })
    .finally(() => {
      promptRulesCachePromise = null;
    });

  return promptRulesCachePromise;
}

function readAiSearchCache(question: string) {
  const key = normalizeCacheKey(question);
  const cached = aiSearchCache.get(key);

  if (!cached || cached.expiresAt <= Date.now()) {
    aiSearchCache.delete(key);
    return null;
  }

  const normalizedPayload = normalizeAiSearchResponsePayload(cached.payload);
  aiSearchCache.set(key, {
    expiresAt: cached.expiresAt,
    payload: normalizedPayload,
  });

  return normalizedPayload;
}

function writeAiSearchCache(question: string, payload: unknown) {
  aiSearchCache.set(normalizeCacheKey(question), {
    expiresAt: Date.now() + AI_SEARCH_CACHE_TTL_MS,
    payload: normalizeAiSearchResponsePayload(payload),
  });
}

function normalizeCacheKey(value: string) {
  return value.trim().toLocaleLowerCase("ko-KR").replace(/\s+/g, " ");
}

function uniqueWikiDocuments(documents: WikiDocument[]) {
  const seen = new Set<string>();

  return documents.filter((document) => {
    if (seen.has(document.id)) {
      return false;
    }

    seen.add(document.id);
    return true;
  });
}

function parseConversationHistory(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const question = typeof (item as { question?: unknown }).question === "string"
        ? (item as { question: string }).question.trim()
        : "";
      const answer = typeof (item as { answer?: unknown }).answer === "string"
        ? (item as { answer: string }).answer.trim()
        : undefined;

      if (!question) {
        return null;
      }

      return { question, answer };
    })
    .filter((item): item is { question: string; answer: string | undefined } => Boolean(item));
}

function extractResponseText(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("output" in payload) || !Array.isArray(payload.output)) {
    throw new Error("OpenAI response did not include output.");
  }

  for (const item of payload.output) {
    if (!item || typeof item !== "object" || !("content" in item) || !Array.isArray(item.content)) {
      continue;
    }

    for (const content of item.content) {
      if (content && typeof content === "object" && "text" in content && typeof content.text === "string") {
        return content.text;
      }
    }
  }

  throw new Error("OpenAI response did not include output text.");
}

function parseAiSearchResult(payload: unknown) {
  const responseText = extractResponseText(payload);
  return parseAiSearchResponseText(responseText);
}

function normalizeAiSearchResponsePayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  const record = payload as Record<string, unknown>;
  const answer = typeof record.answer === "string" ? normalizeAiSearchAnswerText(record.answer) : record.answer;
  const policyNotice = normalizePolicyNotice(record.policyNotice);

  return {
    ...record,
    answer,
    policyNotice,
  };
}

async function fetchQueryUnderstanding(
  env: OrchestrationEnv,
  question: string,
  history: ConversationHistoryTurn[],
): Promise<QueryUnderstanding | null> {
  try {
    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.VITE_OPENAI_MODEL || env.OPENAI_MODEL || "gpt-5-mini",
        input: buildQueryUnderstandingInput(question, history),
        max_output_tokens: 400,
        reasoning: {
          effort: "low",
        },
        text: {
          format: {
            type: "json_schema",
            name: "query_understanding",
            strict: true,
            schema: queryUnderstandingJsonSchema(),
          },
        },
      }),
    });

    if (!aiResponse.ok) return null;

    const payload = await aiResponse.json();
    const text = extractResponseText(payload);
    const parsed = JSON.parse(text) as QueryUnderstanding;

    if (!parsed.intent || !Array.isArray(parsed.searchKeywords)) return null;

    return parsed;
  } catch {
    return null;
  }
}

function normalizeUnsupportedClaimsForSearchResult(
  result: {
    answer?: unknown;
    confluenceData?: unknown;
    unsupportedClaims?: unknown;
  },
) {
  const unsupportedClaims = Array.isArray(result.unsupportedClaims)
    ? result.unsupportedClaims.filter((claim): claim is string => typeof claim === "string" && claim.trim().length > 0)
    : [];

  if (unsupportedClaims.length > 0) {
    return unsupportedClaims;
  }

  if (isNoPageStyleSearchAnswer({ answer: typeof result.answer === "string" ? result.answer : "", confluenceData: Array.isArray(result.confluenceData) ? result.confluenceData as Array<{ pageId: string }> : [] })) {
    return ["검색 결과에 질문을 직접 뒷받침하는 공개 문서가 없습니다."];
  }

  return unsupportedClaims;
}

function enrichPolicyNoticeSources<T extends Record<string, unknown>>(
  payload: T,
  selectedPolicies: Array<{
    id: string;
    title: string;
    sourceUrl?: string;
  }>,
): T {
  const policyNotice = normalizePolicyNotice(payload.policyNotice);

  if (!policyNotice.isPolicyRelated) {
    return {
      ...payload,
      policyNotice,
    };
  }

  const sources = selectedPolicies
    .filter((policy) => policy.sourceUrl)
    .map((policy) => ({
      id: policy.id,
      title: policy.title,
      href: policy.sourceUrl as string,
    }))
    .slice(0, 4);

  return {
    ...payload,
    policyNotice: {
      ...policyNotice,
      sources,
    },
  };
}

function firePlaybookLog(
  env: OrchestrationEnv,
  question: string,
  persona: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const answer = typeof payload.answer === "string" ? payload.answer : "";
  const answerSummary = answer.slice(0, 200).replace(/\s+/g, " ").trim();

  const rawDocs = Array.isArray(payload.recommendedDocuments) ? payload.recommendedDocuments : [];
  const recommendedDocuments = rawDocs
    .filter((d): d is Record<string, unknown> => typeof d === "object" && d !== null)
    .map((d) => ({
      title: typeof d.title === "string" ? d.title : "",
      href: typeof d.href === "string" ? d.href : "",
    }));

  const unsupportedClaims = Array.isArray(payload.unsupportedClaims) ? payload.unsupportedClaims : [];
  const isSufficient = unsupportedClaims.length === 0 && recommendedDocuments.length >= 2;
  const sufficiency: PlaybookSearchEntry["sufficiency"] = isSufficient ? "충분" : "부족";

  const missingKeywords: string[] = isSufficient
    ? []
    : unsupportedClaims.filter((c): c is string => typeof c === "string").slice(0, 5);

  const entry: PlaybookSearchEntry = {
    timestamp: new Date(),
    question,
    persona,
    answerSummary,
    recommendedDocuments,
    sufficiency,
    missingKeywords,
  };

  return logSearchToPlaybook(
    {
      siteName: env.ATLASSIAN_SITE_NAME!,
      userEmail: env.ATLASSIAN_USER_EMAIL!,
      apiToken: env.ATLASSIAN_API_TOKEN!,
      spaceId: env.CONFLUENCE_SPACE_ID!,
      playbookPageId: env.CONFLUENCE_PLAYBOOK_PAGE_ID!,
    },
    entry,
  );
}

export async function handleAiAskRequest(
  env: OrchestrationEnv,
  input: { pageId: unknown; question: unknown; history: unknown },
): Promise<OrchestrationResult> {
  if (!hasConfluenceConfig(env)) {
    return { status: 503, body: { message: "Confluence environment is not configured.", code: "CONFLUENCE_UNAVAILABLE" } };
  }

  if (!hasOpenAiConfig(env)) {
    return { status: 503, body: { message: "OpenAI environment is not configured.", code: "AI_PROVIDER_UNAVAILABLE" } };
  }

  try {
    const pageId = typeof input.pageId === "string" ? input.pageId : "";
    const question = typeof input.question === "string" ? input.question.trim() : "";
    const history = parseConversationHistory(input.history);

    if (!pageId || !question) {
      return { status: 400, body: { message: "pageId and question are required.", code: "BAD_REQUEST" } };
    }

    const cache = await loadWikiCache(env);
    const documents = cache.documents;
    const document = getWikiDocumentByIdFrom(documents, pageId);

    if (!document) {
      return { status: 404, body: { message: "Page not found", code: "PAGE_NOT_FOUND" } };
    }

    const relatedDocuments = [
      getParentWikiDocumentFrom(documents, document),
      ...resolveWikiDocumentsByIdsFrom(documents, document.metadata.prerequisites),
      ...resolveWikiDocumentsByIdsFrom(documents, document.metadata.next),
      ...resolveWikiDocumentsByIdsFrom(documents, document.metadata.related),
    ].filter((item, index, array): item is NonNullable<typeof item> =>
      Boolean(item) &&
      !isIndexWikiDocument(item!) &&
      array.findIndex((candidate) => candidate?.id === item!.id) === index,
    );

    const promptContext = buildAiAskPromptContext(document, relatedDocuments, cache.policyDocuments, question, history);
    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.VITE_OPENAI_MODEL || env.OPENAI_MODEL || "gpt-5-mini",
        input: buildAiAskInput(promptContext),
        text: {
          format: {
            type: "json_schema",
            name: "wiki_ai_answer",
            strict: true,
            schema: aiAskJsonSchema(),
          },
        },
      }),
    });

    if (!aiResponse.ok) {
      return { status: 502, body: { message: "AI provider is unavailable.", code: "AI_PROVIDER_UNAVAILABLE" } };
    }

    const payload = await aiResponse.json();
    const resultText = extractResponseText(payload);
    const resultPayload = enrichPolicyNoticeSources(
      JSON.parse(resultText) as Record<string, unknown>,
      promptContext.policyContext.selectedPolicies,
    );

    return { status: 200, body: resultPayload };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to answer question.";
    return { status: 502, body: { message, code: "AI_PROVIDER_UNAVAILABLE" } };
  }
}

export async function handleAiSearchRequest(
  env: OrchestrationEnv,
  input: { question: unknown; persona: unknown; history: unknown },
): Promise<OrchestrationResult> {
  if (!hasConfluenceConfig(env)) {
    return { status: 503, body: { message: "Confluence environment is not configured.", code: "CONFLUENCE_UNAVAILABLE" } };
  }

  if (!hasOpenAiConfig(env)) {
    return { status: 503, body: { message: "OpenAI environment is not configured.", code: "AI_PROVIDER_UNAVAILABLE" } };
  }

  try {
    const question = typeof input.question === "string" ? input.question.trim() : "";
    const persona = typeof input.persona === "string" ? input.persona.trim() : "";
    const history = parseConversationHistory(input.history);
    const searchQuestion = buildSearchFollowUpQuestion(question, history);

    if (!question) {
      return { status: 400, body: { message: "question is required.", code: "BAD_REQUEST" } };
    }

    const cachedSearchAnswer = readAiSearchCache(searchQuestion);

    if (cachedSearchAnswer) {
      return { status: 200, body: cachedSearchAnswer };
    }

    const cache = await loadWikiCache(env);

    // Stage 1: AI query understanding — intent + bilingual keywords
    // Falls back to regex classifier + raw question when AI call fails
    const queryUnderstanding = await fetchQueryUnderstanding(env, searchQuestion, history);
    const questionIntent = queryUnderstanding?.intent ?? classifyQuestionIntent(searchQuestion);
    const searchKeywords = queryUnderstanding?.searchKeywords
      ?.map((keyword) => keyword.trim())
      .filter(Boolean);
    const searchQuery = searchKeywords?.length
      ? searchKeywords.join(" ")
      : buildFallbackSearchQuery(searchQuestion) || searchQuestion;

    // Stage 2: Lexical page search using Stage 1 keywords
    const topDocuments = (questionIntent === "broad-planning" || questionIntent === "concept")
      ? uniqueWikiDocuments([
          ...getTopSearchWikiDocumentsIn(cache.documents, searchQuery, 10),
          ...getIndexFirstSearchWikiDocumentsIn(cache.documents, searchQuery, 10),
        ]).slice(0, 10)
      : getIndexFirstSearchWikiDocumentsIn(cache.documents, searchQuery, 8);
    // nav 문서는 인덱스 확장 단계 전용 — AI 답변 컨텍스트에서 제외 (search-flow-contract.md)
    const contextDocuments = expandSearchContextDocuments(cache.documents, topDocuments, 14)
      .filter((document) => !isIndexWikiDocument(document));

    if (!topDocuments.length) {
      return {
        status: 200,
        body: {
          answer: "관련 문서를 찾지 못했습니다. 질문을 더 구체적으로 입력해 주세요.",
          policyNotice: {
            isPolicyRelated: false,
            message: "",
          },
          immediateActions: [],
          exampleCommands: [],
          verificationChecks: [],
          cautions: [],
          confluenceData: [],
          unsupportedClaims: ["검색 결과에 질문을 뒷받침할 공개 문서가 없습니다."],
          recommendedPages: [],
          recommendedDocuments: [],
        },
      };
    }

    const dynamicRulesResult = env.CONFLUENCE_PROMPT_RULES_PAGE_ID
      ? await loadPromptRulesCache(env)
      : null;
    const dynamicRules = dynamicRulesResult?.rules ?? EMPTY_PROMPT_RULES;

    const promptContext = buildAiSearchPromptContext(
      contextDocuments,
      question,
      cache.policyDocuments,
      history,
      dynamicRules,
    );
    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.VITE_OPENAI_MODEL || env.OPENAI_MODEL || "o4-mini",
        input: buildAiSearchInput(promptContext),
        max_output_tokens: 2800,
        reasoning: {
          effort: "low",
        },
        text: {
          format: {
            type: "json_schema",
            name: "wiki_search_answer",
            strict: true,
            schema: aiSearchJsonSchema(),
          },
        },
      }),
    });

    if (!aiResponse.ok) {
      return { status: 502, body: { message: "AI provider is unavailable.", code: "AI_PROVIDER_UNAVAILABLE" } };
    }

    const payload = await aiResponse.json();
    const rawResult = parseAiSearchResult(payload);
    // For concept questions, suppress action sections the AI may have filled anyway
    const result = questionIntent === "concept"
      ? { ...rawResult, immediateActions: [], exampleCommands: [], verificationChecks: [], cautions: [] }
      : rawResult;

    const rankingRecommendedDocuments = getIndexFirstSearchWikiDocumentsIn(cache.documents, searchQuery, 8)
      .filter((document) => !isIndexWikiDocument(document))
      .map((document) => ({
        id: document.id,
        title: document.title,
        summary: document.summary,
        href: getWikiDocumentHref(document) ?? "#",
        docType: document.metadata.docType,
      }));
    const recommendedPageIds = Array.isArray(result.recommendedPages)
      ? new Set(
          result.recommendedPages
            .map((page: { pageId?: unknown }) => page.pageId)
            .filter((pageId): pageId is string => typeof pageId === "string"),
        )
      : new Set<string>();
    const aiRecommendedDocuments = cache.documents
      .filter((document) => {
        if (!recommendedPageIds.has(document.id)) return false;
        const dt = document.metadata.docType;
        if (dt === "nav" || dt === "ops" || dt === "policy" || dt === "playbook") return false;
        return true;
      })
      .map((document) => ({
        id: document.id,
        title: document.title,
        summary: document.summary,
        href: getWikiDocumentHref(document) ?? "#",
        docType: document.metadata.docType,
      }));
    const normalizedUnsupportedClaims = normalizeUnsupportedClaimsForSearchResult(result);
    const normalizedResult = {
      ...result,
      unsupportedClaims: normalizedUnsupportedClaims,
    };
    const isFullyUnsupportedResult = isFullyUnsupportedSearchAnswerState(normalizedResult);
    // 추천 페이지: AI가 직접 선택한 페이지 (없으면 랭킹 상위)
    const recommendedDocuments = isFullyUnsupportedResult
      ? []
      : (aiRecommendedDocuments.length ? aiRecommendedDocuments : rankingRecommendedDocuments).slice(0, 4);
    // 관련 페이지: 랭킹 기반 페이지 중 추천 페이지에 없는 것
    const recommendedIds = new Set(recommendedDocuments.map((d) => d.id));
    const relatedDocuments = isFullyUnsupportedResult
      ? []
      : rankingRecommendedDocuments
          .filter((d) => !recommendedIds.has(d.id))
          .slice(0, 4);
    const { recommendedPages: _recommendedPages, ...responseWithoutRawPages } = result as {
      recommendedPages?: unknown;
      [key: string]: unknown;
    };
    const sufficiency = !isFullyUnsupportedResult && normalizedUnsupportedClaims.length === 0 && recommendedDocuments.length >= 2
      ? "충분"
      : "부족";
    const responsePayload = {
      ...responseWithoutRawPages,
      unsupportedClaims: normalizedUnsupportedClaims,
      sufficiency,
      policyNotice: enrichPolicyNoticeSources(
        { policyNotice: responseWithoutRawPages.policyNotice },
        promptContext.policyContext.selectedPolicies,
      ).policyNotice,
      recommendedDocuments,
      relatedDocuments,
    };

    writeAiSearchCache(searchQuestion, responsePayload);

    // Fire-and-forget: log to Playbook after response is computed
    if (env.CONFLUENCE_PLAYBOOK_PAGE_ID) {
      firePlaybookLog(env, question, persona, responsePayload).catch((err) => {
        console.error("[playbook]", err instanceof Error ? err.message : err);
      });
    }

    return { status: 200, body: responsePayload };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to answer search question.";
    return { status: 502, body: { message, code: "AI_PROVIDER_UNAVAILABLE" } };
  }
}
