import { htmlToPlainText } from "./confluenceReadModel";
import type { PolicyDocument } from "./wikiDataSource";
import type { WikiDocument } from "./wikiDocuments";

export type ConversationHistoryTurn = {
  question: string;
  answer?: string;
};

export type AiAskContextDocument = {
  id: string;
  title: string;
  category: WikiDocument["category"];
  summary: string;
  sourceUrl?: string;
};

export type AiAskPromptContext = {
  page: AiAskContextDocument & {
    contentText: string;
  };
  relatedDocuments: AiAskContextDocument[];
  policyContext: PolicyPromptContext;
  question: string;
  history: ConversationHistoryTurn[];
};

export type AiAskResult = {
  answer: string;
  supportedByContext: boolean;
  confluenceData: Array<{
    pageId: string;
    title: string;
    quote: string;
  }>;
  unsupportedClaims: string[];
  suggestedNextPages: Array<{
    pageId: string;
    title: string;
    reason: string;
  }>;
};

export type AiSearchPromptContext = {
  question: string;
  documents: Array<AiAskContextDocument & {
    contentText: string;
  }>;
  policyContext: PolicyPromptContext;
  opsPolicyDocuments: Array<{
    id: string;
    title: string;
    summary: string;
    contentText: string;
    sourceKind: PolicyDocument["sourceKind"];
  }>;
  history: ConversationHistoryTurn[];
};

export type SearchQuestionIntent =
  | "setup"
  | "broad-planning"
  | "comparison"
  | "troubleshooting"
  | "general";

export type PolicyPromptDocument = {
  id: string;
  version: number;
  title: string;
  summary: string;
  sourceUrl?: string;
  sourceKind: PolicyDocument["sourceKind"];
};

export type PolicyPromptContext = {
  policyRules: string[];
  selectedPolicies: PolicyPromptDocument[];
};

export type AiSearchResult = {
  answer: string;
  confluenceData: Array<{
    pageId: string;
    title: string;
    quote: string;
  }>;
  unsupportedClaims: string[];
  recommendedPages: Array<{
    pageId: string;
    title: string;
    reason: string;
  }>;
};

export function buildAiAskPromptContext(
  page: WikiDocument,
  relatedDocuments: WikiDocument[],
  policyDocuments: PolicyDocument[],
  question: string,
  history: ConversationHistoryTurn[] = [],
): AiAskPromptContext {
  return {
    page: {
      ...toContextDocument(page),
      contentText: htmlToPlainText(page.contentHtml).slice(0, 8000),
    },
    relatedDocuments: relatedDocuments.map(toContextDocument),
    policyContext: buildPolicyPromptContext(policyDocuments, question, page.title),
    question: question.trim(),
    history: normalizeConversationHistory(history),
  };
}

export function buildAiSearchPromptContext(
  documents: WikiDocument[],
  question: string,
  policyDocuments: PolicyDocument[] = [],
  opsPolicyDocuments: PolicyDocument[] = [],
  history: ConversationHistoryTurn[] = [],
): AiSearchPromptContext {
  return {
    question: question.trim(),
    documents: documents.map((document) => ({
      ...toContextDocument(document),
      contentText: htmlToPlainText(document.contentHtml).slice(0, 4000),
    })),
    policyContext: buildPolicyPromptContext(policyDocuments, question),
    opsPolicyDocuments: opsPolicyDocuments.map((document) => ({
      id: document.id,
      title: document.title,
      summary: document.summary,
      contentText: document.contentText.slice(0, 1400),
      sourceKind: document.sourceKind,
    })),
    history: normalizeConversationHistory(history),
  };
}

