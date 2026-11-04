import { profile } from '../config/profile'
import { languageColor } from './colors'
import type { PlanetKind, RepoData, World } from './types'

export function hash(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967295
}

function rand(seed: number, n: number) {
  const x = Math.sin(seed * 9301 + n * 49297) * 233280
  return x - Math.floor(x)
}

function shift(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16)
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v + amount * 255)))
  const r = ch((n >> 16) & 255)
  const g = ch((n >> 8) & 255)
  const b = ch(n & 255)
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}

const kinds: PlanetKind[] = ['rocky', 'gas', 'ice', 'lava', 'ocean']

/** Oldest repos orbit closest to the core: every new project expands the universe outward. */
export function buildWorlds(repos: RepoData[]): World[] {
  const { hidden, overrides, includeForks, extra } = profile.projects
  const all: RepoData[] = [
    ...repos.filter((r) => !hidden.includes(r.name) && (includeForks || !r.fork)),
    ...extra.map((e) => ({
      name: e.name,
      description: e.description,
      url: e.url ?? '',
      homepage: e.demo ?? null,
      language: e.language ?? null,
      languages: e.language ? { [e.language]: 1 } : {},
      stars: 0,
      forks: 0,
      topics: e.topics ?? [],
      createdAt: e.createdAt,
      pushedAt: e.createdAt,
      size: 500,
      fork: false,
      defaultBranch: 'main',
      external: true,
    })),
  ]
  all.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))

  let orbit = 17
  return all.map((r, index) => {
    const seed = hash(r.name)
    const o = overrides[r.name] ?? {}
    const topLang = r.language ?? Object.entries(r.languages).sort((a, b) => b[1] - a[1])[0]?.[0]
    const base = languageColor(topLang, ['#8be9fd', '#ff79c6', '#50fa7b', '#bd93f9'][index % 4])
    const radius = Math.min(4.6, 1.5 + Math.log10(Math.max(10, r.size)) * 0.6 + (o.featured ? 0.6 : 0))
    orbit += radius * 2 + 6 + rand(seed, 1) * 3
    const langCount = Object.keys(r.languages).length
    return {
      ...r,
      language: r.language ?? Object.entries(r.languages).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
      description: o.description ?? r.description,
      id: r.name.toLowerCase(),
      index,
      tagline: o.tagline,
      demo: o.demo ?? (r.homepage || undefined),
      featured: !!o.featured,
      color: base,
      color2: shift(base, rand(seed, 2) > 0.5 ? 0.25 : -0.25),
      radius,
      orbit,
      speed: 0.9 / Math.pow(orbit, 1.1),
      phase: index * 2.4 + rand(seed, 3) * 0.6,
      incline: (rand(seed, 4) - 0.5) * 0.25,
      kind: r.fork ? 'ice' : kinds[Math.floor(rand(seed, 5) * kinds.length)],
      rings: r.stars > 0 || !!o.featured || r.fork || rand(seed, 6) > 0.7,
      moons: Math.min(3, Math.max(0, langCount - 1)),
      seed,
    }
  })
}

export function worldPosition(w: World, t: number, out: [number, number, number] = [0, 0, 0]) {
  const a = w.phase + t * w.speed
  out[0] = Math.cos(a) * w.orbit
  out[2] = Math.sin(a) * w.orbit
  out[1] = Math.sin(a) * w.orbit * w.incline
  return out
}
