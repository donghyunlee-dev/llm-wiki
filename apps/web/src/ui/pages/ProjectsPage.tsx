import type { GitHubProject } from "@sfood/wiki-core";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useGithubProjects } from "../../data/useGithubProjects";
import { WikiStatePanel } from "./WikiStatePanel";

function formatRepoName(name: string): string {
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\b(sfood|ax|wms|mb|llm)\b/gi, (m) => m.toUpperCase())
    .replace(/\w\S*/g, (w) =>
      /^[A-Z]+$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .trim();
}

const LANGUAGE_COLOR: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Java: "#b07219",
  Go: "#00ADD8",
  Rust: "#dea584",
};

function LanguageDot({ language }: { language: string }) {
  const color = LANGUAGE_COLOR[language] ?? "#8b949e";
  return (
    <span className="flex items-center gap-1">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span>{language}</span>
    </span>
  );
}

function GitHubProjectCard({ project }: { project: GitHubProject }) {
  const displayName = formatRepoName(project.name);
  const summary = project.readmeSummary ?? project.description;

  return (
    <Link to={`/projects/${project.name}`} className="document-list-item block">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="document-title">{displayName}</p>
          <p className="text-[11px] text-muted-fg mt-0.5 font-mono">{project.name}</p>
        </div>
        <span className="link-indicator shrink-0">→</span>
      </div>

      {summary && (
        <p className="document-summary line-clamp-3 mt-2">{summary}</p>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-muted-fg">
        {project.language && <LanguageDot language={project.language} />}
        {project.topics.slice(0, 4).map((topic) => (
          <span key={topic} className="document-chip">{topic}</span>
        ))}
        <span className="ml-auto">{project.updatedAt.slice(0, 10)}</span>
      </div>
    </Link>
  );
}

function filterProjects(projects: GitHubProject[], query: string): GitHubProject[] {
  const q = query.trim().toLowerCase();
  if (!q) return projects;
  return projects.filter((p) => {
    const text = [p.name, p.description, p.readmeSummary, p.language, ...p.topics]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return text.includes(q);
  });
}

function GitHubProjectsSection() {
  const { projects, isLoading, errorMessage } = useGithubProjects();
  const [query, setQuery] = useState("");

  if (isLoading) {
    return (
      <WikiStatePanel
        title="GitHub 프로젝트 불러오는 중"
        body="조직의 레포지터리 목록을 읽어오고 있습니다."
      />
    );
  }

  if (errorMessage) {
    return (
      <WikiStatePanel
        title="GitHub 프로젝트를 불러오지 못했습니다"
        body={errorMessage}
        tone="error"
      />
    );
  }

  if (projects.length === 0) {
    return null;
  }

  const filtered = filterProjects(projects, query);

  return (
    <div className="page-shell">
      <div className="page-width-narrow page-panel">
        <h1 className="title-hero">프로젝트 리스트</h1>
        <div className="mt-4">
          <input
            className="control-input w-full h-9"
            type="search"
            placeholder="프로젝트 이름, 설명, 언어, 토픽 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="프로젝트 검색"
          />
        </div>
        {filtered.length === 0 ? (
          <p className="empty-card mt-4">
            "{query.trim()}"에 해당하는 프로젝트가 없습니다.
          </p>
        ) : (
          <div className="section-stack mt-4">
            {filtered.map((project) => (
              <GitHubProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ProjectsPage() {
  return <GitHubProjectsSection />;
}
