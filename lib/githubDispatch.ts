// lib/githubDispatch.ts (server-only): start the GitHub Actions deal reader
// (.github/workflows/rendered-scrape.yml) from the Vercel cron, which fires on
// time. GitHub's own schedule started that workflow 7-10 hours late Nov 22-25,
// 2026, so on Green Wednesday morning nothing had run. Needs a fine-grained
// GitHub token with "Actions: read and write" on this repo, saved in Vercel as
// GITHUB_DISPATCH_TOKEN; without it this does nothing.
import "server-only";

const REPO = "LetsSeeWhatSheDew/directory-network-";

export async function dispatchRenderedScrape(): Promise<"started" | "no_token" | `http_${number}` | "error"> {
  const token = process.env.GITHUB_DISPATCH_TOKEN;
  if (!token) return "no_token";
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/rendered-scrape.yml/dispatches`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" },
      body: JSON.stringify({ ref: "main", inputs: { apply: true } }),
      signal: AbortSignal.timeout(10000),
    });
    return r.status === 204 ? "started" : `http_${r.status}`;
  } catch {
    return "error";
  }
}
