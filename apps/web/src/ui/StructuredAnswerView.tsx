import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  filterVisibleAnswerBlocks,
  normalizeAnswerText,
  splitAnswerBlocks,
  type StructuredAnswerBlock,
} from "./structuredAnswer";

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
          <li key={`${item}-${itemIndex}`}>{renderTextAsInlineOrCode(item, variant)}</li>
        ))}
      </ol>
    ) : (
      <ul className={listClassName(variant, false)}>
        {block.items.map((item, itemIndex) => (
          <li key={`${item}-${itemIndex}`}>{renderTextAsInlineOrCode(item, variant)}</li>
        ))}
      </ul>
    );
  }

  if (block.type === "quote") {
    return <blockquote>{renderInlineText(block.text)}</blockquote>;
  }

  if (block.type === "callout") {
    return (
      <div className={`structured-callout structured-callout-${block.kind}`}>
        <div className="structured-callout-iconrail" aria-hidden="true">
          <div className={`structured-callout-icon structured-callout-icon-${block.kind}`}>
            {calloutKindIcon(block.kind)}
          </div>
        </div>
        <div className="structured-callout-content">
          <span className="sr-only">{calloutKindLabel(block.kind)}</span>
          {block.title ? <strong className="structured-callout-title">{block.title}</strong> : null}
          {block.body ? <p className="structured-callout-body">{renderInlineText(block.body)}</p> : null}
        </div>
      </div>
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
    return <StructuredAnswerCodeBlock code={block.code} language={block.language} variant={variant} />;
  }

  if (isStandaloneCommandText(block.text)) {
    return <StructuredAnswerCodeBlock code={block.text} language="shell" variant={variant} />;
  }

  return <p>{renderInlineText(block.text)}</p>;
}

function StructuredAnswerCodeBlock({
  code,
  language,
  variant,
}: {
  code: string;
  language?: string;
  variant: "chat" | "article";
}) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const lines = code.replace(/\r\n/g, "\n").split("\n");

  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = code;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const label = inferCodeLabel(language, lines);
  const codeClassName = variant === "chat" ? "chat-structured-code" : "article-ask-code";
  const codeFrameClassName = `${codeClassName}-frame`;
  const codeBodyClassName = `${codeClassName}-body`;
  const codeLinesClassName = `${codeClassName}-lines`;
  const codeBlockId = `${codeClassName}-${language ?? "plain"}-${code.length}`;

  return (
    <section className={codeFrameClassName}>
      <div className={`${codeClassName}-header`}>
        <div className={`${codeClassName}-meta`}>
          <span className={`${codeClassName}-language`}>{label}</span>
          {lines.length > 1 ? <span className={`${codeClassName}-linecount`}>{lines.length} lines</span> : null}
        </div>
        <div className="structured-code-actions">
          <button
            type="button"
            className={`${codeClassName}-toggle`}
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "코드 펼치기" : "코드 접기"}
            title={collapsed ? "코드 펼치기" : "코드 접기"}
            aria-expanded={!collapsed}
            aria-controls={codeBlockId}
          >
            <span aria-hidden="true">{collapsed ? "▾" : "▴"}</span>
          </button>
          <button
            type="button"
            className={`${codeClassName}-copy`}
            onClick={copy}
            aria-label="코드 복사"
            title="코드 복사"
          >
            <span aria-hidden="true">{copied ? "✓" : "⧉"}</span>
          </button>
        </div>
      </div>
      {!collapsed ? (
        <div className={codeBodyClassName} id={codeBlockId}>
          <ol className={codeLinesClassName}>
            {lines.map((line, index) => (
              <li key={`${codeBlockId}-${index}`} className={`${codeClassName}-line`}>
                <span className={`${codeClassName}-line-gutter`}>
                  <span className={`${codeClassName}-line-number`}>{index + 1}</span>
                </span>
                <code className={`${codeClassName}-line-code`}>{line || "\u00A0"}</code>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}

function renderInlineText(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\(([^)]+)\)/g;
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
          <Link key={`${match.index}-${href}`} to={href} target="_blank" rel="noreferrer">
            {label}
          </Link>
        ) : (
          <a key={`${match.index}-${href}`} href={href} target="_blank" rel="noreferrer">
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

function renderTextAsInlineOrCode(text: string, variant: "chat" | "article"): ReactNode {
  if (isStandaloneCommandText(text)) {
    return <StructuredAnswerCodeBlock code={text} language="shell" variant={variant} />;
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

function inferCodeLabel(language: string | undefined, lines: string[]) {
  if (language) {
    return language.toLowerCase();
  }

  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);

  if (nonEmptyLines.length && nonEmptyLines.every((line) => isStandaloneCommandText(line))) {
    return "shell";
  }

  return "code";
}

function headingClassName(variant: "chat" | "article", level: 2 | 3 | 4) {
  const base = variant === "chat" ? "chat-structured-heading" : "article-ask-heading";

  return `${base} ${base}-${level}`;
}

function listClassName(variant: "chat" | "article", ordered: boolean) {
  const base = variant === "chat" ? "chat-structured" : "article-ask";

  return `${base}-${ordered ? "ordered" : "unordered"}-list`;
}

function calloutKindLabel(kind: "info" | "warning" | "tip" | "note" | "success") {
  switch (kind) {
    case "info":
      return "정보";
    case "warning":
      return "주의";
    case "tip":
      return "팁";
    case "note":
      return "메모";
    case "success":
      return "성공";
  }
}

function calloutKindIcon(kind: "info" | "warning" | "tip" | "note" | "success") {
  switch (kind) {
    case "warning":
      return <WarningIcon />;
    case "tip":
      return <TipIcon />;
    case "note":
      return <NoteIcon />;
    case "success":
      return <SuccessIcon />;
    case "info":
    default:
      return <InfoIcon />;
  }
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 7v3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
      <circle cx="8" cy="4.8" r="0.7" fill="currentColor" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 2.6 13.9 12H2.1L8 2.6Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.2" />
      <path d="M8 6.2v2.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
      <circle cx="8" cy="10.9" r="0.7" fill="currentColor" />
    </svg>
  );
}

function TipIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M5.8 12.1h4.4M6.6 13.6h2.8M8 2.6a3.9 3.9 0 0 0-2.4 6.9c.4.4.7.9.8 1.5h3.2c.1-.6.4-1.1.8-1.5A3.9 3.9 0 0 0 8 2.6Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.15"
      />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4.4 2.8h5.8l1.5 1.5v8.9H4.4V2.8Z" fill="none" stroke="currentColor" strokeWidth="1.15" />
      <path d="M10.2 2.8v1.5h1.5" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.15" />
      <path d="M5.6 6.2h4.8M5.6 8.5h4.8M5.6 10.8h3.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.15" />
    </svg>
  );
}

function SuccessIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="5.7" fill="none" stroke="currentColor" strokeWidth="1.15" />
      <path d="m5.2 8.1 1.8 1.8 3.8-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    </svg>
  );
}
