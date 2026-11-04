import { create } from 'zustand'
import type { World } from './types'

export type Phase = 'boot' | 'warp' | 'explore'
export type View = 'home' | 'worlds' | 'skills' | 'core' | 'comms'

type State = {
  phase: Phase
  view: View
  worlds: World[]
  loaded: boolean
  selected: string | null
  hovered: string | null
  terminal: boolean
  sound: boolean
  setPhase: (p: Phase) => void
  setView: (v: View) => void
  setWorlds: (w: World[]) => void
  select: (id: string | null) => void
  hover: (id: string | null) => void
  toggleTerminal: (open?: boolean) => void
  setSound: (on: boolean) => void
}

export const useStore = create<State>((set) => ({
  phase: 'boot',
  view: 'home',
  worlds: [],
  loaded: false,
  selected: null,
  hovered: null,
  terminal: false,
  sound: true,
  setPhase: (phase) => set({ phase }),
  setView: (view) => set({ view, selected: null }),
  setWorlds: (worlds) => set({ worlds, loaded: true }),
  select: (selected) => set(selected ? { selected, view: 'worlds' } : { selected }),
  hover: (hovered) => set({ hovered }),
  toggleTerminal: (open) => set((s) => ({ terminal: open ?? !s.terminal })),
  setSound: (sound) => set({ sound }),
}))
