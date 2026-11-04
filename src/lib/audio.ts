let ctx: AudioContext | null = null
let master: GainNode | null = null
let ambient: GainNode | null = null

function ensure() {
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = 0.6
    master.connect(ctx.destination)
  }
  return ctx
}

export function startAmbient() {
  const c = ensure()
  if (c.state === 'suspended') void c.resume()
  if (ambient) {
    ambient.gain.linearRampToValueAtTime(0.05, c.currentTime + 1.5)
    return
  }
  ambient = c.createGain()
  ambient.gain.value = 0
  ambient.gain.linearRampToValueAtTime(0.05, c.currentTime + 3)
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 420
  filter.Q.value = 6
  const lfo = c.createOscillator()
  const lfoGain = c.createGain()
  lfo.frequency.value = 0.05
  lfoGain.gain.value = 260
  lfo.connect(lfoGain).connect(filter.frequency)
  lfo.start()
  for (const [f, type] of [
    [55, 'sawtooth'],
    [55.4, 'sawtooth'],
    [82.4, 'triangle'],
    [110.2, 'sine'],
  ] as const) {
    const o = c.createOscillator()
    o.type = type
    o.frequency.value = f
    o.connect(filter)
    o.start()
  }
  filter.connect(ambient).connect(master!)
}

export function stopAmbient() {
  if (ctx && ambient) ambient.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8)
}

export function blip(freq = 880, dur = 0.08, vol = 0.05) {
  if (!ctx || ctx.state !== 'running') return
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(freq, ctx.currentTime)
  o.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + dur)
  g.gain.setValueAtTime(vol, ctx.currentTime)
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur)
  o.connect(g).connect(master!)
  o.start()
  o.stop(ctx.currentTime + dur)
}

export function whoosh(dur = 2.5) {
  const c = ensure()
  if (c.state === 'suspended') void c.resume()
  const len = c.sampleRate * dur
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const src = c.createBufferSource()
  src.buffer = buf
  const f = c.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.setValueAtTime(200, c.currentTime)
  f.frequency.exponentialRampToValueAtTime(3000, c.currentTime + dur * 0.6)
  f.frequency.exponentialRampToValueAtTime(150, c.currentTime + dur)
  const g = c.createGain()
  g.gain.value = 0.25
  src.connect(f).connect(g).connect(master!)
  src.start()
}
