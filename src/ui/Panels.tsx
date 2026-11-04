import { useEffect, useMemo, useState } from 'react'
import { profile } from '../config/profile'
import { blip } from '../lib/audio'
import { languageColor } from '../lib/colors'
import { loadReadme } from '../lib/github'
import { renderMarkdown } from '../lib/markdown'
import { useStore } from '../lib/store'
import type { World } from '../lib/types'
import { ago, date } from './format'

const kindLabel = { rocky: 'Terrestrial', gas: 'Gas giant', ice: 'Ice world', lava: 'Volcanic', ocean: 'Oceanic' }

function Panel({ className = '', children, onClose }: { className?: string; children: React.ReactNode; onClose?: () => void }) {
  return (
    <aside className={`panel glass ${className}`}>
      <div className="scan" />
      {onClose && (
        <button className="close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      )}
      {children}
    </aside>
  )
}

function LanguageBar({ languages }: { languages: Record<string, number> }) {
  const total = Object.values(languages).reduce((a, b) => a + b, 0)
  const entries = Object.entries(languages).sort((a, b) => b[1] - a[1])
  if (!total) return null
  return (
    <div className="langs">
      <div className="lang-bar">
        {entries.map(([l, v]) => (
          <span key={l} style={{ width: `${(v / total) * 100}%`, background: languageColor(l) }} />
        ))}
      </div>
      <div className="lang-legend">
        {entries.map(([l, v]) => (
          <span key={l}>
            <i style={{ background: languageColor(l) }} />
            {l} <em>{((v / total) * 100).toFixed(1)}%</em>
          </span>
        ))}
      </div>
    </div>
  )
}

function Readme({ world }: { world: World }) {
  const [state, setState] = useState<{ id: string; html: string | null } | null>(null)
  useEffect(() => {
    let live = true
    loadReadme(world).then((md) => live && setState({ id: world.id, html: md ? renderMarkdown(md) : null }))
    return () => {
      live = false
    }
  }, [world])
  if (!state || state.id !== world.id) return <div className="readme loading">Decrypting transmission…</div>
  if (!state.html) return null
  return (
    <details className="readme" open>
      <summary>Transmission log · README</summary>
      <div className="md" dangerouslySetInnerHTML={{ __html: state.html }} />
    </details>
  )
}

export function WorldPanel() {
  const worlds = useStore((s) => s.worlds)
  const selected = useStore((s) => s.selected)
  const select = useStore((s) => s.select)
  const world = worlds.find((w) => w.id === selected)
  if (!world) return null
  const i = worlds.indexOf(world)
  const step = (d: number) => {
    blip(600 + d * 100, 0.08)
    select(worlds[(i + d + worlds.length) % worlds.length].id)
  }
  return (
    <Panel key={world.id} className="world-panel" onClose={() => select(null)}>
      <div className="eyebrow" style={{ color: world.color }}>
        World #{world.index + 1} · {world.fork ? 'Contribution' : kindLabel[world.kind]}
        {world.featured && <span className="badge">Featured</span>}
      </div>
      <h2 className="glitch" data-text={world.name}>
        {world.name}
      </h2>
      {world.tagline && <p className="tagline">{world.tagline}</p>}
      {(world.description || !world.tagline) && <p className="desc">{world.description ?? 'No description beamed back yet.'}</p>}
      <div className="stats">
        <div>
          <span>Primary tech</span>
          <b style={{ color: world.color }}>{world.language ?? 'n/a'}</b>
        </div>
        <div>
          <span>Stars</span>
          <b>{world.stars}</b>
        </div>
        <div>
          <span>Forked</span>
          <b>{world.forks}</b>
        </div>
        <div>
          <span>Formed</span>
          <b>{date(world.createdAt)}</b>
        </div>
        <div>
          <span>Last activity</span>
          <b>{ago(world.pushedAt)}</b>
        </div>
        <div>
          <span>Mass</span>
          <b>{world.size >= 1024 ? `${(world.size / 1024).toFixed(1)} MB` : `${world.size} KB`}</b>
        </div>
      </div>
      <LanguageBar languages={world.languages} />
      {world.topics.length > 0 && (
        <div className="chips">
          {world.topics.map((t) => (
            <span key={t}>#{t}</span>
          ))}
        </div>
      )}
      <div className="actions">
        {world.url && (
          <a className="btn primary" href={world.url} target="_blank" rel="noreferrer">
            View source ↗
          </a>
        )}
        {world.demo && (
          <a className="btn" href={world.demo} target="_blank" rel="noreferrer">
            Launch demo ↗
          </a>
        )}
      </div>
      <Readme world={world} />
      <div className="pager">
        <button onClick={() => step(-1)}>← Prev world</button>
        <span>
          {i + 1} / {worlds.length}
        </span>
        <button onClick={() => step(1)}>Next world →</button>
      </div>
    </Panel>
  )
}

export function WorldList() {
  const worlds = useStore((s) => s.worlds)
  const hovered = useStore((s) => s.hovered)
  const hover = useStore((s) => s.hover)
  const select = useStore((s) => s.select)
  const setView = useStore((s) => s.setView)
  const sorted = [...worlds].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  return (
    <Panel className="list-panel" onClose={() => setView('home')}>
      <div className="eyebrow">Star chart</div>
      <h2>Worlds I&apos;ve built</h2>
      <p className="desc">
        Each planet is a project pulled live from GitHub. Older worlds orbit close to the core, and every new one I ship forms on
        the frontier.
      </p>
      <ul className="world-list">
        {sorted.map((w) => (
          <li
            key={w.id}
            className={hovered === w.id ? 'hot' : ''}
            onMouseEnter={() => hover(w.id)}
            onMouseLeave={() => hover(null)}
            onClick={() => {
              blip(660, 0.1)
              select(w.id)
            }}
            style={{ ['--c' as string]: w.color }}
          >
            <span className="orb" />
            <div>
              <b>{w.name}</b>
              <small>
                {w.language ?? 'n/a'} · {w.fork ? 'contribution' : date(w.createdAt)}
              </small>
              {(w.tagline || w.description) && <p>{w.tagline ?? w.description}</p>}
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

export function CorePanel() {
  const worlds = useStore((s) => s.worlds)
  const setView = useStore((s) => s.setView)
  const select = useStore((s) => s.select)
  const languages = useMemo(() => new Set(worlds.flatMap((w) => Object.keys(w.languages))), [worlds])
  const log = useMemo(
    () =>
      [
        ...profile.log.map((l) => ({ ...l, id: undefined as string | undefined })),
        ...worlds.map((w) => ({
          when: w.createdAt,
          title: w.fork ? `Joined ${w.name}` : `Formed ${w.name}`,
          detail: w.tagline ?? w.description ?? undefined,
          id: w.id,
        })),
      ].sort((a, b) => +new Date(b.when) - +new Date(a.when)),
    [worlds],
  )
  const first = worlds[0]
  return (
    <Panel className="core-panel" onClose={() => setView('home')}>
      <div className="eyebrow">Core · origin of everything here</div>
      <h2 className="glitch" data-text={profile.name}>
        {profile.name}
      </h2>
      <p className="tagline">
        {profile.role} · {profile.location}
      </p>
      {profile.about.map((p, i) => (
        <p key={i} className="desc">
          {p}
        </p>
      ))}
      <div className="stats">
        <div>
          <span>Worlds</span>
          <b>{worlds.length}</b>
        </div>
        <div>
          <span>Languages</span>
          <b>{languages.size}</b>
        </div>
        <div>
          <span>Skills charted</span>
          <b>{profile.skills.reduce((n, g) => n + g.skills.length, 0)}</b>
        </div>
        {first && (
          <div className="wide">
            <span>First world formed</span>
            <b>{date(first.createdAt)}</b>
          </div>
        )}
      </div>
      <h3>Mission log</h3>
      <ol className="timeline">
        {log.map((l, i) => (
          <li key={i} onClick={() => l.id && select(l.id)} className={l.id ? 'link' : ''}>
            <time>{isNaN(+new Date(l.when)) ? l.when : date(l.when)}</time>
            <b>{l.title}</b>
            {l.detail && <p>{l.detail}</p>}
          </li>
        ))}
      </ol>
    </Panel>
  )
}

export function SkillsPanel() {
  const setView = useStore((s) => s.setView)
  return (
    <Panel className="skills-panel" onClose={() => setView('home')}>
      <div className="eyebrow">Constellations</div>
      <h2>My skill sky</h2>
      <p className="desc">Every star is a skill. The brighter it burns, the deeper I know it.</p>
      <div className="skill-groups">
        {profile.skills.map((g) => (
          <div key={g.constellation} style={{ ['--c' as string]: g.color }}>
            <b>{g.constellation}</b>
            <small>{g.domain}</small>
            <div className="skill-chips">
              {g.skills.map((s) => (
                <span key={s.name} style={{ opacity: 0.45 + s.level * 0.11 }}>
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

export function CommsPanel() {
  const setView = useStore((s) => s.setView)
  const { contact } = profile
  const [msg, setMsg] = useState('')
  const links = [
    ['Email', contact.email && `mailto:${contact.email}`],
    ['GitHub', contact.github],
    ['LinkedIn', contact.linkedin],
    ['X / Twitter', contact.twitter],
    ['Website', contact.website],
    ['Résumé', contact.resume],
  ].filter(([, v]) => v) as [string, string][]
  return (
    <Panel className="comms-panel" onClose={() => setView('home')}>
      <div className="eyebrow">Transmit · open a channel</div>
      <h2>Let&apos;s build something</h2>
      <p className="desc">Hiring, collaborating, or just want to say hi? Send a signal and I&apos;ll pick it up.</p>
      <div className="channels">
        {links.map(([label, href]) => (
          <a key={label} href={href} target="_blank" rel="noreferrer" className="channel">
            <span>{label}</span>
            <em>{href.replace(/^mailto:|^https?:\/\/(www\.)?/, '')}</em>
          </a>
        ))}
      </div>
      {contact.email && (
        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault()
            window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent('Signal from your Devverse')}&body=${encodeURIComponent(msg)}`
          }}
        >
          <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Compose transmission…" rows={4} />
          <button className="btn primary" type="submit">
            Transmit ↗
          </button>
        </form>
      )}
    </Panel>
  )
}
