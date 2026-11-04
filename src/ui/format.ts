export function ago(iso: string) {
  const s = (Date.now() - +new Date(iso)) / 1000
  const units: [number, string][] = [
    [31536000, 'year'],
    [2592000, 'month'],
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
  ]
  for (const [sec, name] of units) {
    const v = Math.floor(s / sec)
    if (v >= 1) return `${v} ${name}${v > 1 ? 's' : ''} ago`
  }
  return 'just now'
}

export const date = (iso: string) => new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

export function stardate(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 0)
  const day = Math.floor((+d - +start) / 86400000)
  return `${d.getFullYear()}.${String(day).padStart(3, '0')}`
}
