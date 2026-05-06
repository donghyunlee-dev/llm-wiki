import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const QUESTIONS = [
  "Codex에서 Jira MCP를 설정할 때 먼저 준비할 항목과 검증 순서는 무엇인가?",
  "codex를 cli 환경에서 설치를 어떻게 해?",
  "Agent 시작하기와 사내 위키 활용 방법 중 먼저 읽어야 할 순서는 무엇인가?",
  "프로젝트 설계 시작하기 전에 어떤 준비를 해야 하나?",
  "업무 승인 요청 도구와 주간 보고서 자동화 사례를 참고해 어떤 흐름으로 만들면 좋은가?",
  "Codex CLI를 처음 설치할 때 인증과 버전 확인까지 최소 절차는 무엇인가?",
  "프로젝트 설계를 시작할 때 반드시 정해야 하는 항목과 뒤로 미뤄도 되는 항목은 무엇인가?",
  "설정이 잘 안 될 때 먼저 확인해야 하는 순서는 무엇인가?",
];

const ROOT = resolve(process.cwd());
const ENV_PATH = resolve(ROOT, "apps/web/.env.local");
const OUTPUT_JSON = resolve(ROOT, "docs/tasks/search-quality-and-answer-rendering/benchmark-results.json");
const OUTPUT_MD = resolve(ROOT, "docs/tasks/search-quality-and-answer-rendering/benchmark-results.md");

const env = loadEnvFile(ENV_PATH);
const apiKey = env.VITE_OPENAI_API_KEY || env.OPENAI_API_KEY;
const model = env.VITE_OPENAI_MODEL || env.OPENAI_MODEL || "gpt-5-mini";
const wikiEndpoint = env.WIKI_BENCHMARK_ENDPOINT || "http://127.0.0.1:5173/api/wiki/ai/search";
const judgeModel = env.VITE_OPENAI_MODEL || env.OPENAI_MODEL || "gpt-5-mini";

if (!apiKey) {
  throw new Error(`Missing OpenAI API key. Add VITE_OPENAI_API_KEY or OPENAI_API_KEY to ${ENV_PATH}.`);
}

const results = [];

for (const question of QUESTIONS) {
  process.stdout.write(`Running: ${question}\n`);
  const generic = await safeRun(() => generateGenericAnswer(question, apiKey, model));
  const wiki = await safeRun(() => generateWikiAnswer(question, wikiEndpoint));
  const judge = generic.value && wiki.value
    ? await safeRun(() => judgeAnswer(question, generic.value, wiki.value, apiKey, judgeModel))
    : null;

  results.push({
    question,
    generic,
    wiki,
    judge,
    metrics: {
      generic: analyzeAnswer(generic.value?.answer ?? ""),
      wiki: analyzeAnswer(wiki.value?.answer ?? ""),
    },
  });
}

const report = renderReport(results);
writeFileSync(OUTPUT_JSON, JSON.stringify(results, null, 2));
writeFileSync(OUTPUT_MD, report);
process.stdout.write(`${report}\n`);

