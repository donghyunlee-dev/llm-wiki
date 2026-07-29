import { StrictMode, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";

import {
  buildWikiSearchUrl,
  DEFAULT_WIKI_BASE_URL,
  requestWikiDocumentByHref,
  requestWikiSearch,
  resolveWikiHref,
  type WikiSidebarDocument,
  type WikiSearchResult,
  type WikiSearchStatus
} from "./wikiClient";
import "./styles.css";

const WIKI_BASE_URL_STORAGE_KEY = "sfoodWikiSidebar.baseUrl";

type SidebarView = "search" | "guide";

type GuideTarget = {
  title: string;
  href: string;
};

type GuideStatus = "idle" | "loading" | "success" | "error";

type ConversationEntry = {
  id: string;
  question: string;
  status: WikiSearchStatus;
  result?: WikiSearchResult;
  errorMessage?: string;
};

function SidebarApp() {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_WIKI_BASE_URL);
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [activeView, setActiveView] = useState<SidebarView>("search");
  const [activeGuide, setActiveGuide] = useState<GuideTarget | null>(null);
  const [guideDocument, setGuideDocument] = useState<WikiSidebarDocument | null>(null);
  const [guideStatus, setGuideStatus] = useState<GuideStatus>("idle");
  const [guideErrorMessage, setGuideErrorMessage] = useState("");
  const trimmedQuestion = question.trim();
  const isSearching = conversation.some((entry) => entry.status === "loading");
  const conversationBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    conversationBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  useEffect(() => {
    const tabId = new URLSearchParams(location.search).get("tabId");
    if (tabId) {
      chrome.runtime.connect({ name: `sfood-wiki:tab:${tabId}` });
    }
  }, []);

  useEffect(() => {
    void chrome.storage.local.get([WIKI_BASE_URL_STORAGE_KEY]).then((values) => {
      const storedBaseUrl = values[WIKI_BASE_URL_STORAGE_KEY];

      if (typeof storedBaseUrl === "string" && storedBaseUrl.trim()) {
        setBaseUrl(normalizeBaseLink(storedBaseUrl));
        return;
      }

      void chrome.storage.local.set({ [WIKI_BASE_URL_STORAGE_KEY]: DEFAULT_WIKI_BASE_URL });
    });
  }, []);

  async function submitQuestion() {
    if (!trimmedQuestion || isSearching) {
      return;
    }

    const nextSubmittedQuestion = trimmedQuestion;
    const entryId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setQuestion("");
    setActiveView("search");
    setConversation((entries) => [
      ...entries,
      {
        id: entryId,
        question: nextSubmittedQuestion,
        status: "loading"
      }
    ]);

    try {
      const nextResult = await requestWikiSearch(baseUrl, nextSubmittedQuestion);
      setConversation((entries) =>
        entries.map((entry) =>
          entry.id === entryId ? { ...entry, status: "success", result: nextResult } : entry,
        ),
      );
    } catch (error) {
      const nextErrorMessage = error instanceof Error ? error.message : "위키 검색 요청에 실패했습니다.";
      setConversation((entries) =>
        entries.map((entry) =>
          entry.id === entryId ? { ...entry, status: "error", errorMessage: nextErrorMessage } : entry,
        ),
      );
    }
  }

  async function openGuide(title: string, href: string) {
    const resolvedHref = resolveWikiHref(baseUrl, href);
    if (!isInternalWikiHref(baseUrl, resolvedHref)) {
      window.open(resolvedHref, "_blank", "noopener,noreferrer");
      return;
    }

    setActiveGuide({ title, href: resolvedHref });
    setGuideDocument(null);
    setGuideErrorMessage("");
    setGuideStatus("loading");
    setActiveView("guide");

    try {
      const document = await requestWikiDocumentByHref(baseUrl, href);
      setGuideDocument(document);
      setGuideStatus("success");
    } catch (error) {
      setGuideErrorMessage(error instanceof Error ? error.message : "가이드 본문을 불러오지 못했습니다.");
      setGuideStatus("error");
    }
  }

  function returnToSearch() {
    setActiveView("search");
  }

  return (
    <main className="sidebar-shell">
      {activeView === "guide" ? (
        <button
          type="button"
          className="back-link"
          onClick={returnToSearch}
          aria-label="검색 화면으로 돌아가기"
          title="검색 화면으로 돌아가기"
        >
          <BackIcon />
        </button>
      ) : null}

      <div className="sidebar-top-actions">
        <a className="home-link" href={normalizeBaseLink(baseUrl)} target="_blank" rel="noreferrer" aria-label="위키 홈 열기" title="위키 홈 열기">
          <HomeIcon />
        </a>
        <button
          type="button"
          className="restore-launcher-link"
          onClick={() => void chrome.storage.local.set({ "sfoodWikiSidebar.launcherHidden": false })}
          aria-label="사이드바 런처 다시 보이기"
          title="사이드바 런처 다시 보이기"
        >
          <EyeIcon />
        </button>
      </div>

      <div className="sidebar-stage">
        <div className={`sidebar-track sidebar-track-${activeView}`}>
          <section className="search-pane" aria-live="polite">
            <div className="result-panel">
              {conversation.length === 0 ? <div className="empty-state" aria-hidden="true" /> : null}
              {conversation.map((entry) => (
                <ConversationItem
                  key={entry.id}
                  baseUrl={baseUrl}
                  entry={entry}
                  fallbackSearchUrl={buildWikiSearchUrl(baseUrl, entry.question)}
                  onOpenGuide={(nextTitle, nextHref) => void openGuide(nextTitle, nextHref)}
                />
              ))}
              <div ref={conversationBottomRef} />
            </div>

            <section className="composer-panel" aria-label="위키 질문 입력">
              <div className="composer-box">
                <textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                      event.preventDefault();
                      void submitQuestion();
                    }
                  }}
                  placeholder="위키에 질문하세요"
                  rows={3}
                  spellCheck={false}
                />
                <button type="button" onClick={() => void submitQuestion()} disabled={!trimmedQuestion || isSearching} aria-label="검색">
                  <SendIcon />
                </button>
              </div>
            </section>
          </section>

          <section className="guide-pane" aria-label="가이드 보기">
            <div className="guide-pane-shell">
              {activeGuide ? (
                <>
                  {guideStatus === "loading" ? (
                    <div className="guide-state">
                      <TypingIndicator label="가이드를 불러오는 중입니다." />
                    </div>
                  ) : null}
                  {guideStatus === "error" ? (
                    <div className="guide-state guide-state-error">
                      <p>{guideErrorMessage}</p>
                      <a href={activeGuide.href} target="_blank" rel="noreferrer">
                        새 탭에서 열기
                      </a>
                    </div>
                  ) : null}
                  {guideStatus === "success" && guideDocument ? (
                    <article className="guide-content">
                      <header className="guide-pane-header">
                        <p className="eyebrow">가이드</p>
                        <h2>{guideDocument.title}</h2>
                        {guideDocument.summary ? <p className="guide-summary">{guideDocument.summary}</p> : null}
                      </header>
                      <div
                      className="guide-body"
                      dangerouslySetInnerHTML={{ __html: guideDocument.contentHtml }}
                      onClick={(event) => {
                        const anchor = (event.target as HTMLElement).closest("a");
                        if (!anchor) return;
                        event.preventDefault();
                        const href = anchor.getAttribute("href") ?? "";
                        const label = anchor.textContent?.trim() || href;
                        const resolvedHref = resolveWikiHref(baseUrl, href);
                        if (isInternalWikiHref(baseUrl, resolvedHref)) {
                          void openGuide(label, href);
                        } else {
                          window.open(resolvedHref, "_blank", "noopener,noreferrer");
                        }
                      }}
                    />
                    {guideDocument.relatedDocuments.length > 0 ? (
                      <section className="guide-related">
                        <h3>관련 페이지</h3>
                        <ul>
                          {guideDocument.relatedDocuments.map((doc) => (
                            <li key={doc.href}>
                              <InternalWikiLink
                                baseUrl={baseUrl}
                                href={doc.href}
                                label={doc.title}
                                onOpenGuide={(nextTitle, nextHref) => void openGuide(nextTitle, nextHref)}
                              />
                            </li>
                          ))}
                        </ul>
                      </section>
                    ) : null}
                    </article>
                  ) : null}
                </>
              ) : (
                <div className="guide-empty">
                  <p>검색 결과에서 가이드를 선택하면 이 영역으로 슬라이드됩니다.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function normalizeBaseLink(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, "") || DEFAULT_WIKI_BASE_URL;
}

function UserQuestion({ question }: { question: string }) {
  if (!question) {
    return null;
  }

  return <p className="user-question">{question}</p>;
}

function TypingIndicator({ label }: { label: string }) {
  return (
    <p className="typing-indicator" role="status" aria-live="polite">
      <span className="typing-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      {label}
    </p>
  );
}

function ConversationItem({
  baseUrl,
  entry,
  fallbackSearchUrl,
  onOpenGuide,
}: {
  baseUrl: string;
  entry: ConversationEntry;
  fallbackSearchUrl: string;
  onOpenGuide: (title: string, href: string) => void;
}) {
  return (
    <article className="conversation-flow">
      <UserQuestion question={entry.question} />
      {entry.status === "loading" ? <TypingIndicator label="검색 중입니다." /> : null}
      {entry.status === "success" && entry.result ? (
        <>
          <div className="answer-body">{renderAnswerBlocks(entry.result.answer, baseUrl, onOpenGuide)}</div>
          {entry.result.sources.length > 0 ? (
            <div className="sources">
              <h3>참고 문서</h3>
              <ul>
                {entry.result.sources.map((source) => (
                  <li key={`${entry.id}-${source.title}-${source.href}`}>
                    <InternalWikiLink
                      baseUrl={baseUrl}
                      href={source.href}
                      label={source.title}
                      onOpenGuide={onOpenGuide}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}
      {entry.status === "error" ? (
        <div className="error-card">
          <p>{entry.errorMessage}</p>
          <a href={fallbackSearchUrl} target="_blank" rel="noreferrer">
            위키 검색 페이지에서 열기
          </a>
        </div>
      ) : null}
    </article>
  );
}

function renderAnswerBlocks(answer: string, baseUrl: string, onOpenGuide: (title: string, href: string) => void) {
  return answer
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => (
      <p key={`${block}-${index}`} className="answer-paragraph">
        {renderInlineMarkdownLinks(block, baseUrl, onOpenGuide)}
      </p>
    ));
}

function renderInlineMarkdownLinks(
  text: string,
  baseUrl: string,
  onOpenGuide: (title: string, href: string) => void,
) {
  const parts: ReactNode[] = [];
  const linkPattern = /\[([^\]]+)]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const label = match[1] ?? "";
    const href = match[2] ?? "";
    const resolvedHref = resolveWikiHref(baseUrl, href);

    if (isInternalWikiHref(baseUrl, resolvedHref)) {
      parts.push(
        <InternalWikiLink
          key={`${label}-${href}-${match.index}`}
          baseUrl={baseUrl}
          href={href}
          label={label}
          onOpenGuide={onOpenGuide}
        />,
      );
    } else {
      parts.push(
        <a key={`${label}-${href}-${match.index}`} href={resolvedHref} target="_blank" rel="noreferrer">
          {label}
        </a>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length ? parts : text;
}

function InternalWikiLink({
  baseUrl,
  href,
  label,
  onOpenGuide,
}: {
  baseUrl: string;
  href: string;
  label: string;
  onOpenGuide: (title: string, href: string) => void;
}) {
  const resolvedHref = resolveWikiHref(baseUrl, href);

  return (
    <a
      href={resolvedHref}
      onClick={(event) => {
        event.preventDefault();
        onOpenGuide(label, href);
      }}
      target="_blank"
      rel="noreferrer"
    >
      {label}
    </a>
  );
}

function isInternalWikiHref(baseUrl: string, href: string) {
  try {
    const target = new URL(href);
    const base = new URL(normalizeBaseLink(baseUrl));
    return target.origin === base.origin;
  } catch {
    return href.startsWith("/");
  }
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.8 10.7 12 4l8.2 6.7" />
      <path d="M6.5 9.8v9h11v-9" />
      <path d="M10 18.8v-5h4v5" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.5 5.5 8 12l6.5 6.5" />
      <path d="M8.5 12h7.5" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m4 12 15-7-4.5 14-3.1-5.5L4 12Z" />
      <path d="m11.4 13.5 7.6-8.4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 12s3.8-6.5 9.5-6.5S21.5 12 21.5 12 17.7 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <SidebarApp />
  </StrictMode>
);
