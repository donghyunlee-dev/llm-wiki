import { stripTitleTypePrefix, type WikiDocument } from "@sfood/wiki-core";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useWikiData } from "../../data/WikiDataProvider";
import { ArticleContentRenderer } from "./ArticleContentRenderer";
import { CategoryPage } from "./CategoryPage";
import { WikiStatePanel } from "./WikiStatePanel";

function findStartingGuideDocument(documents: WikiDocument[]) {
  return (
    documents.find((document) => document.slug === "agent-start") ??
    documents.find((document) => /agent 시작하기/i.test(document.title)) ??
    documents.find((document) => /시작 가이드/i.test(document.title)) ??
    documents.find((document) => document.id === "63668231")
  );
}

export function GuidesPage() {
  return <CategoryPage section="guides" />;
}

export function StartingGuidePage() {
  const { documents, isLoading, errorMessage } = useWikiData();
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const gettingStarted = findStartingGuideDocument(documents);

  // Hooks must run unconditionally before the early returns below (see 2026-05-06 fix in
  // implementation-status.md for why a conditional hook previously broke ArticlePage the same way).
  useEffect(() => {
    const firstHeadingId = gettingStarted?.headings[0]?.id;

    if (!firstHeadingId) {
      return;
    }

    // See the identical fix in ArticlePage.tsx: force the first heading active near the top of
    // the page, independent of IntersectionObserver support, since it may sit below the
    // scroll-spy observer's rootMargin-excluded band.
    const handleScroll = () => {
      if (window.scrollY < 80) {
        setActiveHeadingId(firstHeadingId);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    if (typeof IntersectionObserver === "undefined") {
      return () => window.removeEventListener("scroll", handleScroll);
    }

    const headingElements = gettingStarted.headings
      .map((heading) => window.document.getElementById(heading.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (!headingElements.length) {
      return () => window.removeEventListener("scroll", handleScroll);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const nextActive = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

        if (nextActive) {
          setActiveHeadingId(nextActive.target.id);
        }
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );

    headingElements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [gettingStarted?.id]);

  const tocNavRef = useRef<HTMLElement | null>(null);

  // Keep the TOC's own scroll position in sync with the active heading (see the identical
  // fix in ArticlePage.tsx for why this is needed).
  useEffect(() => {
    if (!activeHeadingId || !tocNavRef.current) {
      return;
    }

    const links = tocNavRef.current.querySelectorAll("a");
    const activeLink = Array.from(links).find(
      (link) => link.getAttribute("href") === `#${activeHeadingId}`,
    );

    if (activeLink && typeof activeLink.scrollIntoView === "function") {
      activeLink.scrollIntoView({ block: "nearest" });
    }
  }, [activeHeadingId]);

  const handleTocClick = (event: MouseEvent<HTMLAnchorElement>, headingId: string) => {
    event.preventDefault();
    setActiveHeadingId(headingId);

    const element = window.document.getElementById(headingId);

    if (element && typeof element.scrollIntoView === "function") {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    window.history.replaceState(null, "", `#${headingId}`);
  };

  if (isLoading) {
    return (
      <WikiStatePanel
        title="가이드를 불러오는 중"
        body="현재 공개 문서 목록을 읽어오는 중입니다."
      />
    );
  }

  if (errorMessage) {
    return (
      <WikiStatePanel
        title="가이드를 불러오지 못했습니다"
        body={errorMessage}
        tone="error"
      />
    );
  }

  return (
    <div className="page-shell">
      <div className="page-width guide-article-layout">
        <article className="article-body">
          {gettingStarted ? (
            <>
              <h1 className="title-hero">
                {stripTitleTypePrefix(gettingStarted.title)}
              </h1>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-fg">
                <span className="document-chip">{gettingStarted.metadata.audience}</span>
                <span className="document-chip">{gettingStarted.updatedAt}</span>
              </div>
              <ArticleContentRenderer
                headings={gettingStarted.headings}
                html={gettingStarted.contentHtml}
                title={gettingStarted.title}
                documents={documents}
              />
            </>
          ) : (
            <p className="body-copy text-muted-fg">시작 가이드를 찾을 수 없습니다.</p>
          )}

        </article>

        {gettingStarted && gettingStarted.headings.length > 0 && (
          <aside className="article-aside">
            <p className="eyebrow">목차</p>
            <nav className="article-toc" aria-label="문서 목차" ref={tocNavRef}>
              {gettingStarted.headings.map((heading) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  onClick={(event) => handleTocClick(event, heading.id)}
                  className={`article-toc-link article-toc-level-${Math.min(heading.level, 4)}${
                    activeHeadingId === heading.id ? " article-toc-link-active" : ""
                  }`}
                >
                  {heading.text}
                </a>
              ))}
            </nav>
          </aside>
        )}
      </div>
    </div>
  );
}
