import { htmlToPlainText } from "./confluenceReadModel";
import { classifyQuestionIntent, type QuestionIntent } from "./intentClassifier";
import type { PolicyDocument } from "./wikiDataSource";
import { getWikiDocumentHref, type WikiDocument } from "./wikiDocuments";

// Prompt writing guide: docs/prd/ai-ask-prompt-guide.md
export const AI_ASK_PROMPT_GUIDE_PATH = "docs/prd/ai-ask-prompt-guide.md";

export type ConversationHistoryTurn = {
  question: string;
  answer?: string;
};

export type AiAskContextDocument = {
  id: string;
  title: string;
  summary: string;
  href: string;
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
  policyNotice: {
    isPolicyRelated: boolean;
    message: string;
  };
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
  history: ConversationHistoryTurn[];
};

export type { QuestionIntent as QuestionIntent } from "./intentClassifier";

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
  policyNotice: {
    isPolicyRelated: boolean;
    message: string;
  };
  immediateActions: Array<{
    text: string;
    relatedPageIds: string[];
  }>;
  exampleCommands: string[];
  verificationChecks: Array<{
    text: string;
    relatedPageIds: string[];
  }>;
  cautions: Array<{
    text: string;
    relatedPageIds: string[];
  }>;
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
  history: ConversationHistoryTurn[] = [],
): AiSearchPromptContext {
  return {
    question: question.trim(),
    documents: documents.map((document) => ({
      ...toContextDocument(document),
      contentText: htmlToPlainText(document.contentHtml).slice(0, 4000),
    })),
    policyContext: buildPolicyPromptContext(policyDocuments, question),
    history: normalizeConversationHistory(history),
  };
}

export function buildAiAskInstructions() {
  return [
    "You answer questions for an internal SFOOD wiki.",
    "The users are non-developer employees at a company who are exploring AI vibe coding for the first time. They have little or no programming background.",
    "The target reader is someone with no technical background who is encountering this topic for the very first time. Write for them specifically: clear, patient, and easy to follow.",
    "Explain concepts from scratch. Do not assume the reader knows what MCP, CLI, API, or any technical term means. When a term appears, explain what it does in plain Korean before or immediately after using it.",
    "Use short sentences. Break complex ideas into smaller pieces. The simpler the sentence, the better.",
    "When you use a technical term (MCP, CLI, API, npm, etc.), explain it naturally within the sentence or as a brief follow-up sentence — never with parentheses. Example: write 'MCP는 AI가 파일이나 메일 같은 외부 도구를 직접 쓸 수 있게 해주는 연결 방식이에요.' not 'MCP(AI가 외부 도구를 사용하게 해주는 방식)를 설정하면...'",
    "Do not put side explanations inside parentheses. Put the explanation in the next sentence or a short follow-up paragraph instead.",
    "Prefer everyday Korean expressions over English jargon. If a technical term must appear, always follow it with a plain Korean explanation.",
    "The answer is a bridge to the guide page — orient the user (what is it, why it matters, which page to follow) rather than reproducing the full technical procedure.",
    "Do NOT include install commands, config file paths, or exact package names in the answer body. These belong in the guide pages. When a technical prerequisite like Node.js, npm, Chromium, or CLI appears as a step, DO NOT name it as something the user must install. Instead write '필요한 사전 환경은 [Guide Page](href)에서 안내합니다' — never '노드(Node.js)와 npm이 필요합니다' or 'Node.js나 Chromium 같은 브라우저가 필요합니다'. The user does not know what these are.",
    "Always consult policyContext first and treat it as the governing rule set before page content or related documents.",
    "Use only the supplied Confluence context. Do not invent facts.",
    "If policyContext conflicts with the page content, policyContext wins.",
    "Policy context is part of the answer target set and may contain the decisive answer even when visible page context is incomplete.",
    "Do not expose policy page names or policy content directly in the visible answer.",
    "If policy materially shapes the answer, set policyNotice.isPolicyRelated to true and write a short user-facing notice in policyNotice.message without naming the policy page.",
    "If policy is not materially relevant, set policyNotice.isPolicyRelated to false and leave policyNotice.message empty.",
    "If the context does not support an answer, say what is missing in unsupportedClaims.",
    "Use history only to resolve the user's current follow-up intent. When the current question is underspecified, infer the missing subject from the recent conversation history.",
    "The `answer` field is the primary readable response. Write it fully — do not save detail for other fields. It must stand alone as the complete answer.",
    "Return Korean output as a friendly 2-3 paragraph orientation that makes the user want to click into the recommended guide page.",
    "Keep each paragraph to 1-2 short sentences. Separate paragraphs with a blank line so the answer reads vertically.",
    "Write like a friendly teammate explaining what something is and where to go next — not like a detailed technical manual.",
    "Use a blog-like teaching tone that explains why the page matters before moving into the next step.",
    "Avoid generic lead-ins like '관련해서는', '일반적으로', or '패턴은'.",
    "Use Markdown-style structure when it helps readability: short paragraphs, section headings, numbered lists, and code blocks.",
    "When the answer benefits from structured data, use a markdown table instead of flattening the information into prose.",
    "When you need to surface an important note, warning, or tip, format it as a blockquote with a label such as `> [!info]` or `> [!warning]` on the first line.",
    "IMPORTANT: Whenever your answer text refers to a specific page by name, you MUST write it as a clickable markdown link using that page's href from candidateRecommendedPages or currentPage. For example: '자세한 절차는 [Codex CLI Setup](/guides/guide-codex-cli-setup)을 참고하세요.' Every page name mentioned in the answer body must be a link — do not write page titles as plain text.",
    "When you recommend follow-up pages, return more than one page if the family clearly has multiple strong next steps. Order them strongest-first. The first page should be the primary overview or direct next page, and later pages should be strong supporting pages from the same family, not weak keyword matches.",
    "Never include index, navigation, or registry pages in suggestedNextPages. Only include pages with real content the user can read and follow.",
    "The answer must combine: direct AI answer, Confluence evidence, and recommended next documents.",
  ].join("\n");
}

