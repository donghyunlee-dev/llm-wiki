import { useMemo, type ReactNode } from "react";
import { getWikiDocumentHref, type WikiDocument } from "@sfood/wiki-core";
import { isStandaloneCommandText } from "../StructuredAnswerView";
import { WikiCallout, WikiCodeBlock } from "../wikiRichBlocks";

type ArticleContentRendererProps = {
  headings?: WikiDocument["headings"];
  html: string;
  title: string;
  documents: WikiDocument[];
};

export function ArticleContentRenderer({
  headings = [],
  html,
  title,
  documents,
}: ArticleContentRendererProps) {
  const blocks = useMemo(
    () => parseArticleBlocks(html, headings, title, documents),
    [documents, headings, html, title],
  );

  if (!blocks.length) {
    return (
      <div className="article-content">
        <p className="article-empty">본문이 비어 있는 문서입니다.</p>
      </div>
    );
  }

  return <div className="article-content">{blocks}</div>;
}

export function collectReferencedWikiDocuments(
  html: string,
  documents: WikiDocument[],
  currentPageId: string,
) {
  if (typeof DOMParser === "undefined") {
    return [];
  }

  const document = new DOMParser().parseFromString(html, "text/html");
  rewriteConfluenceRichNodes(document, documents);
  rewriteAnchorTargets(document, documents);
  const seen = new Set<string>();

  return Array.from(document.querySelectorAll("a[href]"))
    .map((anchor) => {
      return resolveWikiDocumentFromAnchor(anchor as HTMLAnchorElement, documents);
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .filter((item) => {
      if (item.id === currentPageId || seen.has(item.id)) {
        return false;
      }

      seen.add(item.id);
      return true;
    });
}

function parseArticleBlocks(
  html: string,
  headings: WikiDocument["headings"],
  title: string,
  documents: WikiDocument[],
): ReactNode[] {
  if (typeof DOMParser === "undefined") {
    return [
      <div
        key="fallback"
        className="article-html-fragment"
        dangerouslySetInnerHTML={{ __html: html }}
      />,
    ];
  }

  const document = new DOMParser().parseFromString(html, "text/html");
  rewriteConfluenceRichNodes(document, documents);
  rewriteAnchorTargets(document, documents);
  let headingIndex = 0;
  let skippedDuplicateTitle = false;
  const nodes = Array.from(document.body.childNodes);
  const result: ReactNode[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (
      !skippedDuplicateTitle &&
      node instanceof Element &&
      /^h1$/i.test(node.tagName) &&
      node.textContent?.trim() === title.trim()
    ) {
      skippedDuplicateTitle = true;
      headingIndex += 1;
      continue;
    }

    if (
      node instanceof Element &&
      /^h[1-6]$/i.test(node.tagName) &&
      node.textContent?.trim() === "wiki.metadata"
    ) {
      const nextNode = nodes[i + 1];
      const codeBlock =
        nextNode instanceof Element &&
        (nextNode.tagName.toLowerCase() === "pre" || looksLikeCodeBlock(nextNode))
          ? nextNode
          : null;

      result.push(
        <details key={`block-${i}-metadata`} className="article-metadata-details">
          <summary className="article-metadata-summary">···</summary>
          {codeBlock ? renderNode(codeBlock, `block-${i}-metadata-code`, undefined, documents) : null}
        </details>,
      );
      if (codeBlock) {
        i += 1;
      }
      continue;
    }

    const renderedNode = renderNode(node, `block-${i}`, headings[headingIndex], documents);

    if (node instanceof Element && /^h[1-6]$/i.test(node.tagName)) {
      headingIndex += 1;
    }

    if (renderedNode) {
      result.push(renderedNode);
    }
  }

  return result;
}

function renderNode(
  node: Node,
  key: string,
  heading?: WikiDocument["headings"][number],
  documents?: WikiDocument[],
): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim();
    return text ? (
      <p key={key} className="article-paragraph">
        {text}
      </p>
    ) : null;
  }

  if (!(node instanceof Element)) {
    return null;
  }

  const tagName = node.tagName.toLowerCase();

  if (/^h[1-6]$/.test(tagName)) {
    const level = Number(tagName.slice(1));
    const HeadingTag = `h${Math.min(Math.max(level, 2), 4)}` as "h2" | "h3" | "h4";
    return (
      <HeadingTag
        key={key}
        id={node.id || heading?.id || undefined}
        className={`article-heading article-heading-${level}`}
        dangerouslySetInnerHTML={{ __html: node.innerHTML }}
      />
    );
  }

  if (tagName === "p") {
    const commandBlock = renderCommandParagraph(node, key);

    if (commandBlock) {
      return commandBlock;
    }

    return (
      <p
        key={key}
        className="article-paragraph"
        dangerouslySetInnerHTML={{ __html: node.innerHTML }}
      />
    );
  }

  if (tagName === "ul" || tagName === "ol") {
    const ListTag = tagName as "ul" | "ol";
    return (
      <ListTag
        key={key}
        className={tagName === "ul" ? "article-list" : "article-list article-list-ordered"}
        dangerouslySetInnerHTML={{ __html: node.innerHTML }}
      />
    );
  }

  if (tagName === "pre") {
    const codeElement = node.querySelector("code");
    const codeText = codeElement?.textContent ?? node.textContent ?? "";
    const language = extractCodeLanguage(codeElement?.className ?? node.className);

    return <WikiCodeBlock key={key} code={codeText} language={language} />;
  }

  if (tagName === "div" && looksLikeCodeBlock(node)) {
    const codeText =
      node.querySelector(".codeContent pre, pre code, pre")?.textContent ??
      node.textContent ??
      "";
    const language = extractCodeLanguage(
      node.querySelector(".codeHeader")?.textContent?.trim() ?? node.className,
    );

    return <WikiCodeBlock key={key} code={codeText} language={language} />;
  }

  if (tagName === "table") {
    return (
      <div key={key} className="article-table-wrap">
        <table dangerouslySetInnerHTML={{ __html: node.innerHTML }} />
      </div>
    );
  }

  if (tagName === "blockquote") {
    const calloutKind = resolveCalloutKind(node.className);

    return (
      <WikiCallout key={key} tone={calloutKind}>
        {renderChildNodes(node, key, documents)}
      </WikiCallout>
    );
  }

  if (tagName === "div" && looksLikeCallout(node)) {
    const calloutKind = resolveCalloutKind(node.className);

    return (
      <WikiCallout key={key} tone={calloutKind}>
        {renderChildNodes(node, key, documents)}
      </WikiCallout>
    );
  }

  if (tagName === "hr") {
    return <hr key={key} className="article-rule" />;
  }

  return (
    <div
      key={key}
      className="article-html-fragment"
      dangerouslySetInnerHTML={{ __html: node.outerHTML }}
    />
  );
}

