import type { WikiDocument } from "@sfood/wiki-core";
import { Link } from "react-router-dom";

export const CATEGORY_LABELS: Record<WikiDocument["category"], string> = {
  guides: "가이드",
  projects: "프로젝트",
  library: "자료실",
  faq: "FAQ",
};

export const DOC_TYPE_LABELS: Record<WikiDocument["metadata"]["docType"], string> = {
  overview: "개요",
  concept: "개념",
  tutorial: "튜토리얼",
  howto: "방법",
  reference: "레퍼런스",
  troubleshooting: "문제 해결",
  example: "예시",
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
      <div className="mt-2.5 flex flex-wrap gap-1.5 text-xs text-muted-fg">
        {showCategory ? (
          <span className="document-chip">{CATEGORY_LABELS[document.category]}</span>
        ) : null}
        <span className="document-chip">
          {DOC_TYPE_LABELS[document.metadata.docType]}
        </span>
        <span className="document-chip">
          {AUDIENCE_LABELS[document.metadata.audience]}
        </span>
        <span className="document-chip">{document.updatedAt}</span>
      </div>
    </Link>
  );
}
