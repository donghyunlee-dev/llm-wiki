import { useMemo, type ReactNode } from "react";
import type { WikiDocument } from "@sfood/wiki-core";

type ArticleContentRendererProps = {
  headings?: WikiDocument["headings"];
  html: string;
};

export function ArticleContentRenderer({ headings = [], html }: ArticleContentRendererProps) {
  const blocks = useMemo(() => parseArticleBlocks(html, headings), [headings, html]);

  if (!blocks.length) {
    return (
      <div className="article-content">
        <p className="article-empty">본문이 비어 있는 문서입니다.</p>
      </div>
    );
  }

  return <div className="article-content">{blocks}</div>;
}

function parseArticleBlocks(html: string, headings: WikiDocument["headings"]): ReactNode[] {
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
  let headingIndex = 0;

  return Array.from(document.body.childNodes)
    .map((node, index) => {
      const renderedNode = renderNode(node, `block-${index}`, headings[headingIndex]);

      if (node instanceof Element && /^h[1-6]$/i.test(node.tagName)) {
        headingIndex += 1;
      }

      return renderedNode;
    })
    .filter(Boolean);
}

function renderNode(node: Node, key: string, heading?: WikiDocument["headings"][number]): ReactNode {
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
    return (
      <pre key={key} className="article-code-block">
        <code>{node.textContent ?? ""}</code>
      </pre>
    );
  }

  if (tagName === "table") {
    return (
      <div key={key} className="article-table-wrap">
        <table dangerouslySetInnerHTML={{ __html: node.innerHTML }} />
      </div>
    );
  }

  if (tagName === "blockquote") {
    return (
      <blockquote
        key={key}
        className="article-quote"
        dangerouslySetInnerHTML={{ __html: node.innerHTML }}
      />
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