async function generateGenericAnswer(question, apiKey, modelName) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelName,
      input: [
        {
          role: "system",
          content:
            "You answer as a helpful general-purpose assistant. Do not use any hidden wiki or repository context. Answer in Korean with practical steps when appropriate.",
        },
        {
          role: "user",
          content: question,
        },
      ],
      max_output_tokens: 900,
      reasoning: {
        effort: "minimal",
      },
      text: {
        format: {
          type: "json_schema",
          name: "generic_answer",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["answer"],
            properties: {
              answer: { type: "string" },
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Generic answer request failed for "${question}": ${response.status}`);
  }

  const payload = await response.json();
  return { answer: extractResponseText(payload) };
}

async function generateWikiAnswer(question, endpoint) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question, history: [] }),
  });

  if (!response.ok) {
    throw new Error(`Wiki answer request failed for "${question}": ${response.status}`);
  }

  const payload = await response.json();

  return {
    answer: typeof payload.answer === "string" ? payload.answer : "",
    confluenceData: Array.isArray(payload.confluenceData) ? payload.confluenceData : [],
    unsupportedClaims: Array.isArray(payload.unsupportedClaims) ? payload.unsupportedClaims : [],
    recommendedDocuments: Array.isArray(payload.recommendedDocuments) ? payload.recommendedDocuments : [],
  };
}

async function judgeAnswer(question, generic, wiki, apiKey, modelName) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelName,
      input: [
        {
          role: "system",
          content:
            "You compare two answers for a wiki-search product. Score structure, factual alignment, completeness, and actionability on a 1-5 scale for each answer. Prefer the answer that is more grounded in the wiki corpus and more useful for a reader. Return only JSON.",
        },
        {
          role: "user",
          content: JSON.stringify({
            question,
            genericAnswer: generic.answer,
            wikiAnswer: wiki.answer,
            wikiEvidence: wiki.confluenceData,
            unsupportedClaims: wiki.unsupportedClaims,
            recommendedDocuments: wiki.recommendedDocuments,
            completionCriterion: "Treat 90 or above as close enough to the generic answer for this benchmark.",
            rubric: {
              structure: "How well the answer is organized and readable.",
              factualAlignment: "How well the answer fits the wiki-backed content for the question.",
              completeness: "How fully the answer addresses the user's ask.",
              actionability: "How directly the answer can be followed or used.",
            },
            outputRequirements: {
              winner: "generic | wiki | tie",
              reason: "One short paragraph explaining the decision.",
              similarity: "A number from 0 to 100 where 100 means the wiki answer is effectively as complete and usable as the generic answer.",
              scores: {
                generic: "Each of structure, factualAlignment, completeness, actionability on a 1-5 scale.",
                wiki: "Each of structure, factualAlignment, completeness, actionability on a 1-5 scale.",
              },
            },
          }),
        },
      ],
      max_output_tokens: 700,
      reasoning: {
        effort: "minimal",
      },
      text: {
        format: {
          type: "json_schema",
          name: "answer_judgement",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["winner", "reason", "similarity", "scores"],
            properties: {
              winner: { type: "string", enum: ["generic", "wiki", "tie"] },
              reason: { type: "string" },
              similarity: { type: "number" },
              scores: {
                type: "object",
                additionalProperties: false,
                required: ["generic", "wiki"],
                properties: {
                  generic: {
                    type: "object",
                    additionalProperties: false,
                    required: ["structure", "factualAlignment", "completeness", "actionability"],
                    properties: {
                      structure: { type: "number" },
                      factualAlignment: { type: "number" },
                      completeness: { type: "number" },
                      actionability: { type: "number" },
                    },
                  },
                  wiki: {
                    type: "object",
                    additionalProperties: false,
                    required: ["structure", "factualAlignment", "completeness", "actionability"],
                    properties: {
                      structure: { type: "number" },
                      factualAlignment: { type: "number" },
                      completeness: { type: "number" },
                      actionability: { type: "number" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Judgement request failed for "${question}": ${response.status}`);
  }

  const payload = await response.json();
  return JSON.parse(extractResponseText(payload));
}

