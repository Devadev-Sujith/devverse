import { useEffect, useRef, useState } from 'react'
import { profile } from '../config/profile'
import { blip, startAmbient, stopAmbient } from '../lib/audio'
import { useStore, type View } from '../lib/store'

type Line = { kind: 'in' | 'out' | 'err' | 'accent'; text: string }

const COMMANDS: Record<string, string> = {
  help: 'list commands',
  whoami: 'who built this universe',
  ls: 'list all worlds (projects)',
  land: 'land on a world: land <name|number>',
  skills: 'show the skill constellations',
  core: 'fly to the core (about me)',
  contact: 'open a comms channel',
  home: 'return to the overview',
  github: 'open my GitHub',
  sound: 'sound on | off',
  clear: 'clear the screen',
  exit: 'close the terminal',
}

export function Terminal() {
  const open = useStore((s) => s.terminal)
  const toggle = useStore((s) => s.toggleTerminal)
  const worlds = useStore((s) => s.worlds)
  const [lines, setLines] = useState<Line[]>([
    { kind: 'accent', text: `devverse shell · connected to ${profile.callsign.toLowerCase()}@core` },
    { kind: 'out', text: "type 'help' to list commands, Tab to autocomplete" },
  ])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [hIdx, setHIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])
  useEffect(() => {
    bodyRef.current?.scrollTo(0, bodyRef.current.scrollHeight)
  }, [lines])

  const go = (v: View) => useStore.getState().setView(v)

  const run = (raw: string) => {
    const cmd = raw.trim()
    const out: Line[] = [{ kind: 'in', text: cmd }]
    const [name, ...args] = cmd.split(/\s+/)
    const arg = args.join(' ')
    const say = (text: string, kind: Line['kind'] = 'out') => out.push({ kind, text })
    switch (name.toLowerCase()) {
      case '':
        break
      case 'help':
        Object.entries(COMMANDS).forEach(([k, v]) => say(`${k.padEnd(10)} ${v}`))
        break
      case 'whoami':
        say(`${profile.name}, ${profile.role}`, 'accent')
        profile.about.forEach((p) => say(p))
        break
      case 'ls':
        worlds.forEach((w, i) => say(`[${String(i + 1).padStart(2, '0')}] ${w.name.padEnd(32)} ${w.language ?? ''}`))
        say(`${worlds.length} worlds. try: land 1`, 'accent')
        break
      case 'land':
      case 'warp':
      case 'cd':
      case 'open': {
        const n = parseInt(arg, 10)
        const w = !isNaN(n) ? worlds[n - 1] : worlds.find((x) => x.name.toLowerCase().includes(arg.toLowerCase()))
        if (!arg || !w) say(`no world matches '${arg}'. run 'ls'`, 'err')
        else {
          say(`plotting course to ${w.name}…`, 'accent')
          useStore.getState().select(w.id)
        }
        break
      }
      case 'skills':
        profile.skills.forEach((g) => say(`${g.constellation}: ${g.skills.map((s) => s.name).join(', ')}`))
        go('skills')
        break
      case 'core':
      case 'about':
        go('core')
        say('engaging thrusters → core', 'accent')
        break
      case 'contact':
      case 'transmit':
        go('comms')
        say('comms channel open', 'accent')
        break
      case 'home':
        go('home')
        break
      case 'github':
        window.open(profile.contact.github, '_blank')
        break
      case 'sound':
        if (arg === 'off') {
          stopAmbient()
          useStore.getState().setSound(false)
          say('sound off')
        } else {
          startAmbient()
          useStore.getState().setSound(true)
          say('sound on')
        }
        break
      case 'clear':
        setLines([])
        setInput('')
        return
      case 'exit':
        toggle(false)
        break
      case 'sudo':
        if (arg.includes('hire')) say(`access granted ✔ ${profile.callsign} is ready for new missions. run 'contact'`, 'accent')
        else say('nice try.', 'err')
        break
      case 'rm':
        say('you cannot delete a universe. not today.', 'err')
        break
      default:
        say(`command not found: ${name}. type 'help'`, 'err')
    }
    blip(name ? 900 : 500, 0.05, 0.03)
    setLines((l) => [...l, ...out])
    if (cmd) setHistory((h) => [cmd, ...h])
    setHIdx(-1)
    setInput('')
  }

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') run(input)
    else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const i = Math.min(history.length - 1, hIdx + 1)
      if (history[i]) (setHIdx(i), setInput(history[i]))
    } else if (e.key === 'ArrowDown') {
      const i = Math.max(-1, hIdx - 1)
      setHIdx(i)
      setInput(i >= 0 ? history[i] : '')
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const [name, ...rest] = input.split(' ')
      if (!rest.length) {
        const m = Object.keys(COMMANDS).find((c) => c.startsWith(name))
        if (m) setInput(m + ' ')
      } else {
        const m = worlds.find((w) => w.name.toLowerCase().startsWith(rest.join(' ').toLowerCase()))
        if (m) setInput(`${name} ${m.name}`)
      }
    } else if (e.key === 'Escape') toggle(false)
    e.stopPropagation()
  }

  if (!open) return null
  return (
    <div className="terminal glass" onClick={() => inputRef.current?.focus()}>
      <div className="term-bar">
        <span className="lights">
          <i />
          <i />
          <i />
        </span>
        devverse — shell
        <button onClick={() => toggle(false)}>✕</button>
      </div>
      <div className="term-body" ref={bodyRef}>
        {lines.map((l, i) => (
          <div key={i} className={`tl ${l.kind}`}>
            {l.kind === 'in' && <span className="prompt">visitor@devverse:~$ </span>}
            {l.text}
          </div>
        ))}
        <div className="tl in">
          <span className="prompt">visitor@devverse:~$ </span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            spellCheck={false}
            autoComplete="off"
            aria-label="terminal input"
          />
        </div>
      </div>
    </div>
  )
}