function renderCommandParagraph(node: Element, key: string) {
  const codeElements = Array.from(node.querySelectorAll("code"));

  if (codeElements.length !== 1) {
    return null;
  }

  const codeElement = codeElements[0];
  const codeText = codeElement?.textContent?.trim() ?? "";

  if (!isStandaloneCommandText(codeText)) {
    return null;
  }

  const innerHtml = node.innerHTML;
  const codeHtml = codeElement?.outerHTML ?? "";
  const index = innerHtml.indexOf(codeHtml);

  if (index < 0) {
    return null;
  }

  const beforeHtml = innerHtml.slice(0, index).trim();
  const afterHtml = innerHtml.slice(index + codeHtml.length).trim();

  return (
    <>
      {beforeHtml ? (
        <p key={`${key}-before`} className="article-paragraph" dangerouslySetInnerHTML={{ __html: beforeHtml }} />
      ) : null}
      <WikiCodeBlock key={`${key}-code`} code={codeText} language="shell" />
      {afterHtml ? (
        <p key={`${key}-after`} className="article-paragraph" dangerouslySetInnerHTML={{ __html: afterHtml }} />
      ) : null}
    </>
  );
}

function rewriteConfluenceRichNodes(document: Document, documents: WikiDocument[]) {
  for (const linkNode of Array.from(document.querySelectorAll("ac\\:link"))) {
    const replacement = resolveConfluenceLinkElement(document, linkNode as Element, documents);
    linkNode.replaceWith(replacement);
  }

  for (const macroNode of Array.from(document.querySelectorAll("ac\\:structured-macro"))) {
    const element = macroNode as Element;
    if ((element.getAttribute("ac:name") ?? "") !== "code") {
      continue;
    }

    const replacement = resolveConfluenceCodeElement(document, element);
    element.replaceWith(replacement);
  }
}

