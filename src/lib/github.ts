import { profile } from '../config/profile'
import type { RepoData, Universe } from './types'

type ApiRepo = {
  name: string
  description: string | null
  html_url: string
  homepage: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  topics?: string[]
  created_at: string
  pushed_at: string
  size: number
  fork: boolean
  default_branch: string
}

const CACHE_KEY = `devverse:${profile.githubUser}:v1`

function fromApi(r: ApiRepo, languages?: Record<string, number>): RepoData {
  return {
    name: r.name,
    description: r.description,
    url: r.html_url,
    homepage: r.homepage,
    language: r.language,
    languages: languages ?? (r.language ? { [r.language]: 1 } : {}),
    stars: r.stargazers_count,
    forks: r.forks_count,
    topics: r.topics ?? [],
    createdAt: r.created_at,
    pushedAt: r.pushed_at,
    size: r.size,
    fork: r.fork,
    defaultBranch: r.default_branch,
  }
}

async function loadSnapshot(): Promise<RepoData[]> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}universe.json`, { cache: 'no-cache' })
    if (!res.ok) return []
    const data = (await res.json()) as Universe
    return data.user.toLowerCase() === profile.githubUser.toLowerCase() ? data.repos : []
  } catch {
    return []
  }
}

/**
 * Loads repos from the build-time snapshot (instant, no rate limits),
 * then asks the live GitHub API for anything pushed since the last deploy.
 */
export async function loadRepos(): Promise<RepoData[]> {
  const cached = sessionStorage.getItem(CACHE_KEY)
  if (cached) return JSON.parse(cached) as RepoData[]

  const snapshot = await loadSnapshot()
  const byName = new Map(snapshot.map((r) => [r.name, r]))

  try {
    const res = await fetch(
      `https://api.github.com/users/${profile.githubUser}/repos?per_page=100&sort=created`,
      { headers: { Accept: 'application/vnd.github+json' } },
    )
    if (!res.ok) throw new Error(String(res.status))
    const live = (await res.json()) as ApiRepo[]
    const merged = await Promise.all(
      live.map(async (r) => {
        const known = byName.get(r.name)
        if (known) return { ...fromApi(r, known.languages) }
        try {
          const lr = await fetch(`https://api.github.com/repos/${profile.githubUser}/${r.name}/languages`)
          return fromApi(r, lr.ok ? await lr.json() : undefined)
        } catch {
          return fromApi(r)
        }
      }),
    )
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(merged))
    return merged
  } catch {
    return snapshot
  }
}

export async function loadReadme(repo: RepoData): Promise<string | null> {
  if (repo.external) return null
  for (const file of ['README.md', 'readme.md', 'Readme.md']) {
    try {
      const res = await fetch(
        `https://raw.githubusercontent.com/${profile.githubUser}/${repo.name}/${repo.defaultBranch}/${file}`,
      )
      if (res.ok) return await res.text()
    } catch {
      /* try next */
    }
  }
  return null
}
