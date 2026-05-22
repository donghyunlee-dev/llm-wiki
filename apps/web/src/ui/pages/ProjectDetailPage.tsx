import { Link, useParams } from "react-router-dom";
import { useGithubProjects } from "../../data/useGithubProjects";
import { StructuredAnswerView } from "../StructuredAnswerView";
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

export function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { projects, isLoading, errorMessage } = useGithubProjects();

  if (isLoading) {
    return (
      <WikiStatePanel
        title="프로젝트 불러오는 중"
        body="레포지터리 정보를 읽어오고 있습니다."
      />
    );
  }

  if (errorMessage) {
    return (
      <WikiStatePanel
        title="프로젝트를 불러오지 못했습니다"
        body={errorMessage}
        tone="error"
      />
    );
  }

  const project = projects.find((p) => p.name === slug);

  if (!project) {
    return (
      <WikiStatePanel
        title="프로젝트를 찾을 수 없습니다"
        body={`"${slug}" 레포지터리가 목록에 없습니다.`}
        tone="error"
      />
    );
  }

  const displayName = formatRepoName(project.name);

  return (
    <div className="page-shell">
      <div className="page-width article-layout">
        <article className="page-panel">
          <Link className="text-link" to="/projects">
            프로젝트 목록으로 돌아가기
          </Link>

          <div className="mt-6 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="title-hero">{displayName}</h1>
              <p className="text-[11px] text-muted-fg mt-1 font-mono">{project.name}</p>
            </div>
            <a
              href={project.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="home-secondary-button shrink-0"
            >
              GitHub에서 보기 ↗
            </a>
          </div>

          {project.description && (
            <p className="body-copy mt-3 max-w-2xl text-muted-fg">{project.description}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-fg">
            {project.topics.map((topic) => (
              <span key={topic} className="document-chip">{topic}</span>
            ))}
            <span className="ml-auto">{project.updatedAt.slice(0, 10)}</span>
          </div>

          <div className="mt-8 border-t border-panel-border pt-6">
            {project.readmeMarkdown ? (
              <StructuredAnswerView text={project.readmeMarkdown} variant="article" />
            ) : (
              <p className="body-copy text-muted-fg">README가 없습니다.</p>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
