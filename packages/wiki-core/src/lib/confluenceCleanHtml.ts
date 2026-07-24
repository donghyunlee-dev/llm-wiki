import { getWikiDocumentSection, type WikiDocument } from "./wikiDocuments";

const CALLOUT_LABELS: Record<string, string> = {
  info: "안내",
  tip: "팁",
  note: "참고",
  warning: "주의",
  panel: "",
};

const ADF_PANEL_TYPES = new Set(["info", "tip", "note", "warning", "success", "error"]);

/**
 * ADF 패널의 panel-type는 문서 콘텐츠에서 오는 신뢰할 수 없는 값이므로,
 * 알려진 유형만 통과시키고 나머지는 안전한 기본값(info)으로 정규화한다.
 */
function resolveAdfPanelType(rawType: string): string {
  const normalized = rawType.toLowerCase();
  return ADF_PANEL_TYPES.has(normalized) ? normalized : "info";
}

/**
 * Confluence storage-format HTML을 DOM 없이 시맨틱 HTML 문자열로 변환한다.
 * 익스텐션/서버 전용 정리기이며, 웹앱 본체는 별도의 React 렌더러를 유지한다.
 */
export function renderConfluenceContentToCleanHtml(html: string, documents: WikiDocument[]): string {
  if (!html) {
    return "";
  }

  let out = html;

  out = out.replace(
    /<ac:structured-macro[^>]*ac:name="metadata"[\s\S]*?<\/ac:structured-macro>/gi,
    "",
  );

  out = out.replace(
    /<ac:structured-macro[^>]*ac:name="code"[^>]*>([\s\S]*?)<\/ac:structured-macro>/gi,
    (_match, inner: string) => {
      const language = readMacroParameter(inner, "language");
      const code = readPlainTextBody(inner);
      const cls = language ? ` class="language-${escapeHtmlAttribute(language)}"` : "";
      return `<pre><code${cls}>${escapeHtml(code)}</code></pre>`;
    },
  );

  out = out.replace(
    /<ac:structured-macro[^>]*ac:name="(info|tip|note|warning|panel)"[^>]*>([\s\S]*?)<\/ac:structured-macro>/gi,
    (_match, name: string, inner: string) => {
      const title = readMacroParameter(inner, "title") || CALLOUT_LABELS[name] || "";
      const body = readRichTextBody(inner);
      const titleHtml = title ? `<p class="wiki-callout__title">${escapeHtml(title)}</p>` : "";
      return `<div class="wiki-callout wiki-callout--${name}">${titleHtml}${body}</div>`;
    },
  );

  out = out.replace(
    /<ac:adf-extension>([\s\S]*?)<\/ac:adf-extension>/gi,
    (match, inner: string) => {
      if (!/<ac:adf-node[^>]*type="panel"/i.test(inner)) {
        return match;
      }
      const rawType =
        inner
          .match(/<ac:adf-attribute[^>]*key="panel-type"[^>]*>([\s\S]*?)<\/ac:adf-attribute>/i)?.[1]
          ?.trim() ?? "";
      const panelType = resolveAdfPanelType(rawType);
      const body =
        inner.match(/<ac:adf-content[^>]*>([\s\S]*?)<\/ac:adf-content>/i)?.[1]?.trim() ?? "";
      const title = CALLOUT_LABELS[panelType] ?? "";
      const titleHtml = title ? `<p class="wiki-callout__title">${escapeHtml(title)}</p>` : "";
      return `<div class="wiki-callout wiki-callout--${panelType}">${titleHtml}${body}</div>`;
    },
  );

  out = out.replace(/<ac:link([^>]*)>([\s\S]*?)<\/ac:link>/gi, (_match, attrs: string, inner: string) => {
    return resolveConfluenceLink(attrs, inner, documents);
  });

  out = out.replace(/<\/?(?:ac|ri):[^>]*>/gi, "");

  return out.trim();
}

function readMacroParameter(inner: string, name: string): string {
  const pattern = new RegExp(
    `<ac:parameter[^>]*ac:name="${name}"[^>]*>([\\s\\S]*?)<\\/ac:parameter>`,
    "i",
  );
  return inner.match(pattern)?.[1]?.trim() ?? "";
}

function readPlainTextBody(inner: string): string {
  const body = inner.match(/<ac:plain-text-body[^>]*>([\s\S]*?)<\/ac:plain-text-body>/i)?.[1] ?? "";
  const cdata = body.match(/<!\[CDATA\[([\s\S]*?)\]\]>/i);
  return (cdata?.[1] ?? body).trim();
}

function readRichTextBody(inner: string): string {
  return inner.match(/<ac:rich-text-body[^>]*>([\s\S]*?)<\/ac:rich-text-body>/i)?.[1]?.trim() ?? "";
}

function resolveConfluenceLink(attrs: string, inner: string, documents: WikiDocument[]): string {
  const anchor = attrs.match(/ac:anchor="([^"]+)"/i)?.[1]?.trim() ?? "";
  const pageId =
    inner.match(/ri:content-id="([^"]+)"/i)?.[1]?.trim() ??
    inner.match(/ri:page-id="([^"]+)"/i)?.[1]?.trim() ??
    "";
  const title =
    inner.match(/ri:content-title="([^"]+)"/i)?.[1]?.trim() ||
    readLinkBody(inner) ||
    "";

  const target = findDocument(documents, pageId, title);
  if (target) {
    const section = getWikiDocumentSection(target);
    if (section) {
      return `<a href="/${section}/${target.slug}" data-wiki-link="true">${escapeHtml(target.title)}</a>`;
    }
  }

  if (anchor) {
    return `<a href="#${escapeHtmlAttribute(anchor)}">${escapeHtml(title || anchor)}</a>`;
  }

  return escapeHtml(title);
}

function readLinkBody(inner: string): string {
  const cdata = inner.match(
    /<ac:plain-text-link-body[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/ac:plain-text-link-body>/i,
  );
  if (cdata?.[1]?.trim()) {
    return cdata[1].trim();
  }

  return inner.match(/<ac:link-body[^>]*>([\s\S]*?)<\/ac:link-body>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "";
}

function findDocument(documents: WikiDocument[], pageId: string, title: string): WikiDocument | null {
  if (pageId) {
    const byId = documents.find((document) => document.id === pageId);
    if (byId) {
      return byId;
    }
  }

  if (title) {
    const normalized = normalizeTitleToken(title);
    const byTitle = documents.find((document) => normalizeTitleToken(document.title) === normalized);
    if (byTitle) {
      return byTitle;
    }
  }

  return null;
}

function normalizeTitleToken(value: string): string {
  return value.toLocaleLowerCase("ko-KR").replace(/\s+/g, " ").trim();
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeHtmlAttribute(text: string): string {
  return escapeHtml(text).replace(/"/g, "&quot;");
}
