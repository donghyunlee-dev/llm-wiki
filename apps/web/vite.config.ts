import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import {
  aiAskJsonSchema,
  aiSearchJsonSchema,
  buildAiAskInput,
  buildAiAskPromptContext,
  buildAiSearchInput,
  buildAiSearchPromptContext,
  classifySearchQuestionIntent,
  buildSearchFollowUpQuestion,
} from "../../packages/wiki-core/src/lib/aiAsk.ts";
import { fetchConfluencePageRecords } from "../../packages/wiki-core/src/lib/confluenceClient.ts";
import {
  buildWikiDocumentsFromRecords,
  buildPolicyDocumentsFromRecords,
  parseRemotePolicyPageRecords,
  parseRemoteOpsPageRecords,
  parseRemoteWikiPageRecords,
} from "../../packages/wiki-core/src/lib/wikiDataSource.ts";
import {
  getIndexFirstSearchWikiDocumentsIn,
  getTopSearchWikiDocumentsIn,
  getParentWikiDocumentFrom,
  getWikiDocumentByIdFrom,
  resolveWikiDocumentsByIdsFrom,
  type WikiDocument,
} from "../../packages/wiki-core/src/lib/wikiDocuments.ts";

const WIKI_CACHE_TTL_MS = 5 * 60 * 1000;
const AI_SEARCH_CACHE_TTL_MS = 10 * 60 * 1000;

type WikiCache = {
  expiresAt: number;
  records: ReturnType<typeof parseRemoteWikiPageRecords>;
  documents: WikiDocument[];
  policyDocuments: ReturnType<typeof buildPolicyDocumentsFromRecords>;
  opsPolicyDocuments: ReturnType<typeof buildPolicyDocumentsFromRecords>;
};

type AiSearchCacheEntry = {
  expiresAt: number;
  payload: unknown;
};

let wikiCache: WikiCache | null = null;
let wikiCachePromise: Promise<WikiCache> | null = null;
const aiSearchCache = new Map<string, AiSearchCacheEntry>();

function hasConfluenceConfig(env: Record<string, string>) {
  return Boolean(
    env.ATLASSIAN_SITE_NAME &&
      env.ATLASSIAN_USER_EMAIL &&
      env.ATLASSIAN_API_TOKEN &&
      env.CONFLUENCE_SPACE_ID,
  );
}

function hasOpenAiConfig(env: Record<string, string>) {
  return Boolean(env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY);
}

