import type { CategorySlug } from "@sfood/wiki-core";
import { listWikiDocumentsByCategoryFrom, type WikiDocument } from "@sfood/wiki-core";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useWikiData } from "../../data/WikiDataProvider";
import { WikiStatePanel } from "./WikiStatePanel";
import {
  AUDIENCE_LABELS,
  DOC_TYPE_LABELS,
  WikiDocumentListItem,
} from "./WikiDocumentListItem";

const CATEGORY_COPY: Record<
  CategorySlug,
  {
    title: string;
    body: string;
  }
> = {
  guides: {
    title: "시작 가이드",
    body: "처음 사용하는 직원이 어떤 순서로 읽으면 좋은지 안내하는 문서 목록입니다.",
  },
  projects: {
    title: "프로젝트 사례",
    body: "완성된 결과를 참고하며 어떤 문제를 어떻게 풀었는지 이해하는 사례 목록입니다.",
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

type SortMode = "updated-desc" | "title-asc";

export function CategoryPage({ category }: { category: CategorySlug }) {
  const { documents, errorMessage, isLoading } = useWikiData();
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState<"all" | WikiDocument["metadata"]["audience"]>("all");
  const [docType, setDocType] = useState<"all" | WikiDocument["metadata"]["docType"]>("all");
  const [sortMode, setSortMode] = useState<SortMode>("updated-desc");
  const copy = CATEGORY_COPY[category];
  const categoryDocuments = listWikiDocumentsByCategoryFrom(documents, category);
  const filterOptions = buildFilterOptions(categoryDocuments);
  const visibleDocuments = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");

    return categoryDocuments
      .filter((document) => {
        if (audience !== "all" && document.metadata.audience !== audience) {
          return false;
        }

        if (docType !== "all" && document.metadata.docType !== docType) {
          return false;
        }

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
      .sort((first, second) => {
        if (sortMode === "title-asc") {
          return first.title.localeCompare(second.title, "ko-KR");
        }

        return second.updatedAt.localeCompare(first.updatedAt);
      });
  }, [audience, categoryDocuments, docType, query, sortMode]);

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
        <h1 className="title-hero mt-6">{copy.title}</h1>
        <p className="body-copy mt-6 max-w-3xl">{copy.body}</p>

        <div className="document-toolbar">
          <label className="document-field document-field-grow">
            <span>목록 내 검색</span>
            <input
              className="control-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="제목, 요약, 목차 검색"
            />
          </label>
          <label className="document-field">
            <span>대상</span>
            <select
              className="control-input"
              value={audience}
              onChange={(event) =>
                setAudience(event.target.value as typeof audience)}
            >
              <option value="all">전체</option>
              {filterOptions.audiences.map((option) => (
                <option key={option} value={option}>
                  {AUDIENCE_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
          <label className="document-field">
            <span>유형</span>
            <select
              className="control-input"
              value={docType}
              onChange={(event) => setDocType(event.target.value as typeof docType)}
            >
              <option value="all">전체</option>
              {filterOptions.docTypes.map((option) => (
                <option key={option} value={option}>
                  {DOC_TYPE_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
          <label className="document-field">
            <span>정렬</span>
            <select
              className="control-input"
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
            >
              <option value="updated-desc">최근 수정순</option>
              <option value="title-asc">제목순</option>
            </select>
          </label>
        </div>

        <p className="mt-3 text-[13px] text-muted-fg">
          전체 {categoryDocuments.length}개 중 {visibleDocuments.length}개 표시
        </p>

        <div className="section-stack">
          {visibleDocuments.length ? (
            visibleDocuments.map((document) => (
              <WikiDocumentListItem
                key={document.id}
                to={`/${category}/${document.slug}`}
                document={document}
                eyebrow={category === "guides" ? "가이드 문서" : undefined}
              />
            ))
          ) : (
            <div className="empty-card">
              조건에 맞는 공개 문서가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildFilterOptions(documents: WikiDocument[]) {
  return {
    audiences: Array.from(
      new Set(documents.map((document) => document.metadata.audience)),
    ).sort(),
    docTypes: Array.from(
      new Set(documents.map((document) => document.metadata.docType)),
    ).sort(),
  };
}
