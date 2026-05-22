import type { ConfluenceClientConfig } from "./confluenceClient";
import {
  createConfluencePage,
  findConfluenceChildPageByTitle,
  getConfluencePageDetail,
  updateConfluencePage,
} from "./confluenceClient";

export type PlaybookSearchEntry = {
  timestamp: Date;
  question: string;
  answerSummary: string;
  recommendedDocuments: Array<{ title: string; href: string }>;
  sufficiency: "충분" | "부족";
  missingKeywords: string[];
};

export type PlaybookLogConfig = ConfluenceClientConfig & {
  playbookPageId: string;
};

export function buildPlaybookEntryRowHtml(entry: PlaybookSearchEntry): string {
  const timestamp = formatKstTimestamp(entry.timestamp);
  const recommendedList = entry.recommendedDocuments.length
    ? entry.recommendedDocuments.map((d) => escapeHtml(d.title)).join(", ")
    : "없음";
  const missingKeywords = entry.missingKeywords.length
    ? entry.missingKeywords.map(escapeHtml).join(", ")
    : "-";

  return [
    "    <tr>",
    `      <td>${escapeHtml(timestamp)}</td>`,
    `      <td>${escapeHtml(entry.question)}</td>`,
    `      <td>${escapeHtml(entry.answerSummary)}</td>`,
    `      <td>${recommendedList}</td>`,
    `      <td>${entry.sufficiency}</td>`,
    `      <td>${missingKeywords}</td>`,
    "    </tr>",
  ].join("\n");
}

export function buildPlaybookLogTableHtml(entry: PlaybookSearchEntry): string {
  return [
    "<table>",
    "  <thead>",
    "    <tr>",
    "      <th>검색 일시</th>",
    "      <th>질문</th>",
    "      <th>응답 요약</th>",
    "      <th>추천 문서</th>",
    "      <th>충분도</th>",
    "      <th>부족 키워드</th>",
    "    </tr>",
    "  </thead>",
    "  <tbody>",
    buildPlaybookEntryRowHtml(entry),
    "  </tbody>",
    "</table>",
  ].join("\n");
}

export function buildDailyPageTitle(date: Date): string {
  return `Playbook - ${formatKstDate(date)}`;
}

export function buildPlaybookEntryHtml(entry: PlaybookSearchEntry): string {
  return buildPlaybookLogTableHtml(entry);
}

export async function logSearchToPlaybook(
  config: PlaybookLogConfig,
  entry: PlaybookSearchEntry,
): Promise<void> {
  const pageTitle = buildDailyPageTitle(entry.timestamp);
  const entryRowHtml = buildPlaybookEntryRowHtml(entry);

  const existing = await findConfluenceChildPageByTitle(
    config,
    config.playbookPageId,
    pageTitle,
  );

  if (!existing) {
    await createConfluencePage(
      config,
      config.playbookPageId,
      pageTitle,
      `<h1>${escapeHtml(pageTitle)}</h1>\n${buildPlaybookLogTableHtml(entry)}`,
    );
    return;
  }

  const detail = await getConfluencePageDetail(config, existing.id);
  const updatedBody = appendPlaybookEntryRow(detail.bodyHtml, entryRowHtml);
  await updateConfluencePage(config, existing.id, pageTitle, updatedBody, detail.version);
}

function appendPlaybookEntryRow(bodyHtml: string, entryRowHtml: string): string {
  const closingTbodyIndex = bodyHtml.lastIndexOf("</tbody>");

  if (closingTbodyIndex === -1) {
    return `${bodyHtml}\n${[
      "<table>",
      "  <thead>",
      "    <tr>",
      "      <th>검색 일시</th>",
      "      <th>질문</th>",
      "      <th>응답 요약</th>",
      "      <th>추천 문서</th>",
      "      <th>충분도</th>",
      "      <th>부족 키워드</th>",
      "    </tr>",
      "  </thead>",
      "  <tbody>",
      entryRowHtml,
      "  </tbody>",
      "</table>",
    ].join("\n")}`;
  }

  return [
    bodyHtml.slice(0, closingTbodyIndex),
    entryRowHtml,
    bodyHtml.slice(closingTbodyIndex),
  ].join("\n");
}

function formatKstDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatKstTimestamp(date: Date): string {
  return date.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
