import type { WikiSection } from "@sfood/wiki-core";
import { getWikiDocumentFrom } from "@sfood/wiki-core";
import { useEffect, useState, type MouseEvent } from "react";
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
    if (typeof IntersectionObserver === "undefined" || !document?.headings.length) {
      return;
    }

    const headingElements = document.headings
      .map((heading) => window.document.getElementById(heading.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (!headingElements.length) {
      return;
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

    return () => observer.disconnect();
  }, [document?.id]);

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
      <div className="page-width article-layout">
        <article className="page-panel">
          <Link className="text-link" to={`/${section}`}>
            목록으로 돌아가기
          </Link>
          <p className="eyebrow mt-6 text-xs">
            {document.metadata.docType}
          </p>
          <h1 className="title-hero mt-3">{document.title}</h1>

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
          <ArticleAskPanel documents={documents} pageId={document.id} />
        </article>

        <aside className="article-aside">
          <p className="eyebrow">목차</p>
          <nav className="article-toc" aria-label="문서 목차">
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
    </div>
  );
}
