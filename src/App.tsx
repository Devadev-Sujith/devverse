import { useEffect, useState } from 'react'
import { loadRepos } from './lib/github'
import { useStore, type View } from './lib/store'
import { buildWorlds } from './lib/worlds'
import { Universe } from './scene/Universe'
import { Boot } from './ui/Boot'
import { Cursor } from './ui/Cursor'
import { Fallback } from './ui/Fallback'
import { Hud } from './ui/Hud'
import { CommsPanel, CorePanel, SkillsPanel, WorldList, WorldPanel } from './ui/Panels'
import { Terminal } from './ui/Terminal'

const hasWebGL = () => {
  try {
    return !!document.createElement('canvas').getContext('webgl2')
  } catch {
    return false
  }
}

const keyViews: Record<string, View> = { '1': 'core', '2': 'worlds', '3': 'skills', '4': 'comms' }

export default function App() {
  const phase = useStore((s) => s.phase)
  const view = useStore((s) => s.view)
  const selected = useStore((s) => s.selected)
  const setWorlds = useStore((s) => s.setWorlds)
  const [webgl] = useState(hasWebGL)

  useEffect(() => {
    loadRepos().then((repos) => setWorlds(buildWorlds(repos)))
  }, [setWorlds])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useStore.getState()
      if (s.phase !== 'explore' || (e.target as HTMLElement).tagName.match(/INPUT|TEXTAREA/)) return
      if (e.key === '`' || e.key === '~') {
        e.preventDefault()
        s.toggleTerminal()
      } else if (e.key === 'Escape') {
        if (s.terminal) s.toggleTerminal(false)
        else if (s.selected) s.select(null)
        else s.setView('home')
      } else if (keyViews[e.key]) {
        s.setView(s.view === keyViews[e.key] ? 'home' : keyViews[e.key])
      } else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && s.worlds.length) {
        const i = s.worlds.findIndex((w) => w.id === s.selected)
        const d = e.key === 'ArrowRight' ? 1 : -1
        s.select(s.worlds[(i + d + s.worlds.length) % s.worlds.length].id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!webgl) return <Fallback />

  return (
    <>
      <Universe />
      {phase !== 'explore' && <Boot />}
      {phase === 'explore' && (
        <>
          <Hud />
          {selected ? (
            <WorldPanel />
          ) : (
            <>
              {view === 'worlds' && <WorldList />}
              {view === 'core' && <CorePanel />}
              {view === 'skills' && <SkillsPanel />}
              {view === 'comms' && <CommsPanel />}
            </>
          )}
          <Terminal />
        </>
      )}
      <Cursor />
    </>
  )
}
