import type { WikiSection } from "@sfood/wiki-core";
import { getWikiDocumentFrom, stripTitleTypePrefix } from "@sfood/wiki-core";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useWikiData } from "../../data/WikiDataProvider";
import { ArticleAskPanel } from "./ArticleAskPanel";
import { ArticleContentRenderer } from "./ArticleContentRenderer";
import { WikiStatePanel } from "./WikiStatePanel";

export function ArticlePage({ section }: { section: WikiSection }) {
  const params = useParams();
  const slug = params.slug ?? "";
  const { documents, errorMessage, isLoading } = useWikiData();

  const document = getWikiDocumentFrom(documents, section, slug);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  // Hooks must run unconditionally before the early returns below (see 2026-05-06 fix in
  // implementation-status.md for why a conditional hook previously broke this page).
  useEffect(() => {
    const firstHeadingId = document?.headings[0]?.id;

    if (!firstHeadingId) {
      return;
    }

    // The scroll-spy observer below excludes the top ~96px and bottom ~70% of the viewport, so
    // the first heading (sitting below the title/chips block) may never intersect that band
    // while the reader is scrolled all the way to the top of the article — leaving a stale
    // heading highlighted. Explicitly force the first heading active whenever we're near the
    // top, independent of IntersectionObserver support.
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

    const headingElements = document.headings
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
  }, [document?.id]);

  const tocNavRef = useRef<HTMLElement | null>(null);

  // Keep the TOC's own scroll position in sync with the active heading — without this, the
  // TOC can end up scrolled to a stale position (e.g. still showing a mid-document entry after
  // the reader scrolls all the way back to the top of the article).
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
        title="문서를 불러오는 중"
        body="현재 선택한 문서 내용을 읽어오는 중입니다."
      />
    );
  }

  if (errorMessage) {
    return (
      <WikiStatePanel
        title="문서를 불러오지 못했습니다"
        body={errorMessage}
        tone="error"
      />
    );
  }

  if (!document) {
    return (
      <div className="page-shell">
        <div className="page-width-narrow page-panel">
          <Link className="text-link" to={`/${section}`}>
            목록으로 돌아가기
          </Link>
          <h1 className="title-hero mt-6">문서를 찾을 수 없습니다</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-width article-layout pb-32 pt-10 relative">
        <Link
          className="article-back-link"
          to={`/${section}`}
          aria-label="목록으로 돌아가기"
          title="목록으로 돌아가기"
        >
          <BackArrowIcon />
        </Link>

        <article className="article-body">
          <p className="eyebrow">
            {document.metadata.docType}
          </p>
          <h1 className="title-hero mt-3">{stripTitleTypePrefix(document.title)}</h1>

          <div className="section-stack mt-6 flex flex-wrap gap-2 space-y-0 text-xs text-muted-fg">
            <span className="document-chip">
              {document.metadata.docType}
            </span>
            <span className="document-chip">
              {document.metadata.audience}
            </span>
            <span className="document-chip">
              {document.updatedAt}
            </span>
          </div>
          <ArticleContentRenderer
            headings={document.headings}
            html={document.contentHtml}
            title={document.title}
            documents={documents}
          />
        </article>

        <aside className="article-aside">
          <p className="eyebrow">목차</p>
          <nav className="article-toc" aria-label="문서 목차" ref={tocNavRef}>
            {document.headings.length ? document.headings.map((heading) => (
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
            )) : (
              <span className="article-toc-empty">목차가 없습니다.</span>
            )}
          </nav>
        </aside>
      </div>

      <ArticleAskPanel documents={documents} pageId={document.id} />
    </div>
  );
}

function BackArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path
        d="M12.5 15.5 7 10l5.5-5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
