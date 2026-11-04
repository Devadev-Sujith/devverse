import { useEffect, useState } from 'react'
import { profile } from '../config/profile'
import { startAmbient, whoosh } from '../lib/audio'
import { useStore } from '../lib/store'

export function Boot() {
  const worlds = useStore((s) => s.worlds)
  const loaded = useStore((s) => s.loaded)
  const setPhase = useStore((s) => s.setPhase)
  const sound = useStore((s) => s.sound)
  const setSound = useStore((s) => s.setSound)
  const [step, setStep] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const skills = profile.skills.reduce((n, g) => n + g.skills.length, 0)

  const lines = [
    ['DEVVERSE OS v1.0', 'cold boot'],
    ['calibrating stellar cartography', 'ok'],
    ['locking developer signature', profile.name.toUpperCase()],
    [`scanning github.com/${profile.githubUser}`, loaded ? `${worlds.length} worlds detected` : 'scanning…'],
    ['plotting skill constellations', `${skills} stars charted`],
    ['hyperdrive', 'charged 100%'],
  ]

  useEffect(() => {
    if (step >= lines.length) return
    if (step === 3 && !loaded) return
    const t = setTimeout(() => setStep((s) => s + 1), step === 0 ? 500 : 380)
    return () => clearTimeout(t)
  }, [step, loaded, lines.length])

  const ready = step >= lines.length

  const engage = () => {
    if (!ready || leaving) return
    if (sound) {
      startAmbient()
      whoosh(3)
    }
    setLeaving(true)
    setPhase('warp')
    setTimeout(() => setPhase('explore'), 2900)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return
      if (ready) engage()
      else if (loaded) setStep(lines.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className={`boot ${leaving ? 'leaving' : ''}`}>
      <div className="boot-inner">
        <pre className="boot-log">
          {lines.slice(0, step).map(([a, b], i) => (
            <div key={i} className="boot-line">
              <span className="dim">&gt; </span>
              {a}
              <span className="dots" />
              <span className="ok">{b}</span>
            </div>
          ))}
          {!ready && <span className="caret">▋</span>}
        </pre>
        <div className={`boot-hero ${ready ? 'show' : ''}`}>
          <div className="eyebrow">Welcome, traveler. You are entering the universe of</div>
          <h1 className="glitch" data-text={profile.name}>
            {profile.name}
          </h1>
          <div className="role">
            {profile.role} <span className="sep">//</span> {profile.tagline}
          </div>
          <button className="engage" onClick={engage} disabled={!ready}>
            <span>Engage hyperdrive</span>
            <kbd>↵</kbd>
          </button>
          <label className="sound-opt">
            <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} />
            Sound on (best with headphones)
          </label>
        </div>
      </div>
    </div>
  )
}
