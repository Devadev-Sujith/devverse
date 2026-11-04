import { useEffect, useRef } from 'react'
import { sim } from '../lib/sim'
import { useStore } from '../lib/store'
import { worldPosition } from '../lib/worlds'

const SIZE = 170

export function Radar() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const worlds = useStore((s) => s.worlds)
  const select = useStore((s) => s.select)

  useEffect(() => {
    const cv = canvas.current!
    const dpr = window.devicePixelRatio || 1
    cv.width = SIZE * dpr
    cv.height = SIZE * dpr
    const ctx = cv.getContext('2d')!
    ctx.scale(dpr, dpr)
    let raf = 0
    const p: [number, number, number] = [0, 0, 0]
    const draw = () => {
      const { selected, hovered } = useStore.getState()
      const max = (worlds.at(-1)?.orbit ?? 40) + 16
      const k = (SIZE / 2 - 8) / max
      const c = SIZE / 2
      ctx.clearRect(0, 0, SIZE, SIZE)
      ctx.strokeStyle = 'rgba(120,200,255,0.12)'
      ctx.lineWidth = 1
      for (const w of worlds) {
        ctx.beginPath()
        ctx.arc(c, c, w.orbit * k, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.strokeStyle = 'rgba(120,200,255,0.25)'
      ctx.setLineDash([2, 3])
      ctx.beginPath()
      ctx.arc(c, c, (max - 2) * k, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      const sweep = (performance.now() / 1000) % (Math.PI * 2)
      const grad = ctx.createConicGradient(sweep, c, c)
      grad.addColorStop(0, 'rgba(124,247,201,0.35)')
      grad.addColorStop(0.12, 'rgba(124,247,201,0)')
      grad.addColorStop(1, 'rgba(124,247,201,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(c, c, SIZE / 2 - 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffb35c'
      ctx.shadowColor = '#ffb35c'
      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.arc(c, c, 4, 0, Math.PI * 2)
      ctx.fill()
      for (const w of worlds) {
        worldPosition(w, sim.t, p)
        const x = c + p[0] * k
        const y = c + p[2] * k
        const hot = w.id === selected || w.id === hovered
        ctx.shadowColor = w.color
        ctx.shadowBlur = hot ? 14 : 6
        ctx.fillStyle = w.color
        ctx.beginPath()
        ctx.arc(x, y, hot ? 4.5 : 3, 0, Math.PI * 2)
        ctx.fill()
        if (hot) {
          ctx.strokeStyle = w.color
          ctx.beginPath()
          ctx.arc(x, y, 8, 0, Math.PI * 2)
          ctx.stroke()
        }
      }
      ctx.shadowBlur = 0
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [worlds])

  const onClick = (e: React.MouseEvent) => {
    const r = canvas.current!.getBoundingClientRect()
    const max = (worlds.at(-1)?.orbit ?? 40) + 16
    const k = (SIZE / 2 - 8) / max
    const mx = (e.clientX - r.left - SIZE / 2) / k
    const mz = (e.clientY - r.top - SIZE / 2) / k
    const p: [number, number, number] = [0, 0, 0]
    let best: string | null = null
    let bd = 12 / k
    for (const w of worlds) {
      worldPosition(w, sim.t, p)
      const d = Math.hypot(p[0] - mx, p[2] - mz)
      if (d < bd) ((bd = d), (best = w.id))
    }
    if (best) select(best)
  }

  return (
    <div className="radar glass">
      <div className="hud-title">Nav radar</div>
      <canvas ref={canvas} style={{ width: SIZE, height: SIZE }} onClick={onClick} />
    </div>
  )
}
