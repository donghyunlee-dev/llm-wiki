export type StructuredAnswerBlock =
  | { type: "heading"; text: string; level: 2 | 3 | 4 }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "quote"; text: string }
  | { type: "code"; language?: string; code: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "callout"; kind: "info" | "warning" | "tip" | "note" | "success"; title?: string; body: string };

export function normalizeAnswerText(text: string) {
  const trimmed = text.trim();

  if (!trimmed.startsWith("{")) {
    return stripStructuredResponseArtifacts(trimmed);
  }

  const rawResult = normalizeStructuredJsonLikeText(trimmed);
  if (rawResult !== null) {
    return rawResult;
  }

  const unescaped = maybeUnescapeJsonLikeText(trimmed);
  if (unescaped !== trimmed) {
    const unescapedResult = normalizeStructuredJsonLikeText(unescaped);
    if (unescapedResult !== null) {
      return unescapedResult;
    }
  }

  return stripStructuredResponseArtifacts(trimmed);
}

export function filterVisibleAnswerBlocks(blocks: StructuredAnswerBlock[]) {
  const visibleBlocks: StructuredAnswerBlock[] = [];
  let hiddenSectionLevel: 2 | 3 | 4 | null = null;

  for (const block of blocks) {
    if (block.type === "heading") {
      if (shouldHideAnswerBlock(block.text)) {
        hiddenSectionLevel = block.level;
        continue;
      }

      if (hiddenSectionLevel !== null && block.level <= hiddenSectionLevel) {
        hiddenSectionLevel = null;
      }

      if (hiddenSectionLevel === null) {
        visibleBlocks.push(block);
      }

      continue;
    }

    if (hiddenSectionLevel !== null) {
      continue;
    }

    if (shouldHideAnswerBlock(blockText(block))) {
      hiddenSectionLevel = 4;
      continue;
    }

    visibleBlocks.push(block);
  }

  return visibleBlocks;
}

function normalizeStructuredJsonLikeText(text: string) {
  const answerFieldMatch = text.match(/^\{\s*"answer"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
  if (answerFieldMatch?.[1]) {
    try {
      const decoded = JSON.parse(`"${answerFieldMatch[1]}"`) as string;
      return stripStructuredResponseArtifacts(decoded);
    } catch {
      // Fall back to the JSON object path below.
    }
  }

  const cleaned = stripStructuredResponseArtifacts(text);

  if (!cleaned.startsWith("{")) {
    return cleaned;
  }

  const candidate = extractBalancedJsonObjectText(cleaned) ?? cleaned;

  try {
    const parsed = JSON.parse(candidate) as Record<string, unknown>;

    if (typeof parsed.answer === "string") {
      return stripStructuredResponseArtifacts(parsed.answer);
    }
  } catch {
    return null;
  }

  return null;
}

function maybeUnescapeJsonLikeText(text: string) {
  if (!text.startsWith("{") || (!text.includes('\\"') && !text.includes("\\n"))) {
    return text;
  }

  return text
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n")
    .replace(/\\\\/g, "\\");
}

function extractBalancedJsonObjectText(text: string) {
  const startIndex = text.indexOf("{");

  if (startIndex < 0) {
    return null;
  }

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

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return text.slice(startIndex, index + 1);
      }
    }
  }

  return null;
}

export function stripStructuredResponseArtifacts(text: string) {
  let cleaned = text.replace(/\r\n/g, "\n");

  const artifactMarkers = [
    "\nconfluenceData\n",
    "\nunsupportedClaims\n",
    "\nrecommendedPages\n",
    "\nrecommendedDocuments\n",
    "\nguideDocuments\n",
  ];

  for (const marker of artifactMarkers) {
    const markerIndex = cleaned.indexOf(marker);

    if (markerIndex >= 0) {
      cleaned = cleaned.slice(0, markerIndex).trimEnd();
    }
  }

  cleaned = cleaned.replace(/\s*PMID:.*$/s, "").trim();

  return cleaned;
}

