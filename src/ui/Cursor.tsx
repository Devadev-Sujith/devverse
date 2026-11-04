import { useEffect, useRef } from 'react'

export function Cursor() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    document.body.classList.add('custom-cursor')
    const pos = { x: -100, y: -100, tx: -100, ty: -100 }
    const move = (e: PointerEvent) => ((pos.tx = e.clientX), (pos.ty = e.clientY))
    let raf = 0
    const loop = () => {
      pos.x += (pos.tx - pos.x) * 0.25
      pos.y += (pos.ty - pos.y) * 0.25
      if (ref.current) ref.current.style.transform = `translate(${pos.x}px, ${pos.y}px)`
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('pointermove', move)
    loop()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      document.body.classList.remove('custom-cursor')
    }
  }, [])
  return (
    <div className="cursor" ref={ref}>
      <span />
    </div>
  )
}
