// Snapshots public GitHub repos into public/universe.json at build time,
// so the site loads instantly and never depends on API rate limits.
// Set GITHUB_TOKEN to raise the rate limit (provided automatically in GitHub Actions).
import { readFileSync, writeFileSync } from 'node:fs'

const profileSrc = readFileSync(new URL('../src/config/profile.ts', import.meta.url), 'utf8')
const user = profileSrc.match(/githubUser:\s*'([^']+)'/)?.[1]
const out = new URL('../public/universe.json', import.meta.url)
const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'devverse' }
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

try {
  const res = await fetch(`https://api.github.com/users/${user}/repos?per_page=100&type=owner`, { headers })
  if (!res.ok) throw new Error(`GitHub API ${res.status}`)
  const repos = (await res.json()).filter((r) => !r.private)
  const data = await Promise.all(
    repos.map(async (r) => {
      const lr = await fetch(r.languages_url, { headers })
      return {
        name: r.name,
        description: r.description,
        url: r.html_url,
        homepage: r.homepage,
        language: r.language,
        languages: lr.ok ? await lr.json() : {},
        stars: r.stargazers_count,
        forks: r.forks_count,
        topics: r.topics ?? [],
        createdAt: r.created_at,
        pushedAt: r.pushed_at,
        size: r.size,
        fork: r.fork,
        defaultBranch: r.default_branch,
      }
    }),
  )
  writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), user, repos: data }, null, 2) + '\n')
  console.log(`[devverse] snapshotted ${data.length} repos for ${user}`)
} catch (e) {
  console.warn(`[devverse] could not refresh universe.json (${e.message}); keeping existing snapshot`)
}