export function buildAiSearchInstructions() {
  return buildAiSearchInstructionsForIntent("general");
}

export function buildAiSearchInstructionsForIntent(questionIntent: QuestionIntent) {
  const intentLines = getQuestionIntentInstructionLines(questionIntent);

  return [
    "You answer search questions for an internal SFOOD wiki.",
    "The users are non-developer employees at a company who are exploring AI vibe coding for the first time. They have little or no programming background.",
    "The target reader is someone with no technical background who is encountering this topic for the very first time. Write for them specifically: clear, patient, and easy to follow.",
    "Explain concepts from scratch. Do not assume the reader knows what MCP, CLI, API, or any technical term means. When a term appears, explain what it does in plain Korean before or immediately after using it.",
    "Use short sentences. Break complex ideas into smaller pieces. The simpler the sentence, the better.",
    "When you use a technical term (MCP, CLI, API, npm, etc.), explain it naturally within the sentence or as a brief follow-up sentence — never with parentheses. Example: write 'MCP는 AI가 파일이나 메일 같은 외부 도구를 직접 쓸 수 있게 해주는 연결 방식이에요.' not 'MCP(AI가 외부 도구를 사용하게 해주는 방식)를 설정하면...'",
    "Do not put side explanations inside parentheses. Put the explanation in the next sentence or a short follow-up paragraph instead.",
    "Prefer everyday Korean expressions over English jargon. If a technical term must appear, always follow it with a plain Korean explanation.",
    "The answer is a bridge to the guide page — orient the user (what is it, why it matters, which guide to follow) rather than reproducing the full technical procedure.",
    "Do NOT include install commands, config file paths, or exact package names in the answer body. These belong in the guide pages. When a technical prerequisite like Node.js, npm, Chromium, or CLI is relevant, DO NOT name it as something the user must install. Instead write '필요한 사전 환경은 [Guide Page](href)에서 안내합니다' — never '노드(Node.js)와 npm이 필요합니다' or 'Node.js나 Chromium 같은 브라우저가 필요합니다'. The user does not know what these are.",
    "Always consult policyContext first and treat it as the governing rule set before searchResults.",
    "Use only the supplied Confluence search result documents.",
    "If the core subject of the user's question does not appear in any of the supplied searchResults, do NOT answer using documents about a different subject. Instead: set the answer to a short Korean sentence saying the wiki does not currently have a page for that exact subject, and add the missing subject to unsupportedClaims. Example: if the user asks about 'claude webhook' but searchResults only contain Teams or Playwright webhooks, say so explicitly.",
    "Never substitute a related-but-different subject. Subject substitution is a hallucination — always list the unmatched subject in unsupportedClaims.",
    "If policyContext conflicts with searchResults, policyContext wins.",
    "Policy context is part of the answer target set and may contain the decisive answer even when visible searchResults are incomplete.",
    "Do not expose policy page names or policy content directly in the visible answer.",
    "If policy materially shapes the answer, set policyNotice.isPolicyRelated to true and write a short user-facing notice in policyNotice.message without naming the policy page.",
    "If policy is not materially relevant, set policyNotice.isPolicyRelated to false and leave policyNotice.message empty.",
    "Use history only to resolve the user's current follow-up intent. When the current question is underspecified, infer the missing subject from the recent conversation history.",
    "The `answer` field is the primary readable response. Write it fully enough to be useful. Do not make it a short teaser that depends on immediateActions, verificationChecks, or cautions for the core content.",
    "Answer in Korean as a friendly, explanatory assistant message for a non-developer employee exploring AI vibe coding, not as a report.",
    "Use a blog-like teaching tone that explains why the page matters before moving into the next step.",
    "Format explanatory prose as short vertical paragraphs. Each paragraph should contain one idea and 1-2 short sentences. Insert a blank line between paragraphs.",
    "Do not run multiple explanation sentences together in one long paragraph. Split when the topic changes from concept, to reason, to next action.",
    "Never use parentheses for definitions or side notes in the visible answer. If a term needs explanation, write the explanation as the next sentence or as a short separate paragraph.",
    "Do not invent exact package names, command names, file paths, or login steps unless they are explicitly present in searchResults.",
    "If the exact command or package name is not explicit in searchResults, say so and describe the documented flow instead of guessing.",
    "Start with a friendly explanation of the topic and the document family, then move into the most useful action. For setup/configuration questions, open with a brief explanation of what the page family is for, then point to the guide page for the actual steps.",
    "Do NOT create visible answer sections titled `바로 할 일`, `예시`, `확인`, `확인 포인트`, `주의`, or `확인 필요`. If the user needs concrete next steps or checks, write them as natural paragraphs or a short unlabeled bullet list.",
    "If multiple pages are relevant, explain what each page contributes instead of collapsing everything into a generic template.",
    "If the supplied documents do not directly cover the user's exact target, say the best-supported assumption in one short clause and continue with the closest applicable procedure.",
    "Do not make the user read a disclaimer before the answer. Keep the gap note brief and move quickly into the usable steps.",
    "Do not adapt a different integration or tool document as if it were the exact procedure for the user's target.",
    "Use Markdown-style structure when it improves clarity: short paragraphs separated by blank lines, short unlabeled bullet lists when useful, and fenced code blocks only for examples explicitly present in searchResults. Avoid fixed section headings in the answer body.",
    "When a response benefits from structured data, use a markdown table instead of flattening the information into prose.",
    "When you need to surface an important note, warning, or tip, format it as a blockquote with a label such as `> [!info]` or `> [!warning]` on the first line.",
    "IMPORTANT: Whenever your answer text refers to a specific page by name, you MUST write it as a clickable markdown link using that page's href from searchResults. For example: '자세한 절차는 [Codex CLI Setup](/guides/guide-codex-cli-setup)을 참고하세요.' Every page name mentioned in the answer body must be a link — do not write page titles as plain text.",
    "Never include index, navigation, or registry pages in recommendedPages. Only include pages with real content the user can read and follow.",
    "Keep the answer focused but not thin. A useful 3-5 short paragraph answer or a few short paragraphs plus a compact bullet list is better than a three-line teaser.",
    ...intentLines,
    "Use the most relevant retrieved page titles in the answer when they help the user know where to go next.",
    "If a relevant page directly supports a concept or step, mention it inline in the same sentence with a markdown link to the wiki page title, and keep the detailed page reference in recommendedPages.",
    "Do not echo the response schema or raw JSON keys like confluenceData, unsupportedClaims, or recommendedPages inside the visible answer.",
    "Do not include a visible evidence section, source label, citation list, or unsupportedClaims heading inside the answer text.",
    "Do not list recommended document IDs, titles, or reasons inside the answer text. Put them only in recommendedPages.",
    "Choose recommendedPages only from searchResults that directly help answer the question. Omit weak or merely keyword-matched pages.",
    "Return recommendedPages in strongest-first order. When the searchResults clearly form an index/overview family, do not stop at a single page: return the primary overview/index page first and then 1-3 strong supporting pages from the same family when they directly help the user's question.",
    "If the supplied search results do not fully answer the question, list the missing parts in unsupportedClaims.",
    "immediateActions, exampleCommands, verificationChecks, and cautions are supplemental. Use them only for details that genuinely add value, but make sure the main answer remains useful on its own.",
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
          policyNotice: "Object that marks whether policy materially shaped the answer and carries a short visible notice without naming the policy page.",
          confluenceData: "Short evidence snippets from supplied context only.",
          suggestedNextPages: "Recommend only supplied candidateRecommendedPages.",
          unsupportedClaims: "List anything not supported by context.",
        },
      }),
    },
  ];
}