export function splitAnswerBlocks(text: string): StructuredAnswerBlock[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: StructuredAnswerBlock[] = [];
  let paragraphLines: string[] = [];
  let listState: { ordered: boolean; items: string[]; originalLines: string[] } | null = null;
  let quoteLines: string[] = [];
  let codeState: { language?: string; codeLines: string[] } | null = null;

  const flushParagraph = () => {
    const paragraph = paragraphLines.join(" ").trim();

    if (paragraph) {
      blocks.push({ type: "paragraph", text: paragraph });
    }

    paragraphLines = [];
  };

  const flushList = () => {
    if (listState?.items.length) {
      if (listState.ordered && listState.items.length < 2) {
        blocks.push({ type: "paragraph", text: listState.originalLines[0] ?? listState.items[0] });
      } else {
        blocks.push({ type: "list", ordered: listState.ordered, items: listState.items });
      }
    }

    listState = null;
  };

  const flushQuote = () => {
    const quote = quoteLines.join(" ").trim();

    if (quote) {
      const callout = parseCalloutQuote(quote);

      if (callout) {
        blocks.push(callout);
        quoteLines = [];
        return;
      }

      blocks.push({ type: "quote", text: quote });
    }

    quoteLines = [];
  };

  const flushCode = () => {
    if (codeState) {
      blocks.push({
        type: "code",
        language: codeState.language,
        code: codeState.codeLines.join("\n"),
      });
    }

    codeState = null;
  };

  const flushAllText = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index] ?? "";
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (codeState) {
      if (/^```/.test(trimmed)) {
        flushCode();
      } else {
        codeState.codeLines.push(line);
      }

      continue;
    }

    if (isTableStart(lines, index)) {
      flushAllText();
      const { table, nextIndex } = parseTableBlock(lines, index);
      blocks.push(table);
      index = nextIndex;
      continue;
    }

    if (!trimmed) {
      flushAllText();
      continue;
    }

    const fenceMatch = trimmed.match(/^```(\w+)?\s*$/);
    if (fenceMatch) {
      flushAllText();
      codeState = { language: fenceMatch[1], codeLines: [] };
      continue;
    }

    const headingMatch = trimmed.match(/^(#{2,4})\s+(.*)$/);
    if (headingMatch) {
      flushAllText();
      const level = Math.min(4, headingMatch[1].length) as 2 | 3 | 4;
      blocks.push({ type: "heading", level, text: headingMatch[2].trim() });
      continue;
    }

    const quoteMatch = trimmed.match(/^>\s+(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      quoteLines.push(quoteMatch[1].trim());
      continue;
    }

    const listMatch = trimmed.match(/^([-*•])\s+(.*)$/) ?? trimmed.match(/^(\d+)[.)]\s+(.*)$/);
    if (listMatch) {
      const isNumberedLine = /^\d+[.)]\s+/.test(trimmed);
      if (isNumberedLine && /\s\d+[.)]\s+/.test(trimmed)) {
        flushList();
        paragraphLines.push(trimmed);
        continue;
      }

      flushParagraph();
      flushQuote();
      const ordered = listMatch[0].match(/^\d+[.)]\s+/) !== null;
      const item = listMatch[2].trim();

      if (!listState || listState.ordered !== ordered) {
        flushList();
        listState = { ordered, items: [], originalLines: [] };
      }

      listState.originalLines.push(trimmed);
      listState.items.push(item);
      continue;
    }

    flushList();
    flushQuote();
    paragraphLines.push(trimmed);
  }

  flushAllText();
  flushCode();

  return blocks;
}

function isTableStart(lines: string[], index: number) {
  const current = lines[index]?.trim() ?? "";
  const next = lines[index + 1]?.trim() ?? "";

  if (!current.startsWith("|") || !next) {
    return false;
  }

  return isTableRow(current) && isTableDelimiter(next);
}

function parseTableBlock(lines: string[], startIndex: number) {
  const rows: string[][] = [];
  let index = startIndex;

  const headerLine = lines[index]?.trim() ?? "";

  rows.push(parseTableRow(headerLine));
  index += 2;

  while (index < lines.length) {
    const line = lines[index]?.trim() ?? "";

    if (!line || !isTableRow(line)) {
      break;
    }

    rows.push(parseTableRow(line));
    index += 1;
  }

  return {
    table: {
      type: "table" as const,
      headers: rows[0] ?? [],
      rows: rows.slice(1),
    },
    nextIndex: index - 1,
  };
}

function isTableRow(line: string) {
  return /^\|.*\|$/.test(line) && line.split("|").length >= 3;
}

function isTableDelimiter(line: string) {
  return /^\|?[\s:-]+\|[\s|:-]*$/.test(line) && line.includes("-");
}

function parseTableRow(line: string) {
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function parseCalloutQuote(quote: string): StructuredAnswerBlock | null {
  const lines = quote.replace(/\r\n/g, "\n").split("\n").map((line) => line.trim()).filter(Boolean);
  const firstLine = lines[0] ?? "";
  const match = firstLine.match(/^\[!(info|warning|tip|note|success)\]\s*(.*)$/i);

  if (!match) {
    return null;
  }

  const kind = match[1].toLowerCase() as "info" | "warning" | "tip" | "note" | "success";
  const body = [match[2]?.trim(), ...lines.slice(1)].filter(Boolean).join(" ").trim();

  const callout: StructuredAnswerBlock = {
    type: "callout",
    kind,
    body,
  };

  return callout;
}

function blockText(block: StructuredAnswerBlock) {
  switch (block.type) {
    case "heading":
    case "paragraph":
    case "quote":
      return block.text;
    case "list":
      return block.items.join(" ");
    case "code":
      return block.code;
    case "table":
      return [...block.headers, ...block.rows.flat()].join(" ");
    case "callout":
      return [block.title, block.body].filter(Boolean).join(" ");
  }
}

function shouldHideAnswerBlock(text: string) {
  const key = normalizeSemanticKey(text);

  if (!key) {
    return false;
  }

  return [
    "핵심인용",
    "문서근거",
    "문서인용",
    "근거인용",
    "출처",
    "참고자료",
    "지원되는환경",
    "지원환경",
    "지원가능환경",
    "지원대상",
    "supportedenvironment",
    "supportedenvironment",
    "supportedscenarios",
    "citation",
    "citations",
    "evidence",
    "source",
    "sources",
    "references",
    "unsupported",
    "unsupportedclaims",
    "지원되지않는항목",
    "지원불가항목",
  ].some((needle) => key.includes(needle));
}

function normalizeSemanticKey(text: string) {
  return text
    .toLocaleLowerCase("ko-KR")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}
