export type ParsedAiSearchResult = {
  answer: string;
  policyNotice: {
    isPolicyRelated: boolean;
    message: string;
    sources: Array<{
      id: string;
      title: string;
      href: string;
    }>;
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

export function parseAiSearchResponseText(responseText: string): ParsedAiSearchResult {
  const candidates = [responseText, extractJsonObjectText(responseText)];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    try {
      const parsed = JSON.parse(candidate) as Record<string, unknown>;
      const looksLikeSearchPayload =
        typeof parsed.answer === "string" ||
        "confluenceData" in parsed ||
        "unsupportedClaims" in parsed ||
        "recommendedPages" in parsed ||
        "policyNotice" in parsed;

      if (!looksLikeSearchPayload || typeof parsed.answer !== "string") {
        continue;
      }

      return {
        answer: normalizeAiSearchAnswerText(parsed.answer),
        policyNotice: normalizePolicyNotice(parsed.policyNotice),
        immediateActions: normalizeActionItems(parsed.immediateActions),
        exampleCommands: normalizeStringArray(parsed.exampleCommands),
        verificationChecks: normalizeActionItems(parsed.verificationChecks),
        cautions: normalizeActionItems(parsed.cautions),
        confluenceData: normalizeConfluenceData(parsed.confluenceData),
        unsupportedClaims: normalizeStringArray(parsed.unsupportedClaims),
        recommendedPages: normalizeRecommendedPages(parsed.recommendedPages),
      };
    } catch {
      continue;
    }
  }

  const recovered = recoverAiSearchResultFromLabeledText(responseText);

  return recovered ?? {
    answer: normalizeAiSearchAnswerText(responseText),
    policyNotice: {
      isPolicyRelated: false,
      message: "",
      sources: [],
    },
    immediateActions: [],
    exampleCommands: [],
    verificationChecks: [],
    cautions: [],
    confluenceData: [],
    unsupportedClaims: ["AI search response could not be parsed into the expected JSON shape."],
    recommendedPages: [],
  };
}

export function normalizePolicyNotice(value: unknown) {
  if (!value || typeof value !== "object") {
    return {
      isPolicyRelated: false,
      message: "",
      sources: [],
    };
  }

  const record = value as Record<string, unknown>;

  return {
    isPolicyRelated: record.isPolicyRelated === true,
    message: typeof record.message === "string" ? record.message.trim() : "",
    sources: normalizePolicyNoticeSources(record.sources),
  };
}

function normalizePolicyNoticeSources(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : "",
      title: typeof item.title === "string" ? item.title : "",
      href: typeof item.href === "string" ? item.href : "",
    }))
    .filter((item) => item.id && item.title && item.href)
    .slice(0, 4);
}

export function extractJsonObjectText(text: string) {
  const startIndex = text.indexOf("{");

  if (startIndex < 0) {
    return "";
  }

  return extractBalancedFragment(text, startIndex, "{", "}") ?? "";
}

export function normalizeAiSearchAnswerText(text: string) {
  const trimmed = text.trim();
  const candidates = [trimmed, maybeUnescapeAiSearchJsonText(trimmed)];

  for (const candidate of candidates) {
    const answerFieldMatch = candidate.match(/^\{\s*"answer"\s*:\s*"((?:[^"\\]|\\.)*)"/s);

    if (answerFieldMatch?.[1]) {
      try {
        const decoded = JSON.parse(`"${answerFieldMatch[1]}"`) as string;
        return stripLeakedSchemaSections(decoded);
      } catch {
        // Fall through to object parsing.
      }
    }

    const nestedCandidate = extractJsonObjectText(candidate);

    if (!nestedCandidate) {
      continue;
    }

    try {
      const parsed = JSON.parse(nestedCandidate) as Record<string, unknown>;

      if (typeof parsed.answer === "string") {
        return stripLeakedSchemaSections(parsed.answer);
      }
    } catch {
      continue;
    }
  }

  return stripLeakedSchemaSections(trimmed);
}

function recoverAiSearchResultFromLabeledText(text: string): ParsedAiSearchResult | null {
  const answer = extractAnswerBeforeLabeledSections(text);
  const policyNotice = parseLabeledObject(text, "policyNotice");
  const confluenceData = parseLabeledArray(text, "confluenceData");
  const unsupportedClaims = parseLabeledArray(text, "unsupportedClaims");
  const recommendedPages = parseLabeledArray(text, "recommendedPages");

  const hasRecoveredFields =
    Boolean(answer) ||
    Boolean(policyNotice) ||
    Array.isArray(confluenceData) ||
    Array.isArray(unsupportedClaims) ||
    Array.isArray(recommendedPages);

  if (!hasRecoveredFields) {
    return null;
  }

  return {
    answer: normalizeAiSearchAnswerText(answer || text),
    policyNotice: normalizePolicyNotice(policyNotice),
    immediateActions: normalizeActionItems(parseLabeledArray(text, "immediateActions")),
    exampleCommands: normalizeStringArray(parseLabeledArray(text, "exampleCommands")),
    verificationChecks: normalizeActionItems(parseLabeledArray(text, "verificationChecks")),
    cautions: normalizeActionItems(parseLabeledArray(text, "cautions")),
    confluenceData: normalizeConfluenceData(confluenceData),
    unsupportedClaims: normalizeStringArray(unsupportedClaims),
    recommendedPages: normalizeRecommendedPages(recommendedPages),
  };
}

