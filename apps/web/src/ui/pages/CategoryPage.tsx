import type { WikiSection } from "@sfood/wiki-core";
import { listWikiDocumentsBySectionFrom, type WikiDocument } from "@sfood/wiki-core";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useWikiData } from "../../data/WikiDataProvider";
import { WikiStatePanel } from "./WikiStatePanel";
import {
  WikiDocumentListItem,
} from "./WikiDocumentListItem";

const SECTION_COPY: Record<WikiSection, { title: string; body: string }> = {
  guides: {
    title: "추천 가이드",
    body: "처음 사용하는 직원이 어떤 순서로 읽으면 좋은지 안내하는 문서 목록입니다.",
  },
  library: {
    title: "자료실",
    body: "기본 지침서, 템플릿, 참고 자료를 모아두는 공간입니다.",
  },
  faq: {
    title: "FAQ",
    body: "자주 묻는 질문과 빠른 답변을 확인하는 공간입니다.",
  },
};

const GUIDE_PAGE_SIZE = 10;

export function CategoryPage({ section }: { section: WikiSection }) {
  const { documents, errorMessage, isLoading } = useWikiData();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const copy = SECTION_COPY[section];
  const sectionDocuments = useMemo(() => {
    const baseDocuments = listWikiDocumentsBySectionFrom(documents, section);

    if (section !== "guides") {
      return baseDocuments;
    }

    return baseDocuments.filter((document) => {
      if (document.metadata.docType !== "guide") return false;
      return !isIntroGuideDocument(document);
    });
  }, [documents, section]);
  const visibleDocuments = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");

    return sectionDocuments
      .filter((document) => {
        if (!normalizedQuery) {
          return true;
        }

        const haystack = [
          document.title,
          document.summary,
          ...document.headings.map((heading) => heading.text),
        ]
          .join(" ")
          .toLocaleLowerCase("ko-KR");

        return haystack.includes(normalizedQuery);
      })
      .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
  }, [sectionDocuments, query]);
  const pageCount = Math.max(1, Math.ceil(visibleDocuments.length / GUIDE_PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pagedDocuments = useMemo(() => {
    const start = (safePage - 1) * GUIDE_PAGE_SIZE;
    return visibleDocuments.slice(start, start + GUIDE_PAGE_SIZE);
  }, [safePage, visibleDocuments]);

  useEffect(() => {
    setPage(1);
  }, [query, section]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  if (isLoading) {
    return (
      <WikiStatePanel
        title={`${copy.title} 불러오는 중`}
        body="현재 공개 문서 목록을 읽어오는 중입니다."
      />
    );
  }

  if (errorMessage) {
    return (
      <WikiStatePanel
        title={`${copy.title}를 불러오지 못했습니다`}
        body={errorMessage}
        tone="error"
      />
    );
  }

  return (
    <div className="page-shell">
      <div className="page-width-narrow page-panel">
        <Link className="text-link" to="/">
          홈으로 돌아가기
        </Link>
        <h1 className="title-hero mt-6">
          {section === "guides" ? "[추천 가이드]" : copy.title}
        </h1>
        <p className="body-copy mt-6 max-w-3xl">{copy.body}</p>
        <div className="document-toolbar">
          <label className="document-field document-field-grow">
            <span>통합 검색</span>
            <input
              className="control-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="문서 제목, 요약, 목차를 검색"
            />
          </label>
        </div>

        <p className="mt-3 text-[13px] text-muted-fg">
          전체 {sectionDocuments.length}개 중 {visibleDocuments.length}개 표시
        </p>

        <div className="section-stack">
          {pagedDocuments.length ? (
            pagedDocuments.map((document) => (
              <WikiDocumentListItem
                key={document.id}
                to={`/${section}/${document.slug}`}
                document={document}
                eyebrow={section === "guides" ? "가이드 문서" : undefined}
              />
            ))
          ) : (
            <div className="empty-card">
              조건에 맞는 공개 문서가 없습니다.
            </div>
          )}
        </div>

        {visibleDocuments.length > GUIDE_PAGE_SIZE ? (
          <div className="guide-pagination">
            <button
              type="button"
              className="guide-pagination-button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={safePage === 1}
            >
              이전
            </button>
            <span className="guide-pagination-summary">
              {safePage} / {pageCount}
            </span>
            <button
              type="button"
              className="guide-pagination-button"
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              disabled={safePage === pageCount}
            >
              다음
            </button>
          </div>
        ) : null}

      </div>
    </div>
  );
}

function isIntroGuideDocument(document: WikiDocument) {
  return (
    /^\[intro-/i.test(document.title) ||
    /^\[intro-/i.test(document.slug) ||
    /\bintro\b/i.test(document.title) ||
    /\bintro\b/i.test(document.slug)
  );
}
