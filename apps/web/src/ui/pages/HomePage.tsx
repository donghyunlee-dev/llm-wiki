import { startTransition, useState, type FormEvent } from "react";
import { HOME_CONTENT } from "@sfood/wiki-core";
import { Link, useNavigate } from "react-router-dom";

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
      <div className="mx-auto max-w-3xl text-center">
        <p className="home-eyebrow mb-3">{HOME_CONTENT.hero.eyebrow}</p>
        <h1 className="home-title">{HOME_CONTENT.hero.title}</h1>
        <p className="home-body mx-auto mt-3 max-w-xl">{HOME_CONTENT.hero.body}</p>

        <form className="home-search-box" onSubmit={onSubmit}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="home-search-tag">질문</span>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={HOME_CONTENT.search.placeholder}
              className="home-search-input"
            />
            <button
              type="submit"
              className="home-primary-button"
            >
              검색
            </button>
          </div>
        </form>

        <p className="home-muted mx-auto mt-3 max-w-xl text-xs leading-5">
          예시: {HOME_CONTENT.search.examples.join(" · ")}
        </p>
      </div>
    </section>
  );
}

function EntryCards() {
  return (
    <section className="home-section border-t border-panel-border">
      <div className="home-content-grid md:grid-cols-4">
      {HOME_CONTENT.entryCards.map((entry) => (
        <Link
          key={entry.title}
          to={entry.href}
          className="home-card home-card-hover home-card-padding text-left"
        >
          <h2 className="home-section-title">{entry.title}</h2>
          <p className="home-body mt-2">{entry.description}</p>
        </Link>
      ))}
      </div>
    </section>
  );
}

function ListPanel(props: { title: string; href: string; items: string[] }) {
  return (
    <section className="home-card home-card-padding">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="home-section-title">{props.title}</h2>
        <Link className="home-secondary-button" to={props.href}>
          전체 보기
        </Link>
      </div>
      <div className="space-y-1">
        {props.items.map((item) => (
          <Link
            key={item}
            to={props.href}
            className="home-list-row"
          >
            <span>{item}</span>
            <span className="home-muted">→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ProjectDesignCta() {
  return (
    <section className="home-section-compact">
      <div className="home-blueprint">
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

export function HomePage() {
  return (
    <>
      <SearchHero />
      <EntryCards />
      <section className="home-section-compact">
        <div className="home-content-grid md:grid-cols-2">
          <ListPanel
            title="추천 가이드"
            href="/guides"
            items={HOME_CONTENT.featuredGuides}
          />
          <ListPanel
            title="프로젝트 사례"
            href="/projects"
            items={HOME_CONTENT.featuredProjects}
          />
        </div>
      </section>
      <ProjectDesignCta />
    </>
  );
}
