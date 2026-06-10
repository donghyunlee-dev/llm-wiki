import type { WikiDocument } from "./wikiDocuments";

export type RawConfluencePage = {
  id: string;
  parentId?: string;
  title: string;
  spaceId: string;
  status: "current" | string;
  version: number;
  bodyHtml: string;
  sourceUrl: string;
  metadata: {
    docType: "guide" | "page" | "faq" | "library" | "policy" | "nav" | "ops" | "playbook";
    audience: "beginner" | "intermediate" | "advanced";
    status: "draft" | "reviewed" | "published";
    prerequisites: string[];
    next: string[];
    related: string[];
  };
  updatedAt: string;
};

export function sanitizeConfluenceHtml(inputHtml: string) {
  return inputHtml
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

export function htmlToPlainText(inputHtml: string) {
  return decodeHtmlEntitiesForText(
    inputHtml
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim(),
  )
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractHeadingsFromHtml(inputHtml: string) {
  const matches = inputHtml.matchAll(/<h([1-6])(?:\s+id="([^"]+)")?[^>]*>(.*?)<\/h\1>/gi);

  return Array.from(matches, (match) => {
    const level = Number(match[1]);
    const fallbackId = slugifyHeading(htmlToPlainText(match[3]));
    return {
      id: match[2] || fallbackId,
      level,
      text: htmlToPlainText(match[3]).trim(),
    };
  });
}

export function normalizeConfluencePage(
  page: RawConfluencePage,
  slug: string,
): WikiDocument {
  const contentHtml = unescapeEscapedHtmlEntitiesInHtml(sanitizeConfluenceHtml(page.bodyHtml));
  const headings = extractHeadingsFromHtml(contentHtml).filter(
    (h) => h.text !== "wiki.metadata",
  );
  const plainText = htmlToPlainText(contentHtml);

  return {
    id: page.id,
    ...(page.parentId ? { parentId: page.parentId } : {}),
    slug,
    title: page.title,
    summary: plainText.slice(0, 140).trim(),
    updatedAt: page.updatedAt,
    sourceUrl: page.sourceUrl,
    metadata: {
      docType: page.metadata.docType,
      audience: page.metadata.audience,
      status: "published",
      prerequisites: page.metadata.prerequisites,
      next: page.metadata.next,
      related: page.metadata.related,
    },
    headings,
    contentHtml,
  };
}

function unescapeEscapedHtmlEntitiesInHtml(inputHtml: string) {
  return inputHtml.replace(/&amp;((?:#\d+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]+);)/g, "&$1");
}

function decodeHtmlEntitiesForText(input: string) {
  return input.replace(/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]+);/g, (entity, token: string) => {
    if (token.startsWith("#x") || token.startsWith("#X")) {
      const value = Number.parseInt(token.slice(2), 16);
      return Number.isFinite(value) ? String.fromCodePoint(value) : entity;
    }

    if (token.startsWith("#")) {
      const value = Number.parseInt(token.slice(1), 10);
      return Number.isFinite(value) ? String.fromCodePoint(value) : entity;
    }

    const decoded = HTML_ENTITY_MAP[token.toLowerCase()];
    return decoded ?? entity;
  });
}

const HTML_ENTITY_MAP: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: "\"",
  apos: "'",
  nbsp: "\u00a0",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  middot: "·",
  bull: "•",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  copy: "©",
  reg: "®",
  trade: "™",
};

function slugifyHeading(text: string) {
  return text
    .toLocaleLowerCase("ko-KR")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}
