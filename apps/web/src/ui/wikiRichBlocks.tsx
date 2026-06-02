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

const CALLOUT_ICONS: Record<WikiCalloutTone, ReactNode> = {
  info: (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm9 3a1 1 0 1 1-2 0V8a1 1 0 0 1 2 0v3Zm-1-5.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
    </svg>
  ),
  tip: (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 1.5A4.5 4.5 0 0 0 5.09 9.35a.5.5 0 0 1 .21.41V11h5v-.24a.5.5 0 0 1 .21-.41A4.5 4.5 0 0 0 8 1.5ZM5.5 12v.5a2.5 2.5 0 0 0 5 0V12h-5Z" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368ZM8.75 9.5V6a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
    </svg>
  ),
  note: (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M0 2.75A2.75 2.75 0 0 1 2.75 0h10.5A2.75 2.75 0 0 1 16 2.75v10.5A2.75 2.75 0 0 1 13.25 16H2.75A2.75 2.75 0 0 1 0 13.25Zm2.75-1.25c-.69 0-1.25.56-1.25 1.25v10.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25V2.75c0-.69-.56-1.25-1.25-1.25ZM5.25 5a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5Zm0 2.75a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5Zm0 2.75a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5Z" />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm11.78-1.72a.75.75 0 0 0-1.06-1.06L6.75 9.19 5.28 7.72a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l4.5-4.5Z" />
    </svg>
  ),
};

export function WikiCallout({ tone, title, html, children }: WikiCalloutProps) {
  return (
    <div className={`wiki-callout wiki-callout-${tone}`} role="note" aria-label={title}>
      <div className="wiki-callout-content">
        <span className="wiki-callout-icon">
          {CALLOUT_ICONS[tone]}
        </span>
        {html ? (
          <div className="wiki-callout-body" dangerouslySetInnerHTML={{ __html: html }} />
        ) : children ? (
          <div className="wiki-callout-body">{children}</div>
        ) : null}
      </div>
    </div>
  );
}
