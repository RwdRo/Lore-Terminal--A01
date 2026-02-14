// Fetches open pull requests from the lore repository via backend proxy.

export async function fetchOpenPullRequests(limit = 20, offset = 0) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset)
  });

  const response = await fetch(`/api/proposed?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`GitHub API error: HTTP ${response.status}`);
  }

  const payload = await response.json();
  const items = payload.items || [];

  return items.map((pr) => ({
    number: pr.number,
    title: pr.title,
    url: pr.html_url,
    author: pr.user?.login,
    created_at: pr.created_at,
    updated_at: pr.updated_at,
    labels: (pr.labels || []).map((label) => label.name)
  }));
}
