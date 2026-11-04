export type RepoData = {
  name: string
  description: string | null
  url: string
  homepage: string | null
  language: string | null
  languages: Record<string, number>
  stars: number
  forks: number
  topics: string[]
  createdAt: string
  pushedAt: string
  size: number
  fork: boolean
  defaultBranch: string
  external?: boolean
}

export type PlanetKind = 'rocky' | 'gas' | 'ice' | 'lava' | 'ocean'

export type World = RepoData & {
  id: string
  index: number
  tagline?: string
  demo?: string
  featured: boolean
  color: string
  color2: string
  radius: number
  orbit: number
  speed: number
  phase: number
  incline: number
  kind: PlanetKind
  rings: boolean
  moons: number
  seed: number
}

export type Universe = { generatedAt: string; user: string; repos: RepoData[] }