function analyzeAnswer(answer) {
  const text = answer.trim();

  return {
    words: text ? text.split(/\s+/).length : 0,
    headings: (text.match(/^#{1,6}\s+/gm) || []).length,
    lists: (text.match(/^\s*(?:[-*•]|\d+[.)])\s+/gm) || []).length,
    codeBlocks: (text.match(/```/g) || []).length / 2,
    links: (text.match(/\[[^\]]+\]\(([^)]+)\)/g) || []).length,
    tables: (text.match(/^\|.+\|$/gm) || []).length,
    blockquotes: (text.match(/^>\s+/gm) || []).length,
  };
}

function renderReport(results) {
  const average = (items, keyPath) => {
    const values = items.map((item) => keyPath.split(".").reduce((value, key) => value[key], item));
    return values.reduce((sum, value) => sum + Number(value || 0), 0) / (values.length || 1);
  };

  const judged = results.filter((item) => item.judge?.value && !item.generic.error && !item.wiki.error);
  const wikiWins = judged.filter((item) => item.judge.value.winner === "wiki").length;
  const genericWins = judged.filter((item) => item.judge.value.winner === "generic").length;
  const ties = judged.filter((item) => item.judge.value.winner === "tie").length;
  const averageSimilarity = average(judged, "judge.value.similarity");

  const lines = [
    "# search-quality-and-answer-rendering Benchmark",
    "",
    `- Wiki wins: ${wikiWins}`,
    `- Generic wins: ${genericWins}`,
    `- Ties: ${ties}`,
    `- Avg wiki similarity: ${averageSimilarity.toFixed(1)} / 100 ${averageSimilarity >= 90 ? "(PASS)" : "(NEEDS WORK)"}`,
    `- Avg generic structure: ${average(results, "metrics.generic.headings") + average(results, "metrics.generic.lists") + average(results, "metrics.generic.codeBlocks") + average(results, "metrics.generic.links") + average(results, "metrics.generic.tables") + average(results, "metrics.generic.blockquotes")}`,
    `- Avg wiki structure: ${average(results, "metrics.wiki.headings") + average(results, "metrics.wiki.lists") + average(results, "metrics.wiki.codeBlocks") + average(results, "metrics.wiki.links") + average(results, "metrics.wiki.tables") + average(results, "metrics.wiki.blockquotes")}`,
    "",
  ];

  for (const item of results) {
    lines.push(`## ${item.question}`);
    lines.push("");
    if (item.judge?.value) {
      lines.push(`- Winner: ${item.judge.value.winner}`);
      lines.push(`- Reason: ${item.judge.value.reason}`);
      lines.push(`- Wiki similarity: ${typeof item.judge.value.similarity === "number" ? item.judge.value.similarity.toFixed(1) : "n/a"} / 100`);
      lines.push(
        `- Generic score: structure ${item.judge.value.scores.generic.structure}, factual ${item.judge.value.scores.generic.factualAlignment}, completeness ${item.judge.value.scores.generic.completeness}, actionability ${item.judge.value.scores.generic.actionability}`,
      );
      lines.push(
        `- Wiki score: structure ${item.judge.value.scores.wiki.structure}, factual ${item.judge.value.scores.wiki.factualAlignment}, completeness ${item.judge.value.scores.wiki.completeness}, actionability ${item.judge.value.scores.wiki.actionability}`,
      );
    } else {
      lines.push(`- Winner: unavailable`);
      lines.push(`- Reason: one of the answers failed before judgment.`);
    }
    lines.push(`- Generic metrics: ${JSON.stringify(item.metrics.generic)}`);
    lines.push(`- Wiki metrics: ${JSON.stringify(item.metrics.wiki)}`);
    if (item.generic.error) {
      lines.push(`- Generic error: ${item.generic.error}`);
    }
    if (item.wiki.error) {
      lines.push(`- Wiki error: ${item.wiki.error}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function loadEnvFile(path) {
  const result = {};

  if (!path || !exists(path)) {
    return result;
  }

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");

    if (equalsIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();
    result[key] = value;
  }

  return result;
}

async function safeRun(fn) {
  try {
    return { value: await fn(), error: null };
  } catch (error) {
    return {
      value: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function exists(path) {
  try {
    readFileSync(path, "utf8");
    return true;
  } catch {
    return false;
  }
}

function extractResponseText(payload) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.output)) {
    throw new Error("Unexpected OpenAI response payload.");
  }

  for (const output of payload.output) {
    if (!output || typeof output !== "object" || !Array.isArray(output.content)) {
      continue;
    }

    for (const content of output.content) {
      if (content && typeof content === "object" && typeof content.text === "string") {
        return content.text;
      }
    }
  }

  throw new Error("OpenAI response did not include text content.");
}