function extractAnswerBeforeLabeledSections(text: string) {
  const markers = [
    /\n\s*policyNotice\s*:/,
    /\n\s*immediateActions\s*:/,
    /\n\s*exampleCommands\s*:/,
    /\n\s*verificationChecks\s*:/,
    /\n\s*cautions\s*:/,
    /\n\s*confluenceData\s*:/,
    /\n\s*unsupportedClaims\s*:/,
    /\n\s*recommendedPages\s*:/,
  ];

  const indexes = markers
    .map((pattern) => {
      const match = pattern.exec(text);
      return match?.index ?? -1;
    })
    .filter((index) => index >= 0);

  if (!indexes.length) {
    return text;
  }

  return text.slice(0, Math.min(...indexes));
}

function stripLeakedSchemaSections(text: string) {
  let cleaned = text.trim();
  cleaned = stripVisibleAnswerPrefix(cleaned);
  const markers = [
    /\n\s*policyNotice\s*:/,
    /\n\s*immediateActions\s*:/,
    /\n\s*exampleCommands\s*:/,
    /\n\s*verificationChecks\s*:/,
    /\n\s*cautions\s*:/,
    /\n\s*confluenceData\s*:/,
    /\n\s*unsupportedClaims\s*:/,
    /\n\s*recommendedPages\s*:/,
  ];

  for (const pattern of markers) {
    const match = pattern.exec(cleaned);

    if (match?.index !== undefined && match.index >= 0) {
      cleaned = cleaned.slice(0, match.index).trimEnd();
    }
  }

  cleaned = cleaned.replace(/_invalid_markdown_error_for_ui_providers_due_to_schema_json\s*$/s, "").trim();

  return cleaned;
}

function stripVisibleAnswerPrefix(text: string) {
  return text.replace(/^\s*(짧답|짧은 답변|간단히|가장 짧게|요약|핵심 요약)\s*:\s*/i, "");
}

function parseLabeledObject(text: string, label: string) {
  const index = text.search(new RegExp(`\\b${label}\\s*:`));

  if (index < 0) {
    return null;
  }

  const colonIndex = text.indexOf(":", index);
  const objectStart = text.indexOf("{", colonIndex);

  if (objectStart < 0) {
    return null;
  }

  const objectText = extractBalancedFragment(text, objectStart, "{", "}");

  if (!objectText) {
    return null;
  }

  try {
    return JSON.parse(objectText) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function parseLabeledArray(text: string, label: string) {
  const index = text.search(new RegExp(`\\b${label}\\s*:`));

  if (index < 0) {
    return null;
  }

  const colonIndex = text.indexOf(":", index);
  const arrayStart = text.indexOf("[", colonIndex);

  if (arrayStart < 0) {
    return null;
  }

  const arrayText = extractBalancedFragment(text, arrayStart, "[", "]");

  if (!arrayText) {
    return null;
  }

  try {
    return JSON.parse(arrayText) as unknown[];
  } catch {
    return null;
  }
}

function extractBalancedFragment(text: string, startIndex: number, openChar: "{" | "[", closeChar: "}" | "]") {
  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index] ?? "";

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === openChar) {
      depth += 1;
      continue;
    }

    if (char === closeChar) {
      depth -= 1;

      if (depth === 0) {
        return text.slice(startIndex, index + 1);
      }
    }
  }

  return null;
}

function maybeUnescapeAiSearchJsonText(text: string) {
  if (!text.includes('\\"') && !text.includes("\\n") && !text.includes("\\\\")) {
    return text;
  }

  return text.replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\\\/g, "\\");
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string").map((item) => item.trim());
}

function normalizeActionItems(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      text: typeof item.text === "string" ? item.text.trim() : "",
      relatedPageIds: Array.isArray(item.relatedPageIds)
        ? item.relatedPageIds.filter((pageId): pageId is string => typeof pageId === "string")
        : [],
    }))
    .filter((item) => item.text);
}

function normalizeConfluenceData(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      pageId: typeof item.pageId === "string" ? item.pageId : "",
      title: typeof item.title === "string" ? item.title : "",
      quote: typeof item.quote === "string" ? item.quote : "",
    }))
    .filter((item) => item.pageId && item.title && item.quote);
}

function normalizeRecommendedPages(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      pageId: typeof item.pageId === "string" ? item.pageId : "",
      title: typeof item.title === "string" ? item.title : "",
      reason: typeof item.reason === "string" ? item.reason : "",
    }))
    .filter((item) => item.pageId && item.title && item.reason);
}
