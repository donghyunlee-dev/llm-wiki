import type { ConfluenceClientConfig } from "./confluenceClient";
import { findConfluenceChildPageByTitle, getConfluencePageDetail } from "./confluenceClient";
import { buildDailyPageTitle } from "./playbookLogger";

export type PlaybookFailurePattern = {
  keyword: string;
  count: number;
  exampleQuestions: string[];
};

export type PlaybookAnalysisResult = {
  totalEntries: number;
  insufficientCount: number;
  failurePatterns: PlaybookFailurePattern[];
  analyzedDays: string[];
};

export type PlaybookAnalyzerConfig = ConfluenceClientConfig & {
  playbookPageId: string;
};

export async function analyzeRecentPlaybookFailures(
  config: PlaybookAnalyzerConfig,
  daysBack = 7,
): Promise<PlaybookAnalysisResult> {
  const dates = getRecentKstDates(daysBack);
  const allRows: PlaybookRow[] = [];
  const analyzedDays: string[] = [];

  for (const date of dates) {
    const title = buildDailyPageTitle(date);
    const page = await findConfluenceChildPageByTitle(config, config.playbookPageId, title);
    if (!page) continue;

    const detail = await getConfluencePageDetail(config, page.id);
    const rows = parsePlaybookRows(detail.bodyHtml);
    allRows.push(...rows);
    analyzedDays.push(title);
  }

  const insufficient = allRows.filter((r) => r.sufficiency === "부족");
  const failurePatterns = extractFailurePatterns(insufficient);

  return {
    totalEntries: allRows.length,
    insufficientCount: insufficient.length,
    failurePatterns,
    analyzedDays,
  };
}

type PlaybookRow = {
  question: string;
  sufficiency: string;
  missingKeywords: string[];
};

export function parsePlaybookRows(html: string): PlaybookRow[] {
  const rows: PlaybookRow[] = [];
  const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let isFirstRow = true;
  let match;

  while ((match = rowPattern.exec(html)) !== null) {
    if (isFirstRow) {
      // Skip thead row (contains <th> cells, not <td>)
      if (/<th[^>]*>/i.test(match[1])) {
        continue;
      }
      isFirstRow = false;
    }

    const cells = extractTableCells(match[1]);
    // columns: timestamp(0), question(1), audience(2), persona(3), answerSummary(4), recommendedDocs(5), sufficiency(6), missingKeywords(7)
    if (cells.length < 8) continue;

    const question = cells[1].trim();
    const sufficiency = cells[6].trim();
    const missingRaw = cells[7].trim();
    const missingKeywords =
      missingRaw === "-" || missingRaw === ""
        ? []
        : missingRaw.split(",").map((s) => s.trim()).filter(Boolean);

    if (question) rows.push({ question, sufficiency, missingKeywords });
  }

  return rows;
}

export function extractFailurePatterns(
  rows: Array<{ question: string; missingKeywords: string[] }>,
): PlaybookFailurePattern[] {
  const map = new Map<string, { count: number; questions: Set<string> }>();

  for (const row of rows) {
    const keywords = row.missingKeywords.length > 0 ? row.missingKeywords : [row.question];
    for (const kw of keywords) {
      const key = kw.toLowerCase().trim();
      if (!key) continue;
      const entry = map.get(key) ?? { count: 0, questions: new Set<string>() };
      entry.count += 1;
      entry.questions.add(row.question);
      map.set(key, entry);
    }
  }

  return Array.from(map.entries())
    .filter(([, v]) => v.count >= 2)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 10)
    .map(([keyword, { count, questions }]) => ({
      keyword,
      count,
      exampleQuestions: Array.from(questions).slice(0, 3),
    }));
}

function extractTableCells(rowHtml: string): string[] {
  const cells: string[] = [];
  const tdPattern = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  let match;
  while ((match = tdPattern.exec(rowHtml)) !== null) {
    cells.push(stripTags(match[1]));
  }
  return cells;
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function getRecentKstDates(daysBack: number): Date[] {
  const dates: Date[] = [];
  const now = new Date();
  for (let i = 0; i < daysBack; i++) {
    dates.push(new Date(now.getTime() - i * 24 * 60 * 60 * 1000));
  }
  return dates;
}