function resolveConfluenceLinkElement(document: Document, linkNode: Element, documents: WikiDocument[]) {
  const pageNode = linkNode.querySelector("ri\\:page");
  const linkBody = linkNode.querySelector("ac\\:link-body")?.textContent?.trim() ?? "";
  const linkedTitle =
    pageNode?.getAttribute("ri:content-title")?.trim() ||
    linkBody ||
    pageNode?.getAttribute("ri:content-id")?.trim() ||
    linkNode.textContent?.trim() ||
    "";
  const linkedPageId =
    pageNode?.getAttribute("ri:content-id")?.trim() ??
    pageNode?.getAttribute("ri:page-id")?.trim() ??
    pageNode?.getAttribute("ri:content-page-id")?.trim() ??
    "";

  const probe = document.createElement("a");
  probe.setAttribute(
    "href",
    linkedPageId
      ? `https://wiki.local/wiki/spaces/LLMWIKI/pages/${linkedPageId}/${linkedTitle.replace(/\s+/g, "+")}`
      : `https://wiki.local/wiki/spaces/LLMWIKI/pages/${linkedTitle.replace(/\s+/g, "+")}`,
  );
  if (linkedPageId) {
    probe.setAttribute("data-linked-resource-id", linkedPageId);
  }
  probe.setAttribute("data-linked-resource-title", linkedTitle);
  probe.textContent = linkedTitle;

  const resolvedHref = resolveWikiHref(probe, documents);

  if (!resolvedHref) {
    const searchAnchor = document.createElement("a");
    searchAnchor.setAttribute("href", `/search?q=${encodeURIComponent(linkedTitle)}`);
    searchAnchor.setAttribute("data-wiki-link", "true");
    searchAnchor.setAttribute("target", "_blank");
    searchAnchor.setAttribute("rel", "noreferrer");
    searchAnchor.textContent = linkedTitle;
    return searchAnchor;
  }

  const anchor = document.createElement("a");
  anchor.setAttribute("href", resolvedHref);
  anchor.setAttribute("data-wiki-link", "true");
  if (!resolvedHref.startsWith("#")) {
    anchor.setAttribute("target", "_blank");
    anchor.setAttribute("rel", "noreferrer");
  }
  anchor.textContent = linkedTitle;

  return anchor;
}

function resolveConfluenceCodeElement(document: Document, macroNode: Element) {
  const language =
    macroNode.querySelector("ac\\:parameter[ac\\:name='language']")?.textContent?.trim() ?? "";
  const codeText = extractConfluenceMacroBodyText(macroNode);

  const pre = document.createElement("pre");
  const code = document.createElement("code");

  if (language) {
    code.className = `language-${language}`;
  }

  code.textContent = codeText;
  pre.appendChild(code);

  return pre;
}

export function extractConfluenceMacroBodyText(macroNode: Element) {
  const bodyNode = macroNode.querySelector("ac\\:plain-text-body");
  const bodyHtml = bodyNode?.innerHTML ?? "";

  const cdataMatch = bodyHtml.match(/CDATA\[(.*)\]\]/s);
  if (cdataMatch?.[1]) {
    return cdataMatch[1].trim();
  }

  const commentMatch = bodyHtml.match(/<!--\s*\[CDATA\[(.*)\]\]\s*-->/s);
  if (commentMatch?.[1]) {
    return commentMatch[1].trim();
  }

  const textContent = bodyNode?.textContent?.trim();
  if (textContent) {
    return textContent.replace(/^\s*<!\[CDATA\[/, "").replace(/\]\]>\s*$/, "").trim();
  }

  return macroNode.textContent?.trim() ?? "";
}

