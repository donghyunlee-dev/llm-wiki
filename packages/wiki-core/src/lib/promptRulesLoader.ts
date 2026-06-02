import type { ConfluenceClientConfig } from "./confluenceClient";
import { getConfluencePageDetail } from "./confluenceClient";

export type DynamicPromptRules = {
  additionalInstructions: string[];
  keywordHints: string[];
  lastUpdated: string;
};

export const EMPTY_PROMPT_RULES: DynamicPromptRules = {
  additionalInstructions: [],
  keywordHints: [],
  lastUpdated: "",
};

export function parsePromptRulesFromHtml(html: string): DynamicPromptRules {
  return {
    additionalInstructions: extractSectionListItems(html, "추가 답변 지침"),
    keywordHints: extractSectionListItems(html, "추가 키워드 힌트"),
    lastUpdated: extractLastUpdatedFromHtml(html),
  };
}

export async function loadPromptRulesFromConfluence(
  config: ConfluenceClientConfig,
  pageId: string,
): Promise<DynamicPromptRules> {
  const detail = await getConfluencePageDetail(config, pageId);
  return parsePromptRulesFromHtml(detail.bodyHtml);
}

export function buildInitialPromptRulesPageHtml(): string {
  const lines = [
    "<p><em>이 페이지는 Claude 루틴이 자동으로 관리합니다. 직접 편집 시 다음 루틴 실행 시 덮어씌워질 수 있습니다.</em></p>",
    "<h2>추가 답변 지침</h2>",
    "<ul></ul>",
    "<h2>추가 키워드 힌트</h2>",
    "<ul></ul>",
    "<h2>감지된 반복 실패 패턴</h2>",
    "<ul></ul>",
  ];
  return lines.join("\n");
}

function extractSectionListItems(html: string, sectionTitle: string): string[] {
  const pattern = new RegExp(
    `<h[23][^>]*>[^<]*${escapeRegex(sectionTitle)}[^<]*</h[23]>([\\s\\S]*?)(?=<h[123]|$)`,
    "i",
  );
  const match = html.match(pattern);
  if (!match) return [];

  const sectionHtml = match[1];
  const items: string[] = [];
  const liPattern = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let liMatch;

  while ((liMatch = liPattern.exec(sectionHtml)) !== null) {
    const text = stripTagsAndDecodeHtml(liMatch[1]).trim();
    if (text) items.push(text);
  }

  return items;
}

function extractLastUpdatedFromHtml(html: string): string {
  const match = html.match(/마지막 갱신:\s*([0-9]{4}-[0-9]{2}-[0-9]{2}\s+[0-9]{2}:[0-9]{2})/);
  return match ? match[1].trim() : "";
}

function stripTagsAndDecodeHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
