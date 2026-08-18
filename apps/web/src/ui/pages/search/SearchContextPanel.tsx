import { Link } from "react-router-dom";
import { stripTitleTypePrefix } from "@sfood/wiki-core";
import type { SearchDocumentSummary } from "../../searchRecommendations";

export function SearchContextPanel({
  recommended,
  related,
  faq,
}: {
  recommended: SearchDocumentSummary[];
  related: SearchDocumentSummary[];
  faq: SearchDocumentSummary[];
}) {
  const hasAnyContext = recommended.length > 0 || related.length > 0 || faq.length > 0;

  return (
    <aside className="search-context-panel" aria-label="관련 페이지">
      {!hasAnyContext ? (
        <p className="search-context-empty">아직 관련 페이지가 없습니다.</p>
      ) : (
        <>
          <SearchContextSection title="추천 페이지" documents={recommended} />
          <SearchContextSection title="관련 페이지" documents={related} />
          <SearchContextSection title="자주 묻는 질문" documents={faq} />
        </>
      )}
    </aside>
  );
}

function SearchContextSection({
  title,
  documents,
}: {
  title: string;
  documents: SearchDocumentSummary[];
}) {
  if (!documents.length) {
    return null;
  }

  return (
    <section className="search-context-section">
      <h2>{title}</h2>
      <ul className="search-context-list">
        {documents.map((document) => (
          <li key={document.id}>
            <Link className="chat-guide-card" to={document.href} target="_blank" rel="noreferrer">
              <strong>{stripTitleTypePrefix(document.title)}</strong>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
