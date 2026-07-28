import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import {
  handleAiAskRequest,
  handleAiSearchRequest,
  hasConfluenceConfig,
  hasOpenAiConfig,
} from "../../packages/wiki-core/src/lib/aiOrchestration.ts";
import { fetchConfluencePageRecords } from "../../packages/wiki-core/src/lib/confluenceClient.ts";
import { renderConfluenceContentToCleanHtml } from "../../packages/wiki-core/src/lib/confluenceCleanHtml.ts";
import {
  buildWikiDocumentsFromRecords,
  buildPolicyDocumentsFromRecords,
  parseRemotePolicyPageRecords,
  parseRemoteWikiPageRecords,
} from "../../packages/wiki-core/src/lib/wikiDataSource.ts";
import { getWikiDocumentHref, type WikiDocument } from "../../packages/wiki-core/src/lib/wikiDocuments.ts";
import { fetchGitHubOrgProjects, type GitHubProject } from "../../packages/wiki-core/src/lib/githubClient.ts";

const WIKI_CACHE_TTL_MS = 30 * 60 * 1000;
const GITHUB_CACHE_TTL_MS = 30 * 60 * 1000;

type WikiCache = {
  expiresAt: number;
  records: ReturnType<typeof parseRemoteWikiPageRecords>;
  documents: WikiDocument[];
  policyDocuments: ReturnType<typeof buildPolicyDocumentsFromRecords>;
};

type GitHubCache = {
  expiresAt: number;
  projects: GitHubProject[];
};

let wikiCache: WikiCache | null = null;
let wikiCachePromise: Promise<WikiCache> | null = null;
let githubCache: GitHubCache | null = null;
let githubCachePromise: Promise<GitHubCache> | null = null;

function hasGithubConfig(env: Record<string, string>) {
  return Boolean(env.GITHUB_TOKEN && env.GITHUB_ORG);
}

function githubDevApiPlugin(env: Record<string, string>): Plugin {
  return {
    name: "sfood-github-dev-api",
    configureServer(server) {
      server.middlewares.use("/api/github/projects", async (_request, response) => {
        response.setHeader("Content-Type", "application/json; charset=utf-8");

        if (!hasGithubConfig(env)) {
          response.statusCode = 503;
          response.end(
            JSON.stringify({ message: "GitHub environment is not configured." }),
          );
          return;
        }

        try {
          const cache = await loadGithubCache(env);
          response.end(JSON.stringify({ projects: cache.projects }));
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to load GitHub projects.";
          response.statusCode = 502;
          response.end(JSON.stringify({ message }));
        }
      });
    },
  };
}

async function loadGithubCache(env: Record<string, string>): Promise<GitHubCache> {
  const now = Date.now();

  if (githubCache && githubCache.expiresAt > now) {
    return githubCache;
  }

  if (githubCachePromise) {
    return githubCachePromise;
  }

  githubCachePromise = fetchGitHubOrgProjects({
    token: env.GITHUB_TOKEN,
    org: env.GITHUB_ORG,
  })
    .then((projects) => {
      githubCache = { expiresAt: Date.now() + GITHUB_CACHE_TTL_MS, projects };
      return githubCache;
    })
    .finally(() => {
      githubCachePromise = null;
    });

  return githubCachePromise;
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

      server.middlewares.use("/api/wiki/documents", async (_request, response) => {
        response.setHeader("Content-Type", "application/json; charset=utf-8");

        if (!hasConfluenceConfig(env)) {
          response.statusCode = 503;
          response.end(JSON.stringify({ message: "Confluence environment is not configured." }));
          return;
        }

        try {
          const cache = await loadVisibleDevWikiCache(env);
          const byId = new Map(cache.documents.map((document) => [document.id, document]));

          const pages = cache.documents.map((document) => ({
            id: document.id,
            slug: document.slug,
            title: document.title,
            summary: document.summary,
            href: getWikiDocumentHref(document) ?? `/wiki/${document.id}`,
            docType: document.metadata.docType,
            contentHtml: renderConfluenceContentToCleanHtml(document.contentHtml, cache.documents),
            related: document.metadata.related
              .map((relatedId) => byId.get(relatedId))
              .filter((related): related is NonNullable<typeof related> => Boolean(related))
              .map((related) => ({
                title: related.title,
                href: getWikiDocumentHref(related) ?? `/wiki/${related.id}`,
              })),
          }));

          response.end(JSON.stringify({ pages }));
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to load wiki documents.";

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

        try {
          const body = await readJsonBody(request);
          const { status, body: resultBody } = await handleAiAskRequest(env, {
            pageId: body.pageId,
            question: body.question,
            history: body.history,
          });

          response.statusCode = status;
          response.end(JSON.stringify(resultBody));
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

        try {
          const body = await readJsonBody(request);
          const { status, body: resultBody } = await handleAiSearchRequest(env, {
            question: body.question,
            persona: body.persona,
            history: body.history,
          });

          response.statusCode = status;
          response.end(JSON.stringify(resultBody));
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

async function fetchAndBuildWikiCache(env: Record<string, string>): Promise<WikiCache> {
  const pages = await fetchConfluencePageRecords({
    siteName: env.ATLASSIAN_SITE_NAME,
    userEmail: env.ATLASSIAN_USER_EMAIL,
    apiToken: env.ATLASSIAN_API_TOKEN,
    spaceId: env.CONFLUENCE_SPACE_ID,
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
    plugins: [confluenceDevApiPlugin(env), githubDevApiPlugin(env), react(), tailwindcss()],
    test: {
      environment: "jsdom",
    },
  };
});
