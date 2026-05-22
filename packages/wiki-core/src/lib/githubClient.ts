export type GitHubProject = {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  topics: string[];
  language: string | null;
  updatedAt: string;
  readmeSummary: string | null;
  readmeMarkdown: string | null;
};

export type GitHubClientConfig = {
  token: string;
  org: string;
  fetch?: typeof fetch;
};

type GitHubRepoResult = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  topics?: string[];
  language: string | null;
  updated_at: string;
};

export async function fetchGitHubOrgProjects(
  config: GitHubClientConfig,
): Promise<GitHubProject[]> {
  const fetchImpl = config.fetch ?? globalThis.fetch;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const repos = await fetchAllOrgRepos(config.org, headers, fetchImpl);

  const projects = await Promise.all(
    repos.map(async (repo) => {
      const readme = await fetchRepoReadme(repo.full_name, headers, fetchImpl);
      return {
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        htmlUrl: repo.html_url,
        topics: repo.topics ?? [],
        language: repo.language,
        updatedAt: repo.updated_at,
        readmeSummary: readme ? extractReadmeSummary(readme) : null,
        readmeMarkdown: readme ? readme.slice(0, 10000) : null,
      };
    }),
  );

  return projects;
}

async function fetchAllOrgRepos(
  org: string,
  headers: Record<string, string>,
  fetchImpl: typeof fetch,
): Promise<GitHubRepoResult[]> {
  const repos: GitHubRepoResult[] = [];
  let page = 1;

  while (true) {
    const url =
      `https://api.github.com/orgs/${encodeURIComponent(org)}/repos` +
      `?type=all&sort=updated&per_page=100&page=${page}`;

    const response = await fetchImpl(url, { headers });

    if (!response.ok) {
      throw new Error(
        `GitHub API request failed with status ${response.status}.`,
      );
    }

    const batch = (await response.json()) as GitHubRepoResult[];

    if (!Array.isArray(batch) || batch.length === 0) {
      break;
    }

    repos.push(...batch);

    if (batch.length < 100) {
      break;
    }

    page++;
  }

  return repos;
}

async function fetchRepoReadme(
  fullName: string,
  headers: Record<string, string>,
  fetchImpl: typeof fetch,
): Promise<string | null> {
  try {
    const url = `https://api.github.com/repos/${fullName}/readme`;
    const response = await fetchImpl(url, { headers });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { content?: string; encoding?: string };

    if (data.encoding !== "base64" || typeof data.content !== "string") {
      return null;
    }

    return decodeBase64Utf8(data.content.replace(/\n/g, ""));
  } catch {
    return null;
  }
}

function decodeBase64Utf8(encoded: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeBuf = (globalThis as any).Buffer;
  if (nodeBuf) {
    return nodeBuf.from(encoded, "base64").toString("utf-8") as string;
  }
  // Browser path via TextDecoder
  const binaryStr = atob(encoded);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return new TextDecoder("utf-8").decode(bytes);
}

export function extractReadmeSummary(markdown: string): string | null {
  const lines = markdown.split("\n");
  const paragraphLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip headings, blank lines, HTML tags, badge images, and comment blocks
    if (
      !trimmed ||
      trimmed.startsWith("#") ||
      trimmed.startsWith("<!--") ||
      trimmed.startsWith("<") ||
      /^!\[.*\]\(/.test(trimmed) ||
      /^\[!\[/.test(trimmed)
    ) {
      if (paragraphLines.length > 0) {
        break;
      }
      continue;
    }

    // Strip blockquote markers and use the inner text
    const content = trimmed.startsWith(">")
      ? trimmed.replace(/^>+\s*/, "").trim()
      : trimmed;

    if (!content) {
      if (paragraphLines.length > 0) break;
      continue;
    }

    paragraphLines.push(content);

    if (paragraphLines.join(" ").length >= 300) {
      break;
    }
  }

  const summary = paragraphLines.join(" ").slice(0, 300).trim();
  return summary || null;
}