function confluenceDevApiPlugin(env: Record<string, string>): Plugin {
  return {
    name: "sfood-confluence-dev-api",
    configureServer(server) {
      server.middlewares.use("/api/wiki-pages", async (_request, response) => {
        response.setHeader("Content-Type", "application/json; charset=utf-8");

        if (!hasConfluenceConfig(env)) {
          response.statusCode = 503;
          response.end(JSON.stringify({ message: "Confluence environment is not configured." }));
          return;
        }

        try {
          const cache = await loadVisibleDevWikiCache(env);

          response.end(JSON.stringify({ pages: cache.records }));
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to load wiki pages.";

          response.statusCode = 502;
          response.end(JSON.stringify({ message }));
        }
      });

      server.middlewares.use("/api/wiki/ai/ask", async (request, response) => {
        response.setHeader("Content-Type", "application/json; charset=utf-8");

        if (request.method !== "POST") {
          response.statusCode = 405;
          response.end(JSON.stringify({ message: "Method not allowed", code: "METHOD_NOT_ALLOWED" }));
          return;
        }

        if (!hasConfluenceConfig(env)) {
          response.statusCode = 503;
          response.end(JSON.stringify({ message: "Confluence environment is not configured.", code: "CONFLUENCE_UNAVAILABLE" }));
          return;
        }

        if (!hasOpenAiConfig(env)) {
          response.statusCode = 503;
          response.end(JSON.stringify({ message: "OpenAI environment is not configured.", code: "AI_PROVIDER_UNAVAILABLE" }));
          return;
        }

        try {
          const body = await readJsonBody(request);
          const pageId = typeof body.pageId === "string" ? body.pageId : "";
          const question = typeof body.question === "string" ? body.question.trim() : "";
          const history = parseConversationHistory(body.history);

          if (!pageId || !question) {
            response.statusCode = 400;
            response.end(JSON.stringify({ message: "pageId and question are required.", code: "BAD_REQUEST" }));
            return;
          }

          const cache = await loadVisibleDevWikiCache(env);
          const documents = cache.documents;
          const document = getWikiDocumentByIdFrom(documents, pageId);

          if (!document) {
            response.statusCode = 404;
            response.end(JSON.stringify({ message: "Page not found", code: "PAGE_NOT_FOUND" }));
            return;
          }

          const relatedDocuments = [
            getParentWikiDocumentFrom(documents, document),
            ...resolveWikiDocumentsByIdsFrom(documents, document.metadata.prerequisites),
            ...resolveWikiDocumentsByIdsFrom(documents, document.metadata.next),
            ...resolveWikiDocumentsByIdsFrom(documents, document.metadata.related),
          ].filter((item, index, array): item is NonNullable<typeof item> =>
            Boolean(item) && array.findIndex((candidate) => candidate?.id === item.id) === index,
          );

          const policyDocuments = cache.policyDocuments.length ? cache.policyDocuments : cache.opsPolicyDocuments;
          const promptContext = buildAiAskPromptContext(document, relatedDocuments, policyDocuments, question, history);
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
            response.statusCode = 502;
            response.end(JSON.stringify({ message: "AI provider is unavailable.", code: "AI_PROVIDER_UNAVAILABLE" }));
            return;
          }

          const payload = await aiResponse.json();
          const resultText = extractResponseText(payload);

          response.end(resultText);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to answer question.";

          response.statusCode = 502;
          response.end(JSON.stringify({ message, code: "AI_PROVIDER_UNAVAILABLE" }));
        }
      });

      server.middlewares.use("/api/wiki/ai/search", async (request, response) => {
        response.setHeader("Content-Type", "application/json; charset=utf-8");

        if (request.method !== "POST") {
          response.statusCode = 405;
          response.end(JSON.stringify({ message: "Method not allowed", code: "METHOD_NOT_ALLOWED" }));
          return;
        }

        if (!hasConfluenceConfig(env)) {
          response.statusCode = 503;
          response.end(JSON.stringify({ message: "Confluence environment is not configured.", code: "CONFLUENCE_UNAVAILABLE" }));
          return;
        }

        if (!hasOpenAiConfig(env)) {
          response.statusCode = 503;
          response.end(JSON.stringify({ message: "OpenAI environment is not configured.", code: "AI_PROVIDER_UNAVAILABLE" }));
          return;
        }

        try {
          const body = await readJsonBody(request);
          const question = typeof body.question === "string" ? body.question.trim() : "";
          const history = parseConversationHistory(body.history);
          const searchQuestion = buildSearchFollowUpQuestion(question, history);

          if (!question) {
            response.statusCode = 400;
            response.end(JSON.stringify({ message: "question is required.", code: "BAD_REQUEST" }));
            return;
          }

          const cachedSearchAnswer = readAiSearchCache(searchQuestion);

          if (cachedSearchAnswer) {
            response.end(JSON.stringify(cachedSearchAnswer));
            return;
          }

          const cache = await loadVisibleDevWikiCache(env);
          const questionIntent = classifySearchQuestionIntent(searchQuestion);
          const topDocuments = questionIntent === "broad-planning"
            ? uniqueWikiDocuments([
                ...getTopSearchWikiDocumentsIn(cache.documents, searchQuestion, 10),
                ...getIndexFirstSearchWikiDocumentsIn(cache.documents, searchQuestion, 10),
              ]).slice(0, 10)
            : getIndexFirstSearchWikiDocumentsIn(cache.documents, searchQuestion, 8);

          if (!topDocuments.length) {
            response.end(JSON.stringify({
              answer: "관련 문서를 찾지 못했습니다. 질문을 더 구체적으로 입력해 주세요.",
              confluenceData: [],
              unsupportedClaims: ["검색 결과에 질문을 뒷받침할 공개 문서가 없습니다."],
              recommendedPages: [],
              recommendedDocuments: [],
              guideDocuments: [],
            }));
            return;
          }

          const promptContext = buildAiSearchPromptContext(
            topDocuments,
            question,
            cache.policyDocuments,
            cache.opsPolicyDocuments,
            history,
          );
          const aiResponse = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: env.VITE_OPENAI_MODEL || env.OPENAI_MODEL || "gpt-5-mini",
              input: buildAiSearchInput(promptContext),
              max_output_tokens: 1500,
              reasoning: {
                effort: "minimal",
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
            response.statusCode = 502;
            response.end(JSON.stringify({ message: "AI provider is unavailable.", code: "AI_PROVIDER_UNAVAILABLE" }));
            return;
          }

          const payload = await aiResponse.json();
          const result = parseAiSearchResult(payload);

          const recommendedPageIds = Array.isArray(result.recommendedPages)
            ? new Set(
                result.recommendedPages
                  .map((page: { pageId?: unknown }) => page.pageId)
                  .filter((pageId): pageId is string => typeof pageId === "string"),
              )
            : new Set<string>();
          const recommendedDocuments = cache.documents
            .filter((document) => recommendedPageIds.has(document.id))
            .slice(0, 4)
            .map((document) => ({
              id: document.id,
              title: document.title,
              summary: document.summary,
              href: `/${document.category}/${document.slug}`,
            }));
          const { recommendedPages: _recommendedPages, ...responseWithoutRawPages } = result as {
            recommendedPages?: unknown;
            [key: string]: unknown;
          };
          const responsePayload = {
            ...responseWithoutRawPages,
            recommendedDocuments,
            guideDocuments: recommendedDocuments,
          };

          writeAiSearchCache(searchQuestion, responsePayload);
          response.end(JSON.stringify(responsePayload));
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to answer search question.";

          response.statusCode = 502;
          response.end(JSON.stringify({ message, code: "AI_PROVIDER_UNAVAILABLE" }));
        }
      });
    },
  };
}