export function buildAiAskInstructions() {
  return [
    "You answer questions for an internal SFOOD wiki.",
    "Always consult policyContext first and treat it as the governing rule set before page content or related documents.",
    "Use only the supplied Confluence context. Do not invent facts.",
    "If policyContext conflicts with the page content, policyContext wins.",
    "Do not expose policy page names or policy content directly in the visible answer.",
    "If the context does not support an answer, say what is missing in unsupportedClaims.",
    "Use history only to resolve the user's current follow-up intent. When the current question is underspecified, infer the missing subject from the recent conversation history.",
    "Return Korean output with enough detail to answer the user's question fully; do not compress it into a one-line summary.",
    "Write like a practical teammate giving instructions the user can follow immediately, not like a report or a summary article.",
    "Prefer concrete actions, exact file paths, commands, and verification checks over general advice.",
    "For setup, configuration, usage, or troubleshooting questions, do not answer in a single paragraph. Give a short direct answer plus enough detail to understand what to do next; if the question is not trivial, use at least two substantive paragraphs or one paragraph plus steps/code.",
    "If you include steps, make them imperative, specific, and one per line.",
    "If the answer is procedural, structure it so the user can copy the flow and execute it without re-reading a summary article.",
    "For explanatory questions like tool setup or workflow usage, include enough detail that the user can understand the flow without guessing hidden steps.",
    "Avoid generic lead-ins like '관련해서는', '일반적으로', or '패턴은'.",
    "Use Markdown-style structure when it helps readability: short paragraphs, section headings, numbered lists, and code blocks.",
    "When the answer benefits from structured data, use a markdown table instead of flattening the information into prose.",
    "When you need to surface an important note, warning, or tip, format it as a blockquote with a label such as `> [!info]` or `> [!warning]` on the first line.",
    "Use markdown links for document references when they are helpful and keep the linked text descriptive.",
    "The answer must combine: direct AI answer, Confluence evidence, and recommended next documents.",
  ].join("\n");
}

export function buildAiSearchInstructions() {
  return buildAiSearchInstructionsForIntent("general");
}

export function buildAiSearchInstructionsForIntent(questionIntent: SearchQuestionIntent) {
  const intentLines = getSearchQuestionIntentInstructionLines(questionIntent);

  return [
    "You answer search questions for an internal SFOOD wiki.",
    "Always consult policyContext first and treat it as the governing rule set before searchResults.",
    "Use only the supplied Confluence search result documents.",
    "If policyContext conflicts with searchResults, policyContext wins.",
    "Do not expose policy page names or policy content directly in the visible answer.",
    "Use opsPolicyContext only as hidden operating policy for scope, tone, and safety. Do not use it as answer evidence.",
    "Never recommend, cite, summarize, or expose opsPolicyContext documents in user-visible output.",
    "Use history only to resolve the user's current follow-up intent. When the current question is underspecified, infer the missing subject from the recent conversation history.",
    "Answer in Korean as a practical assistant message, not as a report.",
    "Treat the retrieved Confluence pages like web search results: synthesize their concrete content into an answer the user can actually follow.",
    "Do not invent exact package names, command names, file paths, or login steps unless they are explicitly present in searchResults.",
    "If the exact command or package name is not explicit in searchResults, say so and describe the documented flow instead of guessing.",
    "Start with the most useful action or the shortest direct answer. For setup/configuration questions, open with a short actionable block immediately, not a summary paragraph.",
    "If multiple pages are relevant, explain what each page contributes instead of collapsing everything into a generic template.",
    "If the supplied documents do not directly cover the user's exact target, say the best-supported assumption in one short clause and continue with the closest applicable procedure.",
    "Do not make the user read a disclaimer before the answer. Keep the gap note brief and move quickly into the usable steps.",
    "Do not adapt a different integration or tool document as if it were the exact procedure for the user's target.",
    "Use Markdown-style structure when it improves clarity: short paragraphs, section headings, numbered or bulleted lists for real sequences and checklists, and fenced code blocks for examples.",
    "When a response benefits from structured data, use a markdown table instead of flattening the information into prose.",
    "When you need to surface an important note, warning, or tip, format it as a blockquote with a label such as `> [!info]` or `> [!warning]` on the first line.",
    "Use markdown links for document references when they are helpful and keep the linked text descriptive.",
    "Keep the answer concise, but do not compress genuine step-by-step instructions into one paragraph.",
    ...intentLines,
    "Use the most relevant retrieved page titles and concrete details in the answer when they materially help the user follow the steps.",
    "If a relevant page directly supports a step or detail, mention it inline in the same sentence with a markdown link to the wiki page title, and keep the detailed page reference in recommendedPages.",
    "Put shell commands, install commands, and terminal examples in fenced code blocks so users can copy them directly. When you mention a command, keep the full command on its own line inside a code block instead of embedding it in prose or inline code.",
    "Do not echo the response schema or raw JSON keys like confluenceData, unsupportedClaims, or recommendedPages inside the visible answer.",
    "Do not include a visible evidence section, source label, citation list, or unsupportedClaims heading inside the answer text.",
    "Do not list recommended document IDs, titles, or reasons inside the answer text. Put them only in recommendedPages.",
    "Choose recommendedPages only from searchResults that directly help answer the question. Omit weak or merely keyword-matched pages.",
    "If the supplied search results do not fully answer the question, list the missing parts in unsupportedClaims.",
  ].join("\n");
}