function renderChildNodes(node: Element, keyPrefix: string, documents?: WikiDocument[]) {
  return Array.from(node.childNodes).map((childNode, index) =>
    renderNode(childNode, `${keyPrefix}-child-${index}`, undefined, documents),
  );
}

function looksLikeCallout(node: Element) {
  const className = node.className.toLowerCase();
  return [
    "confluence-information-macro",
    "confluence-warning-macro",
    "confluence-note-macro",
    "confluence-tip-macro",
    "confluence-success-macro",
    "panel",
    "callout",
  ].some((token) => className.includes(token));
}

function looksLikeCodeBlock(node: Element) {
  const className = node.className.toLowerCase();
  return (
    (className.includes("code") || className.includes("syntaxhighlighter")) &&
    (Boolean(node.querySelector("pre")) || className.includes("panel"))
  );
}

function resolveCalloutKind(className: string) {
  const normalized = className.toLowerCase();

  if (normalized.includes("warning")) {
    return "warning";
  }

  if (normalized.includes("tip")) {
    return "tip";
  }

  if (normalized.includes("success")) {
    return "success";
  }

  if (normalized.includes("note")) {
    return "note";
  }

  return "info";
}

function extractCodeLanguage(className: string) {
  const normalized = className.trim();

  if (!normalized) {
    return null;
  }

  const languageMatch = normalized.match(/language-([\w-]+)/i);
  return languageMatch?.[1] ?? normalized.split(/\s+/)[0] ?? null;
}

function rewriteAnchorTargets(document: Document, documents: WikiDocument[]) {
  for (const anchor of Array.from(document.querySelectorAll("a[href]"))) {
    const href = anchor.getAttribute("href") ?? "";
    const wikiHref = resolveWikiHref(anchor as HTMLAnchorElement, documents);

    if (wikiHref) {
      anchor.setAttribute("href", wikiHref);
      anchor.setAttribute("data-wiki-link", "true");
    } else if (isInternalWikiLink(anchor as HTMLAnchorElement, href)) {
      anchor.removeAttribute("href");
      anchor.setAttribute("data-wiki-link", "unresolved");
    }

    if (!href.startsWith("#")) {
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noreferrer");
    }
  }
}

