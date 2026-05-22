import type { WikiDocument } from "@sfood/wiki-core";
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
};

export const AUDIENCE_LABELS: Record<WikiDocument["metadata"]["audience"], string> = {
  beginner: "입문",
  intermediate: "실무",
  advanced: "심화",
};

type WikiDocumentListItemProps = {
  document: WikiDocument;
  to: string;
  eyebrow?: string;
  showCategory?: boolean;
};

export function WikiDocumentListItem({
  document,
  eyebrow,
  showCategory = false,
  to,
}: WikiDocumentListItemProps) {
  return (
    <Link to={to} className="document-list-item">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="mb-1.5 text-xs font-semibold uppercase text-accent">
              {eyebrow}
            </p>
          ) : null}
          <p className="document-title">{document.title}</p>
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
