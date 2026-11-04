import { useEffect, useState } from 'react'
import { profile } from '../config/profile'
import { blip, startAmbient, stopAmbient } from '../lib/audio'
import { useStore, type View } from '../lib/store'
import { date, stardate } from './format'
import { Radar } from './Radar'

const nav: { id: View; label: string; key: string }[] = [
  { id: 'core', label: 'Core', key: '1' },
  { id: 'worlds', label: 'Worlds', key: '2' },
  { id: 'skills', label: 'Constellations', key: '3' },
  { id: 'comms', label: 'Transmit', key: '4' },
]

export function Hud() {
  const view = useStore((s) => s.view)
  const setView = useStore((s) => s.setView)
  const worlds = useStore((s) => s.worlds)
  const sound = useStore((s) => s.sound)
  const setSound = useStore((s) => s.setSound)
  const toggleTerminal = useStore((s) => s.toggleTerminal)
  const [hint, setHint] = useState(true)
  const newest = [...worlds].sort((a, b) => +new Date(b.pushedAt) - +new Date(a.pushedAt))[0]

  useEffect(() => {
    const t = setTimeout(() => setHint(false), 9000)
    return () => clearTimeout(t)
  }, [])

  const go = (v: View) => {
    blip(740, 0.08)
    setView(view === v ? 'home' : v)
  }

  return (
    <div className="hud">
      <header className="hud-top">
        <button className="brand" onClick={() => go('home')} title="Return to overview">
          <span className="logo">
            DEV<b>VERSE</b>
          </span>
          <span className="who">
            {profile.name} <i>·</i> {profile.role}
          </span>
        </button>
        <div className="hud-actions">
          <button className="icon-btn" onClick={() => toggleTerminal()} title="Terminal ( ` )">
            &gt;_
          </button>
          <button
            className={`icon-btn ${sound ? 'on' : ''}`}
            title="Sound"
            onClick={() => {
              const next = !sound
              setSound(next)
              if (next) startAmbient()
              else stopAmbient()
            }}
          >
            {sound ? '♪' : '∅'}
          </button>
          <a className="icon-btn" href={profile.contact.github} target="_blank" rel="noreferrer" title="GitHub">
            GH
          </a>
        </div>
      </header>

      <div className="telemetry glass">
        <div>
          <span>Stardate</span>
          <b>{stardate()}</b>
        </div>
        <div>
          <span>Worlds</span>
          <b>{worlds.length}</b>
        </div>
        {newest && (
          <div className="wide">
            <span>Latest activity</span>
            <b>
              {newest.name} · {date(newest.pushedAt)}
            </b>
          </div>
        )}
      </div>

      <nav className="dock glass">
        {nav.map((n) => (
          <button key={n.id} className={view === n.id ? 'active' : ''} onClick={() => go(n.id)}>
            <kbd>{n.key}</kbd>
            {n.label}
            {n.id === 'worlds' && <sup>{worlds.length}</sup>}
          </button>
        ))}
      </nav>

      <Radar />

      <div className={`hint ${hint ? 'show' : ''}`}>
        Drag to orbit · Scroll to zoom · Click a planet to land · Press <kbd>`</kbd> for the terminal
      </div>
    </div>
  )
}
