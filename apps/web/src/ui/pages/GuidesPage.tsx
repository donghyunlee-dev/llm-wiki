import type { WikiDocument } from "@sfood/wiki-core";
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

  const gettingStarted = findStartingGuideDocument(documents);

  return (
    <div className="page-shell">
      <div className="page-width article-layout">
        <article className="page-panel">
          {gettingStarted ? (
            <>
              <h1 className="title-hero">
                {gettingStarted.title.replace(/^\[Guide\]\s*/i, "")}
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
            <nav className="article-toc" aria-label="문서 목차">
              {gettingStarted.headings.map((heading) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  className={`article-toc-link article-toc-level-${Math.min(heading.level, 4)}`}
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