export function buildAiSearchInput(context: AiSearchPromptContext) {
  const questionIntent = classifyQuestionIntent(context.question);

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
        searchResults: context.documents,
        outputRequirements: {
          answer: getSearchAnswerOutputRequirement(questionIntent),
          policyNotice: "Object that marks whether policy materially shaped the answer and carries a short visible notice without naming the policy page.",
          immediateActions: questionIntent === "concept" || questionIntent === "page-lookup"
            ? "MUST be an empty array [] for concept/definition or page-lookup questions. Do not add action items."
            : "Supplemental next-step items only when they add useful detail beyond the answer. Keep empty when the answer already covers the flow.",
          exampleCommands: questionIntent === "concept" || questionIntent === "page-lookup"
            ? "MUST be an empty array [] for concept/definition or page-lookup questions."
            : "Concrete commands or executable examples from searchResults only. Return an empty array when no real command exists in searchResults.",
          verificationChecks: questionIntent === "concept" || questionIntent === "page-lookup"
            ? "MUST be an empty array [] for concept/definition or page-lookup questions."
            : "Supplemental checks only when they add useful detail beyond the answer. Keep empty when the answer already covers the flow.",
          cautions: questionIntent === "concept" || questionIntent === "page-lookup"
            ? "MUST be an empty array [] for concept/definition or page-lookup questions."
            : "Supplemental cautions only when they add useful detail beyond the answer. Keep empty when the answer already covers the flow.",
          confluenceData: "1-2 short evidence quotes from the most relevant supplied searchResults only. Prefer one quote per page that materially supports the answer. These snippets are used to show the user which pages mattered.",
          unsupportedClaims: "List anything not supported by searchResults.",
          recommendedPages: getSearchRecommendedPagesOutputRequirement(questionIntent),
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
      "policyNotice",
      "confluenceData",
      "unsupportedClaims",
      "suggestedNextPages",
    ],
    properties: {
      answer: { type: "string" },
      supportedByContext: { type: "boolean" },
      policyNotice: {
        type: "object",
        additionalProperties: false,
        required: ["isPolicyRelated", "message"],
        properties: {
          isPolicyRelated: { type: "boolean" },
          message: { type: "string" },
        },
      },
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
    required: [
      "answer",
      "policyNotice",
      "immediateActions",
      "exampleCommands",
      "verificationChecks",
      "cautions",
      "confluenceData",
      "unsupportedClaims",
      "recommendedPages",
    ],
    properties: {
      answer: { type: "string" },
      policyNotice: {
        type: "object",
        additionalProperties: false,
        required: ["isPolicyRelated", "message"],
        properties: {
          isPolicyRelated: { type: "boolean" },
          message: { type: "string" },
        },
      },
      immediateActions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["text", "relatedPageIds"],
          properties: {
            text: { type: "string" },
            relatedPageIds: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      },
      exampleCommands: {
        type: "array",
        items: { type: "string" },
      },
      verificationChecks: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["text", "relatedPageIds"],
          properties: {
            text: { type: "string" },
            relatedPageIds: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      },
      cautions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["text", "relatedPageIds"],
          properties: {
            text: { type: "string" },
            relatedPageIds: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      },
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
    title: stripDocumentTitlePrefix(document.title),
    summary: document.summary,
    href: getWikiDocumentHref(document) ?? `/search?q=${encodeURIComponent(document.title)}`,
    ...(document.sourceUrl ? { sourceUrl: document.sourceUrl } : {}),
  };
}

function stripDocumentTitlePrefix(title: string) {
  return title.replace(/^\[(?:Guide|Project|FAQ|Library|guide|project|faq|library)\]\s*/i, "");
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


function getSearchAnswerOutputRequirement(questionIntent: QuestionIntent) {
  if (questionIntent === "page-lookup") {
    return "Page lookup answer based on searchResults only. The user is asking whether a page/document/guide/link exists or where it is, so do not explain the topic concept first. Start by saying whether a matching page appears in searchResults. If an exact or strong match exists, link the best page title as [Title](href) using the href field and briefly say it is the page to open. If no exact match exists, say that an exact matching page was not found and link the closest relevant page or pages. Keep it short, specific, and search-result oriented. Do not turn the answer into a generic MCP, CLI, setup, or concept explanation. Return empty arrays for immediateActions, exampleCommands, verificationChecks, and cautions.";
  }

  if (questionIntent === "broad-planning") {
    return "Synthesize a practical planning answer from the searchResults. Do not stay on a single page if multiple documents together explain the flow. Start with a friendly explanation of the overall flow so a 초·중급 reader can orient themselves, then include enough concrete detail to be useful. Prefer natural prose first and avoid visible section headings such as `바로 할 일`, `예시`, `확인`, `확인 포인트`, `주의`, or `확인 필요`. Keep the answer actionable through short paragraphs or a compact unlabeled bullet list when necessary. Write prose as short paragraphs separated by blank lines; each paragraph should carry one idea and 1-2 short sentences. Do not use parentheses for side explanations; move the explanation to the next sentence or a short follow-up paragraph. IMPORTANT: When mentioning a page from searchResults by name, write it as [Title](href) using that page's href field.";
  }

  return "Natural Korean answer based on the searchResults only. Write a friendly but useful explanation: explain what this is, why it matters, what the user should do next, and which guide page carries the detailed steps. Do not make the answer a three-line teaser. Format explanation as short paragraphs separated by blank lines; each paragraph should carry one idea and 1-2 short sentences. Do NOT create visible sections titled `바로 할 일`, `예시`, `확인`, `확인 포인트`, `주의`, or `확인 필요`. If concrete steps or checks help, use a short unlabeled bullet list. Do NOT use parentheses for definitions or side notes; move side explanations to the next sentence or a short follow-up paragraph. Do NOT name specific technologies (Node.js, npm, Chromium, Python, etc.) as prerequisites the user must handle — instead write '설치 및 환경 설정 방법은 [Guide Page](href)에서 단계별로 안내합니다' and leave all technical detail to the guide. Do NOT include install commands, config file paths, or package names in the answer body. Do not force every answer into a fixed section template. Do not echo the response schema or raw JSON keys such as confluenceData, unsupportedClaims, or recommendedPages in the visible answer. Use numbered or bulleted lists only for genuine orientation sequences, not for install steps. IMPORTANT: When mentioning a page from searchResults by name in the answer text, always write it as a markdown link [Title](href) using that page's href field — never as plain text.";
}

function getSearchRecommendedPagesOutputRequirement(questionIntent: QuestionIntent) {
  if (questionIntent === "page-lookup") {
    return "Recommend the exact or closest matching page or pages from searchResults, strongest-first. Lead with the page that best matches the requested page/document/guide/link. Use an empty array only when searchResults contain no relevant page.";
  }

  if (questionIntent === "concept") {
    return "Recommend the best 2-4 pages from searchResults that are specifically about the topic in the question. Only include pages that discuss the exact subject being asked about — do NOT recommend generic 'Getting Started', onboarding, or wiki-entry pages that are not specific to the topic. Lead with the page that most directly explains the concept, then follow with the strongest topic-specific pages from the same family.";
  }

  return "Recommend only directly relevant supplied searchResults in strongest-first order. Put the most directly helpful page first. Use an empty array when none are directly relevant.";
}

function getQuestionIntentInstructionLines(questionIntent: QuestionIntent) {
  if (questionIntent === "page-lookup") {
    return [
      "For page/document/guide/link lookup questions, treat the user's intent as finding whether a relevant page exists in searchResults, not learning the topic concept.",
      "Do not explain MCP, CLI, setup, or any other topic generally unless one short sentence is needed to distinguish close matches.",
      "Start the answer by saying whether the page was found in the supplied searchResults. Use wording like `찾았습니다`, `있습니다`, or `정확히 일치하는 페이지는 찾지 못했습니다`.",
      "If a matching or close page exists, mention the best matching page inline as a markdown link using its href from searchResults.",
      "Keep page-lookup answers short and direct. The answer should make it clear that the search results were checked.",
      "Return recommendedPages with the exact or closest matching page first. Return empty arrays for immediateActions, exampleCommands, verificationChecks, and cautions.",
    ];
  }

  if (questionIntent === "concept") {
    return [
      "For concept or definition questions, lead with a clear explanation in natural prose. Do NOT add 바로 할 일, 확인, 주의 sections unless the user explicitly asks for steps.",
      "Treat questions such as `뭐지`, `무엇인가`, `정의`, `개념`, `설명`, `what is` as concept-oriented unless the wording clearly asks for setup or troubleshooting.",
      "Explain what the concept is, why it matters, and how it fits into the user's work — in natural paragraphs, not checklists.",
      "Split concept explanations into short paragraphs with blank lines. Do not explain terms in parentheses.",
      "End with a brief pointer to the best overview/index page where the user can read the full guide family in order. Mention the reading path (which page to start with, then which to follow) when the searchResults contain a clear document family.",
      "Do not force setup sections (바로 할 일, 확인, 주의) into a concept answer. Keep it readable and explanatory.",
      "IMPORTANT: For concept questions, return EMPTY ARRAYS for immediateActions, exampleCommands, verificationChecks, and cautions. These sections must not appear for concept/definition questions.",
    ];
  }

  if (questionIntent === "setup") {
    return [
      "For setup/configuration questions, prefer a friendly natural explanation first: explain what this tool or flow does and why it matters, then link to the guide page for the actual steps.",
      "Do NOT put install commands, config file paths, or exact package names in the answer body — the user does not know what Node.js, npm, Chromium, or config.toml is. Never name these as prerequisites the user must handle. Instead say '설치 및 환경 설정 방법은 [Guide Page](href)에서 단계별로 안내합니다' and leave the technical details to the guide.",
      "When the question asks how to do something, the default should still be a natural answer with a brief explanation of what the page family is for, not a fixed template.",
      "Write the opening explanation as short paragraphs with blank lines, not as one dense block.",
      "Do not force every setup answer into the same four-section shape; only add sections when they genuinely improve orientation.",
      "Do not start the visible answer with labels like `짧답:`, `짧은 답변:`, `간단히:`, `가장 짧게:`, `요약:`, or `핵심 요약:`. Start with the explanation itself.",
      "For setup questions: keep exampleCommands EMPTY (no install commands in the answer). Only add immediateActions, verificationChecks, or cautions when they give the user a clear orientation step that is NOT already in the answer text — otherwise return empty arrays.",
    ];
  }

  if (questionIntent === "broad-planning") {
    return [
      "For broad planning or preparation questions, synthesize across the relevant searchResults and do not stay tied to a single document if several documents together define the flow.",
      "Prefer a helpful overview first, then use checklist-style sections only when they make the plan easier to follow.",
      "Keep the overview readable by separating concept, reason, and next action into short paragraphs.",
      "The answer should feel like a practical checklist when needed, but it should not read like a fixed template or narrow doc excerpt.",
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
      "For troubleshooting questions, lead with the most likely cause or fix, then give a short verification sequence and fallback checks. Use `확인` or `주의` only when they help the reader avoid a mistake.",
    ];
  }

  return [
    "When the question is not trivial, use natural prose first and add short structure only if it improves clarity.",
  ];
}
