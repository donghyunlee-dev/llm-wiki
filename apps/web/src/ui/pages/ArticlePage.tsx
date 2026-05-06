import type { CategorySlug } from "@sfood/wiki-core";
import {
  getWikiDocumentFrom,
} from "@sfood/wiki-core";
import { Link, useParams } from "react-router-dom";
import { useWikiData } from "../../data/WikiDataProvider";
import { ArticleAskPanel } from "./ArticleAskPanel";
import { ArticleContentRenderer } from "./ArticleContentRenderer";
import { WikiStatePanel } from "./WikiStatePanel";

export function ArticlePage({ category }: { category: CategorySlug }) {
  const params = useParams();
  const slug = params.slug ?? "";
  const { documents, errorMessage, isLoading } = useWikiData();

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

  const document = getWikiDocumentFrom(documents, category, slug);

  if (!document) {
    return (
      <div className="page-shell">
        <div className="page-width-narrow page-panel">
          <Link className="text-link" to={`/${category}`}>
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
          <Link className="text-link" to={`/${category}`}>
            목록으로 돌아가기
          </Link>
          <p className="eyebrow mt-6 text-xs">
            {document.category}
          </p>
          <h1 className="title-hero mt-3">{document.title}</h1>
          <p className="body-copy mt-6 max-w-3xl">{document.summary}</p>

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
          <ArticleContentRenderer headings={document.headings} html={document.contentHtml} />
          <ArticleAskPanel documents={documents} pageId={document.id} />
        </article>

        <aside className="article-aside">
          <p className="eyebrow">목차</p>
          <nav className="article-toc" aria-label="문서 목차">
            {document.headings.length ? document.headings.map((heading) => (
              <a
                key={heading.id}
                href={`#${heading.id}`}
                className={`article-toc-link article-toc-level-${Math.min(heading.level, 4)}`}
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
