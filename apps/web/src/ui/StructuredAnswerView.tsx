import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  filterVisibleAnswerBlocks,
  normalizeAnswerText,
  splitAnswerBlocks,
  type StructuredAnswerBlock,
} from "./structuredAnswer";
import { WikiCallout, WikiCodeBlock } from "./wikiRichBlocks";

type StructuredAnswerViewProps = {
  text: string;
  variant: "chat" | "article";
};

export function StructuredAnswerView({ text, variant }: StructuredAnswerViewProps) {
  const blocks = filterVisibleAnswerBlocks(splitAnswerBlocks(normalizeAnswerText(text)));
  const className = variant === "chat" ? "chat-structured-answer" : "article-ask-structured-answer";

  return (
    <div className={className}>
      {blocks.map((block, index) => (
        <StructuredAnswerBlockView key={index} block={block} variant={variant} />
      ))}
    </div>
  );
}

function StructuredAnswerBlockView({
  block,
  variant,
}: {
  block: StructuredAnswerBlock;
  variant: "chat" | "article";
}) {
  if (block.type === "heading") {
    const HeadingTag = `h${block.level}` as "h2" | "h3" | "h4";

    return <HeadingTag className={headingClassName(variant, block.level)}>{block.text}</HeadingTag>;
  }

  if (block.type === "list") {
    return block.ordered ? (
      <ol className={listClassName(variant, true)}>
        {block.items.map((item, itemIndex) => (
          <li key={`${item}-${itemIndex}`}>{renderTextAsInlineOrCode(item)}</li>
        ))}
      </ol>
    ) : (
      <ul className={listClassName(variant, false)}>
        {block.items.map((item, itemIndex) => (
          <li key={`${item}-${itemIndex}`}>{renderTextAsInlineOrCode(item)}</li>
        ))}
      </ul>
    );
  }

  if (block.type === "quote") {
    return <blockquote>{renderInlineText(block.text)}</blockquote>;
  }

  if (block.type === "callout") {
    return (
      <WikiCallout tone={block.kind} title={block.title}>
        {block.body ? renderInlineText(block.body) : null}
      </WikiCallout>
    );
  }

  if (block.type === "table") {
    return (
      <details className="structured-table-frame" open>
        <summary className="structured-table-summary">표</summary>
        <div className="structured-table-scroll">
          <table className="structured-table">
            <thead>
              <tr>
                {block.headers.map((header, index) => (
                  <th key={`${header}-${index}`}>{renderInlineText(header)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${rowIndex}-${cellIndex}`}>{renderInlineText(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    );
  }

  if (block.type === "code") {
    return <WikiCodeBlock code={block.code} language={block.language} />;
  }

  if (isStandaloneCommandText(block.text)) {
    return <WikiCodeBlock code={block.text} language="shell" />;
  }

  if (variant === "chat") {
    const paragraphs = splitReadableParagraphText(block.text);

    if (paragraphs.length > 1) {
      return (
        <>
          {paragraphs.map((paragraph, index) => (
            <p key={`${paragraph}-${index}`}>{renderInlineText(paragraph)}</p>
          ))}
        </>
      );
    }
  }

  return <p>{renderInlineText(block.text)}</p>;
}

export function splitReadableParagraphText(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return [];
  }

  const sentences = normalized
    .split(/(?<=[.!?。！？]|[다요죠니다니까세요])\s+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length < 3 || normalized.length < 120) {
    return [normalized];
  }

  const paragraphs: string[] = [];

  for (let index = 0; index < sentences.length; index += 2) {
    paragraphs.push(sentences.slice(index, index + 2).join(" "));
  }

  return paragraphs;
}

function renderInlineText(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  // [^\]]*(?:\[[^\]]*\][^\]]*)*  → 라벨 안에 [Guide] 같은 중첩 괄호 허용
  const pattern = /\[([^\]]*(?:\[[^\]]*\][^\]]*)*)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const label = match[1] ?? match[0];
    const href = match[2] ?? "";

    if (/^(https?:)?\/\//i.test(href) || href.startsWith("/")) {
      nodes.push(
        href.startsWith("/") ? (
          <Link key={`${match.index}-${href}`} to={href} title={href} target="_blank" rel="noreferrer">
            {label}
          </Link>
        ) : (
          <a key={`${match.index}-${href}`} href={href} title={href} target="_blank" rel="noreferrer">
            {label}
          </a>
        ),
      );
    } else {
      nodes.push(label);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length ? nodes : text;
}

function renderTextAsInlineOrCode(text: string): ReactNode {
  if (isStandaloneCommandText(text)) {
    return <WikiCodeBlock code={text} language="shell" />;
  }

  return renderInlineText(text);
}

export function isStandaloneCommandText(text: string) {
  const normalized = text.trim();

  if (!normalized || normalized.includes("\n")) {
    return false;
  }

  if (/[가-힣]/.test(normalized)) {
    return false;
  }

  const commandPrefixes = [
    "npm ",
    "npx ",
    "pnpm ",
    "yarn ",
    "node ",
    "codex",
    "git ",
    "curl ",
    "python ",
    "pip ",
    "pip3 ",
    "docker ",
    "kubectl ",
    "setx ",
    "export ",
    "powershell ",
    "wsl ",
    "winget ",
    "brew ",
    "where ",
    "which ",
  ];

  return commandPrefixes.some((prefix) => normalized.startsWith(prefix)) || /[|><&]/.test(normalized);
}

function headingClassName(variant: "chat" | "article", level: 2 | 3 | 4) {
  const base = variant === "chat" ? "chat-structured-heading" : "article-ask-heading";

  return `${base} ${base}-${level}`;
}

function listClassName(variant: "chat" | "article", ordered: boolean) {
  const base = variant === "chat" ? "chat-structured" : "article-ask";

  return `${base}-${ordered ? "ordered" : "unordered"}-list`;
}