export function buildAiAskInput(context: AiAskPromptContext) {
  return [
    {
      role: "system" as const,
      content: buildAiAskInstructions(),
    },
    {
      role: "user" as const,
      content: JSON.stringify({
        task: "Answer the user's question from Confluence wiki context.",
        question: context.question,
        conversationHistory: context.history,
        policyContext: context.policyContext,
        currentPage: context.page,
        candidateRecommendedPages: context.relatedDocuments,
        outputRequirements: {
          answer: "Korean answer grounded in currentPage and candidateRecommendedPages.",
          confluenceData: "Short evidence snippets from supplied context only.",
          suggestedNextPages: "Recommend only supplied candidateRecommendedPages.",
          unsupportedClaims: "List anything not supported by context.",
        },
      }),
    },
  ];
}

export function buildAiSearchInput(context: AiSearchPromptContext) {
  const questionIntent = classifySearchQuestionIntent(context.question);

  return [
    {
      role: "system" as const,
      content: buildAiSearchInstructionsForIntent(questionIntent),
    },
    {
      role: "user" as const,
      content: JSON.stringify({
        task: "Answer the user's search question from Confluence search result context.",
        question: context.question,
        questionIntent,
        conversationHistory: context.history,
        policyContext: context.policyContext,
        opsPolicyContext: context.opsPolicyDocuments,
        searchResults: context.documents,
        outputRequirements: {
          answer: questionIntent === "broad-planning"
            ? "Synthesize a practical planning checklist from the searchResults. Do not stay on a single page if multiple documents together explain the flow. Use a short direct answer plus enough structure to cover the minimum complete prep flow. Prefer `핵심 요약`, `반드시 지금 정할 것`, `뒤로 미뤄도 되는 것`, `준비할 항목`, `권장 순서`, `확인`, `주의` blocks or equivalent section headings. Use at least two short sections or one paragraph plus a checklist, and keep the answer actionable."
            : "Natural Korean answer based on the searchResults only. Treat the retrieved pages as source material to synthesize, not as generic template prompts. For setup/configuration questions, make it followable and detailed enough that the user can execute it without guessing: short direct answer, then enough explanation to understand the flow, and separate `바로 할 일`, `예시`, `확인`, `주의` blocks where appropriate. If the question is not trivial, use at least two substantive paragraphs or one paragraph plus steps/code. Do not echo the response schema or raw JSON keys such as confluenceData, unsupportedClaims, or recommendedPages in the visible answer. Use numbered or bulleted lists only for real sequences and checklists, one step per line.",
          confluenceData: "1-2 short evidence quotes from the most relevant supplied searchResults only. Prefer one quote per page that materially supports the answer. These snippets are used to show the user which pages mattered.",
          unsupportedClaims: "List anything not supported by searchResults.",
          recommendedPages: "Recommend only directly relevant supplied searchResults. Use an empty array when none are directly relevant.",
        },
      }),
    },
  ];
}