export function resolveWikiDocumentFromAnchor(anchor: HTMLAnchorElement, documents: WikiDocument[]) {
  const rawHref = anchor.getAttribute("href") ?? "";

  if (!rawHref || rawHref.startsWith("#")) {
    return undefined;
  }

  try {
    const url = new URL(rawHref, "https://wiki.local");
    const linkedResourceId =
      anchor.getAttribute("data-linked-resource-id") ??
      anchor.getAttribute("data-linked-resource-page-id") ??
      anchor.getAttribute("data-page-id");

    if (linkedResourceId) {
      const matchedById = documents.find((document) => document.id === linkedResourceId);

      if (matchedById) {
        return matchedById;
      }
    }

    const pageIdMatch = url.pathname.match(/\/pages\/(\d+)/) ?? url.search.match(/[?&]pageId=(\d+)/);
    const pageId = pageIdMatch?.[1];

    if (pageId) {
      const matchedDocument = documents.find((document) => document.id === pageId);

      if (matchedDocument) {
        return matchedDocument;
      }
    }

    const matchedBySourceUrl = documents.find((document) => {
      if (!document.sourceUrl) {
        return false;
      }

      try {
        const sourceUrl = new URL(document.sourceUrl);
        return sourceUrl.pathname === url.pathname && sourceUrl.search === url.search;
      } catch {
        return false;
      }
    });

    if (matchedBySourceUrl) {
      return matchedBySourceUrl;
    }

    const pathSegments = url.pathname.split("/").filter(Boolean);
    const titleSegment = pathSegments.at(-1);

    if (titleSegment) {
      const normalizedSegment = normalizeLinkToken(decodeURIComponent(titleSegment));
      const matchedByTitle = documents.find((document) => {
        const normalizedTitle = normalizeLinkToken(document.title);
        const normalizedSlug = normalizeLinkToken(document.slug);

        return matchesLinkToken(normalizedSegment, normalizedTitle) || matchesLinkToken(normalizedSegment, normalizedSlug);
      });

      if (matchedByTitle) {
        return matchedByTitle;
      }
    }
  } catch {
    // fall through to title/text matching
  }

  const anchorText = normalizeLinkToken(anchor.textContent ?? "");
  if (anchorText) {
    const matchedByText = documents.find((document) => {
      const normalizedTitle = normalizeLinkToken(document.title);
      const normalizedSlug = normalizeLinkToken(document.slug);

      return matchesLinkToken(anchorText, normalizedTitle) || matchesLinkToken(anchorText, normalizedSlug);
    });

    if (matchedByText) {
      return matchedByText;
    }
  }

  const linkedTitle = normalizeLinkToken(
    anchor.getAttribute("data-linked-resource-title") ?? anchor.getAttribute("title") ?? "",
  );
  if (linkedTitle) {
    const matchedByLinkedTitle = documents.find((document) => {
      const normalizedTitle = normalizeLinkToken(document.title);
      const normalizedSlug = normalizeLinkToken(document.slug);

      return matchesLinkToken(linkedTitle, normalizedTitle) || matchesLinkToken(linkedTitle, normalizedSlug);
    });

    if (matchedByLinkedTitle) {
      return matchedByLinkedTitle;
    }
  }

  return undefined;
}

export function resolveWikiHref(anchor: HTMLAnchorElement, documents: WikiDocument[]) {
  const matchedDocument = resolveWikiDocumentFromAnchor(anchor, documents);

  if (matchedDocument) {
    return getWikiDocumentHref(matchedDocument) ?? `/search?q=${encodeURIComponent(matchedDocument.title)}`;
  }

  const rawHref = anchor.getAttribute("href") ?? "";
  if (isInternalWikiLink(anchor, rawHref)) {
    const query = buildInternalWikiSearchQuery(anchor, rawHref);
    if (query) {
      return `/search?q=${encodeURIComponent(query)}`;
    }
    return null;
  }

  return rawHref;
}

function normalizeLinkToken(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("ko-KR")
    .replace(/\+/g, " ")
    .replace(/[%_]/g, " ")
    .replace(/[^0-9a-z가-힣]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesLinkToken(left: string, right: string) {
  if (!left || !right) {
    return false;
  }

  return left === right;
}

function isInternalWikiLink(anchor: HTMLAnchorElement, rawHref: string) {
  if (
    anchor.hasAttribute("data-linked-resource-id") ||
    anchor.hasAttribute("data-linked-resource-page-id") ||
    anchor.hasAttribute("data-page-id")
  ) {
    return true;
  }

  return /\/pages\/\d+|viewpage\.action|pageId=|\/display\/|\/wiki\//i.test(rawHref);
}

function buildInternalWikiSearchQuery(anchor: HTMLAnchorElement, rawHref: string) {
  const linkedTitle =
    anchor.getAttribute("data-linked-resource-title") ??
    anchor.getAttribute("title") ??
    anchor.textContent ??
    "";

  const hrefTitle = extractTitleFromHref(rawHref);
  const query = normalizeLinkToken(linkedTitle || hrefTitle);

  return query || null;
}

function extractTitleFromHref(rawHref: string) {
  try {
    const url = new URL(rawHref, "https://wiki.local");
    const pathSegment = url.pathname.split("/").filter(Boolean).at(-1);

    if (!pathSegment) {
      return "";
    }

    return normalizeLinkToken(decodeURIComponent(pathSegment.replace(/\+/g, " ")));
  } catch {
    return "";
  }
}
