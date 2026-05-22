import { startTransition, useEffect, useState } from "react";
import type { GitHubProject } from "@sfood/wiki-core";

type GitHubProjectsState = {
  projects: GitHubProject[];
  isLoading: boolean;
  errorMessage: string | null;
};

export function useGithubProjects(): GitHubProjectsState {
  const [state, setState] = useState<GitHubProjectsState>({
    projects: [],
    isLoading: true,
    errorMessage: null,
  });

  useEffect(() => {
    let cancelled = false;

    fetch("/api/github/projects")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`GitHub API responded with ${response.status}`);
        }
        return response.json() as Promise<{ projects: GitHubProject[] }>;
      })
      .then((data) => {
        if (cancelled) return;
        startTransition(() => {
          setState({
            projects: Array.isArray(data.projects) ? data.projects : [],
            isLoading: false,
            errorMessage: null,
          });
        });
      })
      .catch(() => {
        if (cancelled) return;
        startTransition(() => {
          setState({
            projects: [],
            isLoading: false,
            errorMessage: "GitHub 프로젝트를 불러오지 못했습니다.",
          });
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