export function aiAskJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "answer",
      "supportedByContext",
      "confluenceData",
      "unsupportedClaims",
      "suggestedNextPages",
    ],
    properties: {
      answer: { type: "string" },
      supportedByContext: { type: "boolean" },
      confluenceData: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["pageId", "title", "quote"],
          properties: {
            pageId: { type: "string" },
            title: { type: "string" },
            quote: { type: "string" },
          },
        },
      },
      unsupportedClaims: {
        type: "array",
        items: { type: "string" },
      },
      suggestedNextPages: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["pageId", "title", "reason"],
          properties: {
            pageId: { type: "string" },
            title: { type: "string" },
            reason: { type: "string" },
          },
        },
      },
    },
  };
}

export function buildPolicyPromptContext(
  policyDocuments: PolicyDocument[],
  question: string,
  currentPageTitle = "",
  limit = 4,
): PolicyPromptContext {
  const normalizedQuestion = question.trim().toLocaleLowerCase("ko-KR");
  const tokens = tokenizePolicyQuery(question);
  const normalizedPageTitle = currentPageTitle.trim().toLocaleLowerCase("ko-KR");
  const scoredPolicies = policyDocuments
    .map((document) => ({
      document,
      score: scorePolicyDocument(document, normalizedQuestion, normalizedPageTitle, tokens),
    }))
    .filter((item) => item.score > 0)
    .sort((first, second) => second.score - first.score);

  const selectedPolicies = scoredPolicies.slice(0, limit).map(({ document }) => toPolicyPromptDocument(document));

  if (!selectedPolicies.length && policyDocuments.length) {
    selectedPolicies.push(toPolicyPromptDocument(policyDocuments[0]!));
  } else if (selectedPolicies.length && !selectedPolicies.some((policy) => policy.sourceKind === "policy")) {
    const bestPolicyDocument = policyDocuments.find((document) => document.sourceKind === "policy");

    if (bestPolicyDocument) {
      selectedPolicies[selectedPolicies.length - 1] = toPolicyPromptDocument(bestPolicyDocument);
    }
  }

  return {
    policyRules: buildCorePolicyRules(),
    selectedPolicies,
  };
}

export function buildSearchFollowUpQuestion(
  question: string,
  history: ConversationHistoryTurn[] = [],
) {
  const historyText = normalizeConversationHistory(history)
    .slice(-3)
    .map((turn) => {
      return `이전 질문: ${turn.question}`;
    })
    .join(" ");

  return normalizeConversationText([historyText, question].filter(Boolean).join(" "));
}

export function aiSearchJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["answer", "confluenceData", "unsupportedClaims", "recommendedPages"],
    properties: {
      answer: { type: "string" },
      confluenceData: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["pageId", "title", "quote"],
          properties: {
            pageId: { type: "string" },
            title: { type: "string" },
            quote: { type: "string" },
          },
        },
      },
      unsupportedClaims: {
        type: "array",
        items: { type: "string" },
      },
      recommendedPages: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["pageId", "title", "reason"],
          properties: {
            pageId: { type: "string" },
            title: { type: "string" },
            reason: { type: "string" },
          },
        },
      },
    },
  };
}

function toContextDocument(document: WikiDocument): AiAskContextDocument {
  return {
    id: document.id,
    title: document.title,
    category: document.category,
    summary: document.summary,
    ...(document.sourceUrl ? { sourceUrl: document.sourceUrl } : {}),
  };
}

function toPolicyPromptDocument(document: PolicyDocument): PolicyPromptDocument {
  return {
    id: document.id,
    version: document.version,
    title: document.title,
    summary: document.summary,
    ...(document.sourceUrl ? { sourceUrl: document.sourceUrl } : {}),
    sourceKind: document.sourceKind,
  };
}

function buildCorePolicyRules() {
  return [
    "Policy context is mandatory and takes precedence over page content and search matches.",
    "Policy pages are internal-only and must not be exposed directly in the visible answer.",
    "Prefer concise, specific policy guidance over broad or weakly related documents.",
    "If policy and source content conflict, surface the gap instead of guessing.",
  ];
}

