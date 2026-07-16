export type GitHubRepo = {
  name: string;
  description: string | null;
  url: string;
  pushedAt: string;
  stars: number;
  openIssues: number;
  private: boolean;
};

export async function fetchUserRepos(): Promise<GitHubRepo[]> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set");

  const res = await fetch(
    "https://api.github.com/user/repos?per_page=100&affiliation=owner,collaborator&sort=pushed",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${await res.text()}`);
  }

  const repos = (await res.json()) as Array<{
    name: string;
    description: string | null;
    html_url: string;
    pushed_at: string;
    stargazers_count: number;
    open_issues_count: number;
    private: boolean;
  }>;

  return repos.map((r) => ({
    name: r.name,
    description: r.description,
    url: r.html_url,
    pushedAt: r.pushed_at,
    stars: r.stargazers_count,
    openIssues: r.open_issues_count,
    private: r.private,
  }));
}

// Repo names are kebab-case ("mi-stock"), project entity names are human
// ("Mi Stock") — normalize both to compare structurally, no LLM needed here.
export function normalizeForMatch(s: string): string {
  return s.toLowerCase().replace(/[\s\-_]+/g, "");
}
