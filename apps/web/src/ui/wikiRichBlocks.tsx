import { useState, type ReactNode } from "react";

export type WikiCalloutTone = "info" | "warning" | "tip" | "note" | "success";

type WikiCodeBlockProps = {
  code: string;
  language?: string | null;
};

type WikiCalloutProps = {
  tone: WikiCalloutTone;
  title?: string;
  html?: string;
  children?: ReactNode;
};

export function WikiCodeBlock({ code, language }: WikiCodeBlockProps) {
  const [copied, setCopied] = useState(false);

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

  return (
    <section className="wiki-code-frame">
      <button
        type="button"
        className="wiki-code-copy"
        onClick={copy}
        aria-label="코드 복사"
        title="코드 복사"
      >
        <span aria-hidden="true">{copied ? "✓" : "⧉"}</span>
      </button>
      <span className="sr-only">{language ?? "code"}</span>
      <pre className="wiki-code-block">
        <code>{code}</code>
      </pre>
    </section>
  );
}

export function WikiCallout({ tone, title, html, children }: WikiCalloutProps) {
  return (
    <div className={`wiki-callout wiki-callout-${tone}`}>
      <div className="wiki-callout-content">
        {title ? <strong className="wiki-callout-title">{title}</strong> : null}
        {html ? (
          <div className="wiki-callout-body" dangerouslySetInnerHTML={{ __html: html }} />
        ) : children ? (
          <div className="wiki-callout-body">{children}</div>
        ) : null}
      </div>
    </div>
  );
}
