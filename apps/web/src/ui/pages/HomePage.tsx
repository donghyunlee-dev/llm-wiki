import { HOME_CONTENT, getWikiDocumentHref, type WikiDocument } from "@sfood/wiki-core";
import { startTransition, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWikiData } from "../../data/WikiDataProvider";

type FeaturedGuide = {
  title: string;
  href: string;
  isPinned?: boolean;
  description?: string;
};

function stripGuidePrefix(title: string) {
  return title.replace(/^\[(?:Guide|guide)\]\s*/i, "");
}

function isOnboardingPage(title: string, slug: string) {
  return (
    /^\[intro-/i.test(title) ||
    /\bs\d+-\d{3}[a-z]?\b/i.test(title) ||
    /\bs\d+-\d{3}[a-z]?\b/i.test(slug)
  );
}

function findStartingGuideDocument(documents: WikiDocument[]) {
  return (
    documents.find((document) => document.slug === "agent-start") ??
    documents.find((document) => /agent 시작하기/i.test(document.title)) ??
    documents.find((document) => /시작 가이드/i.test(document.title)) ??
    documents.find((document) => document.id === "63668231")
  );
}

function SearchHero() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");

  const onSubmit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const query = keyword.trim();
    startTransition(() => {
      navigate(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
    });
  };

  return (
    <section className="home-hero-section">
      <div className="home-main-frame text-center">
        <h1 className="home-title">{HOME_CONTENT.hero.title}</h1>

        <form className="home-search-box" onSubmit={onSubmit}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={HOME_CONTENT.search.placeholder}
              className="home-search-input"
            />
            <button
              type="submit"
              className="home-search-button"
              aria-label="Search"
            >
              🔍
            </button>
          </div>
        </form>

      </div>
    </section>
  );
}

function RecommendedGuidesSection(props: {
  guides: FeaturedGuide[];
  isLoading: boolean;
}) {
  const pinnedGuide = props.guides.find((guide) => guide.isPinned);
  const guideCards = props.guides.filter((guide) => !guide.isPinned);

  return (
    <section className="home-guides-section">
      <div className="home-card home-guides-card home-support-frame">
        <div className="home-guides-header">
          <h2 className="home-section-title">추천 가이드</h2>
          <Link className="home-secondary-button" to="/guides">
            전체 보기
          </Link>
        </div>

        <div className="home-guides-cards">
          {props.isLoading ? (
            <p className="home-muted py-2 text-xs">불러오는 중...</p>
          ) : props.guides.length === 0 ? (
            <p className="home-muted py-2 text-xs">등록된 가이드가 없습니다.</p>
          ) : (
            <>
              {pinnedGuide ? (
                <GuideCard guide={pinnedGuide} variant="featured" />
              ) : null}
              <div className="home-guide-card-grid">
                {guideCards.map((guide) => (
                  <GuideCard key={guide.href} guide={guide} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function buildFeaturedGuides(documents: WikiDocument[]): FeaturedGuide[] {
  const startingGuide = findStartingGuideDocument(documents);
  const startingGuideHref = startingGuide
    ? "/guides/agent-start"
    : "/guides";

  const guideDocuments = documents
    .filter((document) => document.metadata.docType === "guide" && !isOnboardingPage(document.title, document.slug))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const remainingGuides = guideDocuments
    .filter((document) => document.id !== startingGuide?.id && document.slug !== startingGuide?.slug)
    .slice(0, 4)
    .map((document) => ({
      title: stripGuidePrefix(document.title),
      href: getWikiDocumentHref(document) ?? `/guides/${document.slug}`,
    }));

  const pinnedGuide = startingGuide
    ? {
        title: "시작 가이드",
        href: startingGuideHref,
        isPinned: true,
        description: stripGuidePrefix(startingGuide.title),
      }
    : {
        title: "시작 가이드",
        href: "/guides",
        isPinned: true,
      };

  return [pinnedGuide, ...remainingGuides].slice(0, 5);
}

function GuideCard(props: {
  guide: FeaturedGuide;
  variant?: "featured";
}) {
  const isFeatured = props.variant === "featured";

  return (
    <Link
      to={props.guide.href}
      className={isFeatured ? "home-guide-card home-guide-card-featured" : "home-guide-card"}
    >
      <span className={isFeatured ? "home-guide-card-icon home-guide-card-icon-featured" : "home-guide-card-icon"}>
        <GuideRowIcon pinned={isFeatured} />
      </span>
      <span className="home-guide-card-copy">
        <span className="home-guide-card-title">{props.guide.title}</span>
        {props.guide.description ? (
          <span className="home-guide-card-description">{props.guide.description}</span>
        ) : null}
      </span>
      <span className="home-guide-card-arrow">→</span>
    </Link>
  );
}

function ProjectDesignCta() {
  return (
    <section className="home-section-compact">
      <div className="home-blueprint home-support-frame">
        <div>
          <h2 className="home-blueprint-title">
            {HOME_CONTENT.projectDesign.title}
          </h2>
          <p className="home-blueprint-body">{HOME_CONTENT.projectDesign.body}</p>
        </div>
        <Link
          to={HOME_CONTENT.projectDesign.href}
          className="home-blueprint-button"
        >
          <span className="home-blueprint-button-label">
            {HOME_CONTENT.projectDesign.cta}
          </span>
        </Link>
      </div>
    </section>
  );
}

function GuideRowIcon({ pinned }: { pinned: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none">
      <path
        d="M5.5 4.75h6.2c.4 0 .8.15 1.1.44l1.95 1.82c.33.31.52.74.52 1.19v7.4c0 .77-.63 1.4-1.4 1.4H5.5c-.77 0-1.4-.63-1.4-1.4v-9.45c0-.77.63-1.4 1.4-1.4Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth={pinned ? 1.8 : 1.5}
        opacity={pinned ? 1 : 0.8}
      />
      <path
        d="M11.6 4.75V6.8c0 .44.36.8.8.8h2.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={pinned ? 1.8 : 1.5}
        opacity={pinned ? 1 : 0.8}
      />
      <path
        d="M7.1 9.2h5.2m-5.2 2.5h4.4m-4.4 2.5h3.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={pinned ? 1.8 : 1.5}
      />
    </svg>
  );
}

export function HomePage() {
  const { documents, isLoading } = useWikiData();

  const featuredGuides = useMemo(() => buildFeaturedGuides(documents), [documents]);

  return (
    <>
      <SearchHero />
      <RecommendedGuidesSection guides={featuredGuides} isLoading={isLoading} />
      <ProjectDesignCta />
    </>
  );
}
