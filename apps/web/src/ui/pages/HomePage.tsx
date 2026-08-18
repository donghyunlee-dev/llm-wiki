import {
  HOME_CONTENT,
  getWikiDocumentHref,
  listLessonDocumentsFrom,
  stripTitleTypePrefix,
  type WikiDocument,
} from "@sfood/wiki-core";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWikiData } from "../../data/WikiDataProvider";
import { PromptComposer } from "../PromptComposer";
import { ConversationSidebar } from "./search/ConversationSidebar";
import { useSearchConversations } from "./search/useSearchConversations";

type FeaturedGuide = {
  title: string;
  href: string;
  isPinned?: boolean;
  description?: string;
};

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

  const onSubmit = () => {
    const query = keyword.trim();
    startTransition(() => {
      navigate(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
    });
  };

  return (
    <section className="home-hero-section">
      <div className="home-main-frame text-center">
        <h1 className="home-title">{HOME_CONTENT.hero.title}</h1>

        <PromptComposer
          value={keyword}
          onValueChange={setKeyword}
          onSubmit={onSubmit}
          placeholder={HOME_CONTENT.search.placeholder}
          ariaLabel="검색"
          buttonAriaLabel="검색"
          buttonTitle="검색"
          className="home-search-box"
          textareaClassName="home-search-input prompt-composer-textarea"
          buttonClassName="home-search-button prompt-composer-button"
          minRows={3}
          maxRows={8}
          buttonIcon={(
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-5 w-5">
              <path
                d="m3 10 13-6-3.5 12-2.4-4.5L3 10Zm0 0 7.1 1.5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        />

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

function LessonEntrySection({ hasLessons }: { hasLessons: boolean }) {
  if (!hasLessons) {
    return null;
  }

  return (
    <section className="home-lesson-section">
      <div className="home-lesson-card">
        <span className="home-lesson-card-copy">
          <span className="home-lesson-card-title">AI, 이제 기초부터 이해해 보세요</span>
          <span className="home-lesson-card-description">
            실습 전에 알아야 할 개념을 짧은 장면으로 정리했습니다.
          </span>
        </span>
        <Link to="/lesson" className="home-lesson-card-button">
          교육 시작하기 →
        </Link>
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
      title: stripTitleTypePrefix(document.title),
      href: getWikiDocumentHref(document) ?? `/guides/${document.slug}`,
    }));

  const pinnedGuide = startingGuide
    ? {
        title: "시작 가이드",
        href: startingGuideHref,
        isPinned: true,
        description: stripTitleTypePrefix(startingGuide.title),
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
  const navigate = useNavigate();
  const { conversations, deleteConversation } = useSearchConversations();
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [isConversationDrawerOpen, setIsConversationDrawerOpen] = useState(false);

  const featuredGuides = useMemo(() => buildFeaturedGuides(documents), [documents]);
  const hasLessons = useMemo(() => listLessonDocumentsFrom(documents).length > 0, [documents]);
  const hasConversations = conversations.length > 0;

  useEffect(() => {
    const element = shellRef.current;
    if (!element) {
      return;
    }

    const updateOffset = () => {
      const top = element.getBoundingClientRect().top;
      element.style.setProperty("--search-shell-offset", `${top}px`);
    };

    updateOffset();
    window.addEventListener("resize", updateOffset);
    return () => window.removeEventListener("resize", updateOffset);
  }, []);

  return (
    <div className="search-shell" ref={shellRef}>
      {hasConversations ? (
        <div
          className={
            isConversationDrawerOpen ? "search-sidebar-left search-sidebar-open" : "search-sidebar-left"
          }
        >
          <ConversationSidebar
            conversations={conversations}
            activeConversationId={null}
            title="최근 대화"
            onSelect={(id) => {
              setIsConversationDrawerOpen(false);
              startTransition(() => {
                navigate(`/search?c=${id}`);
              });
            }}
            onDelete={deleteConversation}
          />
        </div>
      ) : null}

      <div className="search-main-column">
        {hasConversations ? (
          <div className="search-mobile-toolbar">
            <button type="button" onClick={() => setIsConversationDrawerOpen(true)}>
              최근 대화
            </button>
          </div>
        ) : null}

        <div className="home-scroll-column">
          <SearchHero />
          <RecommendedGuidesSection guides={featuredGuides} isLoading={isLoading} />
          <LessonEntrySection hasLessons={hasLessons} />
        </div>
      </div>

      {hasConversations && isConversationDrawerOpen ? (
        <button
          type="button"
          className="search-drawer-backdrop"
          aria-label="닫기"
          onClick={() => setIsConversationDrawerOpen(false)}
        />
      ) : null}
    </div>
  );
}
