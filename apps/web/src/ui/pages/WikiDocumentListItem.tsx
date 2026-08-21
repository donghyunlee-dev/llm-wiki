import { stripTitleTypePrefix, type WikiDocument } from "@sfood/wiki-core";
import { Link } from "react-router-dom";

export const DOC_TYPE_LABELS: Record<WikiDocument["metadata"]["docType"], string> = {
  guide: "가이드",
  page: "페이지",
  faq: "FAQ",
  library: "자료실",
  policy: "정책",
  nav: "탐색",
  ops: "운영",
  playbook: "플레이북",
  lesson: "레슨",
};

export const AUDIENCE_LABELS: Record<WikiDocument["metadata"]["audience"], string> = {
  beginner: "입문",
  intermediate: "실무",
  advanced: "심화",
};

type WikiDocumentListItemProps = {
  document: WikiDocument;
  to: string;
  showCategory?: boolean;
};

export function WikiDocumentListItem({
  document,
  showCategory = false,
  to,
}: WikiDocumentListItemProps) {
  return (
    <Link to={to} className="document-list-item">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="document-title">{stripTitleTypePrefix(document.title)}</p>
        </div>
        <span className="link-indicator">보기</span>
      </div>
      <p className="document-summary line-clamp-2">
        {document.summary}
      </p>
      {showCategory ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5 text-xs text-muted-fg">
          <span className="document-chip">{DOC_TYPE_LABELS[document.metadata.docType]}</span>
        </div>
      ) : null}
    </Link>
  );
}