function tokenizePolicyQuery(query: string) {
  return query
    .toLocaleLowerCase("ko-KR")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function scorePolicyDocument(
  document: PolicyDocument,
  normalizedQuestion: string,
  normalizedPageTitle: string,
  tokens: string[],
) {
  const haystack = `${document.title} ${document.summary} ${document.contentText}`.toLocaleLowerCase("ko-KR");
  let score = document.sourceKind === "policy" ? 40 : 20;

  if (normalizedQuestion && haystack.includes(normalizedQuestion)) {
    score += 80;
  }

  if (normalizedPageTitle && haystack.includes(normalizedPageTitle)) {
    score += 20;
  }

  for (const token of tokens) {
    if (document.title.toLocaleLowerCase("ko-KR").includes(token)) {
      score += 12;
      continue;
    }

    if (document.summary.toLocaleLowerCase("ko-KR").includes(token)) {
      score += 8;
      continue;
    }

    if (document.contentText.toLocaleLowerCase("ko-KR").includes(token)) {
      score += 4;
    }
  }

  return score;
}

function normalizeConversationHistory(history: ConversationHistoryTurn[]) {
  return history
    .map((turn) => ({
      question: normalizeConversationText(turn.question),
      answer: turn.answer ? normalizeConversationText(turn.answer) : undefined,
    }))
    .filter((turn) => Boolean(turn.question));
}

function normalizeConversationText(value: string) {
  return value.trim().toLocaleLowerCase("ko-KR").replace(/\s+/g, " ");
}

export function classifySearchQuestionIntent(question: string): SearchQuestionIntent {
  const normalized = question.trim().toLocaleLowerCase("ko-KR");

  if (!normalized) {
    return "general";
  }

  if (/(오류|에러|failed|fail|문제|해결|안 되|안되|트러블|troubleshoot)/.test(normalized)) {
    return "troubleshooting";
  }

  if (/(비교|차이|vs|대신|중에|선택|고를|추천)/.test(normalized)) {
    return "comparison";
  }

  if (/(시작하기 전에|준비|설계|계획|먼저 읽|순서|어떤 흐름|체크리스트|무엇을 해야|무엇부터)/.test(normalized)) {
    return "broad-planning";
  }

  if (/(설치|설정|구성|세팅|login|로그인|mcp|cli|연결|연동|enable|configure|setup)/.test(normalized)) {
    return "setup";
  }

  return "general";
}

function getSearchQuestionIntentInstructionLines(questionIntent: SearchQuestionIntent) {
  if (questionIntent === "setup") {
    return [
      "For setup/configuration questions, prefer the structure: direct answer, `바로 할 일`, `예시`, `확인`, `주의`.",
      "When the question asks how to do something, treat a one-paragraph answer as a failure unless the task is truly trivial.",
    ];
  }

  if (questionIntent === "broad-planning") {
    return [
      "For broad planning or preparation questions, synthesize across the relevant searchResults and do not stay tied to a single document if several documents together define the flow.",
      "Prefer the structure: `핵심 요약`, `준비할 항목`, `권장 순서`, `확인`, `주의`.",
      "The answer should feel like a practical checklist, not a narrow doc excerpt.",
      "When the question is about what to decide now versus later, explicitly split the answer into `반드시 지금 정할 것` and `뒤로 미뤄도 되는 것` if that helps the user act quickly.",
      "For planning questions, cover the standard preparation buckets that usually matter in the corpus: 목적/범위, 이해관계자, 요구사항, 환경/권한, 일정, 리스크, 검증, 운영.",
      "If the question mentions approval, reporting, automation, workflow, or implementation flow, include a concrete end-to-end sequence such as trigger -> input -> approval -> generation -> notification -> logging -> verification.",
      "If the documents only cover part of the planning problem, fill the remaining checklist with the best-supported general preparation flow and note the gap briefly in unsupportedClaims.",
    ];
  }

  if (questionIntent === "comparison") {
    return [
      "For comparison questions, compare the options directly, call out tradeoffs, and end with the recommended first choice when the corpus supports one.",
    ];
  }

  if (questionIntent === "troubleshooting") {
    return [
      "For troubleshooting questions, lead with the most likely cause or fix, then give a short verification sequence and fallback checks.",
    ];
  }

  return [
    "When the question is not trivial, use at least two substantive paragraphs or one paragraph plus steps/code.",
  ];
}
