// github.js
// Fetches open pull requests from the alien-worlds/aw-lore repository.
// Returns title, url, author and creation date for each PR.

export async function fetchOpenPullRequests() {
  const url = 'https://api.github.com/repos/alien-worlds/aw-lore/pulls?state=open';

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'A01-Lore-App'
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: HTTP ${response.status}`);
  }

  const pulls = await response.json();
  return pulls.map(pr => ({
    title: pr.title,
    url: pr.html_url,
    author: pr.user?.login,
    created_at: pr.created_at
  }));
}
