import { htmlToPlainText } from "./confluenceReadModel";

export type LessonScene = {
  id: string;
  title: string;
  bodyHtml: string;
  scriptHtml?: string;
};

const H2_PATTERN = /<h2(?:\s+id="([^"]*)")?[^>]*>([\s\S]*?)<\/h2>/gi;
const EXPAND_MACRO_PATTERN =
  /<ac:structured-macro[^>]*ac:name="expand"[^>]*>([\s\S]*?)<\/ac:structured-macro>/gi;
const RICH_TEXT_BODY_PATTERN = /<ac:rich-text-body[^>]*>([\s\S]*?)<\/ac:rich-text-body>/i;
/**
 * Content authors sometimes write the hidden narration as a plain Confluence blockquote
 * labeled "나레이션:" instead of using the Expand macro (observed in real authored lessons).
 * Only blockquotes containing this exact label are treated as hidden script — a plain
 * blockquote (e.g. a hook question) is left visible in the scene body.
 */
const NARRATION_BLOCKQUOTE_PATTERN =
  /<blockquote[^>]*>((?:(?!<\/blockquote>)[\s\S])*<strong>나레이션:<\/strong>(?:(?!<\/blockquote>)[\s\S])*)<\/blockquote>/gi;

export function splitLessonContentIntoScenes(contentHtml: string): LessonScene[] {
  const headingMatches = Array.from(contentHtml.matchAll(H2_PATTERN));

  if (headingMatches.length === 0) {
    return [buildScene("scene-1", "학습 내용", contentHtml)];
  }

  return headingMatches.map((match, index) => {
    const id = match[1] || `scene-${index + 1}`;
    const title = htmlToPlainText(match[2]);
    const bodyStart = (match.index ?? 0) + match[0].length;
    const bodyEnd = headingMatches[index + 1]?.index ?? contentHtml.length;
    const rawBody = contentHtml.slice(bodyStart, bodyEnd);

    return buildScene(id, title, rawBody);
  });
}

function buildScene(id: string, title: string, rawBody: string): LessonScene {
  let scriptHtml: string | undefined;

  const bodyHtml = rawBody
    .replace(EXPAND_MACRO_PATTERN, (_match, inner: string) => {
      scriptHtml = inner.match(RICH_TEXT_BODY_PATTERN)?.[1]?.trim();
      return "";
    })
    .replace(NARRATION_BLOCKQUOTE_PATTERN, (_match, inner: string) => {
      if (!scriptHtml) {
        scriptHtml = inner.trim();
      }
      return "";
    })
    .trim();

  return scriptHtml ? { id, title, bodyHtml, scriptHtml } : { id, title, bodyHtml };
}