async function loadVisibleDevWikiCache(env: Record<string, string>) {
  const now = Date.now();

  if (wikiCache && wikiCache.expiresAt > now) {
    return wikiCache;
  }

  if (wikiCachePromise) {
    return wikiCachePromise;
  }

  wikiCachePromise = fetchConfluencePageRecords({
    siteName: env.ATLASSIAN_SITE_NAME,
    userEmail: env.ATLASSIAN_USER_EMAIL,
    apiToken: env.ATLASSIAN_API_TOKEN,
    spaceId: env.CONFLUENCE_SPACE_ID,
  })
    .then((pages) => {
      const records = parseRemoteWikiPageRecords({ pages });
      const policyRecords = parseRemotePolicyPageRecords({ pages });
      const opsRecords = parseRemoteOpsPageRecords({ pages });

      return {
        expiresAt: Date.now() + WIKI_CACHE_TTL_MS,
        records,
        documents: buildWikiDocumentsFromRecords(records),
        policyDocuments: buildPolicyDocumentsFromRecords(policyRecords, "policy"),
        opsPolicyDocuments: buildPolicyDocumentsFromRecords(opsRecords, "ops"),
      };
    })
    .finally(() => {
      wikiCachePromise = null;
    });

  wikiCache = await wikiCachePromise;
  return wikiCache;
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
    .filter((item): item is { question: string; answer?: string } => Boolean(item));
}

function readJsonBody(request: import("node:http").IncomingMessage) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    let data = "";

    request.on("data", (chunk) => {
      data += chunk;
    });
    request.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
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
  const candidates = [responseText, extractJsonObjectText(responseText)];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    try {
      const parsed = JSON.parse(candidate) as Record<string, unknown>;

      return {
        answer:
          typeof parsed.answer === "string"
            ? normalizeAiSearchAnswerText(parsed.answer)
            : normalizeAiSearchAnswerText(responseText),
        confluenceData: Array.isArray(parsed.confluenceData) ? parsed.confluenceData : [],
        unsupportedClaims: Array.isArray(parsed.unsupportedClaims) ? parsed.unsupportedClaims : [],
        recommendedPages: Array.isArray(parsed.recommendedPages) ? parsed.recommendedPages : [],
      };
    } catch {
      continue;
    }
  }

  return {
    answer: normalizeAiSearchAnswerText(responseText),
    confluenceData: [],
    unsupportedClaims: ["AI search response could not be parsed into the expected JSON shape."],
    recommendedPages: [],
  };
}

function extractJsonObjectText(text: string) {
  const startIndex = text.indexOf("{");
  const endIndex = text.lastIndexOf("}");

  if (startIndex < 0 || endIndex <= startIndex) {
    return "";
  }

  return text.slice(startIndex, endIndex + 1);
}

function normalizeAiSearchAnswerText(text: string) {
  const trimmed = text.trim();
  const candidates = [trimmed, maybeUnescapeAiSearchJsonText(trimmed)];

  for (const candidate of candidates) {
    const answerFieldMatch = candidate.match(/^\{\s*"answer"\s*:\s*"((?:[^"\\]|\\.)*)"/s);

    if (answerFieldMatch?.[1]) {
      try {
        const decoded = JSON.parse(`"${answerFieldMatch[1]}"`) as string;
        return decoded.trim();
      } catch {
        // Fall through to object parsing.
      }
    }

    if (!candidate.startsWith("{")) {
      continue;
    }

    const nestedCandidate = extractJsonObjectText(candidate);

    if (!nestedCandidate) {
      continue;
    }

    try {
      const parsed = JSON.parse(nestedCandidate) as Record<string, unknown>;

      if (typeof parsed.answer === "string") {
        return parsed.answer.trim();
      }
    } catch {
      continue;
    }
  }

  return trimmed;
}

function maybeUnescapeAiSearchJsonText(text: string) {
  if (!text.includes('\\"') && !text.includes("\\n") && !text.includes("\\\\")) {
    return text;
  }

  return text.replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\\\/g, "\\");
}

function normalizeAiSearchResponsePayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  const record = payload as Record<string, unknown>;
  const answer = typeof record.answer === "string" ? normalizeAiSearchAnswerText(record.answer) : record.answer;

  return {
    ...record,
    answer,
  };
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const confluenceConfigured = hasConfluenceConfig(env);
  const wikiDataSource =
    env.VITE_WIKI_DATA_SOURCE || (command === "serve" && confluenceConfigured ? "remote" : "snapshot");
  const wikiRemoteEndpoint = env.VITE_WIKI_REMOTE_ENDPOINT || "/api/wiki-pages";

  return {
    define: {
      "import.meta.env.VITE_WIKI_DATA_SOURCE": JSON.stringify(wikiDataSource),
      "import.meta.env.VITE_WIKI_REMOTE_ENDPOINT": JSON.stringify(wikiRemoteEndpoint),
    },
    plugins: [confluenceDevApiPlugin(env), react(), tailwindcss()],
  };
});
