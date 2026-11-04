const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function inline(s: string) {
  return esc(s)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
}

/** Tiny, safe markdown renderer for README previews. */
export function renderMarkdown(md: string, maxLines = 80) {
  const lines = md.replace(/<[^>]+>/g, '').split('\n').slice(0, maxLines)
  const out: string[] = []
  let list = false
  let code = false
  for (const raw of lines) {
    const line = raw.trimEnd()
    if (line.startsWith('```')) {
      if (list) (out.push('</ul>'), (list = false))
      out.push(code ? '</pre>' : '<pre>')
      code = !code
      continue
    }
    if (code) {
      out.push(esc(line) + '\n')
      continue
    }
    const li = line.match(/^\s*(?:[-*+]|\d+\.)\s+(.*)/)
    if (li) {
      if (!list) (out.push('<ul>'), (list = true))
      out.push(`<li>${inline(li[1])}</li>`)
      continue
    }
    if (list) (out.push('</ul>'), (list = false))
    const h = line.match(/^(#{1,6})\s+(.*)/)
    if (h) out.push(`<h${Math.min(6, h[1].length + 2)}>${inline(h[2])}</h${Math.min(6, h[1].length + 2)}>`)
    else if (line.trim()) out.push(`<p>${inline(line)}</p>`)
  }
  if (list) out.push('</ul>')
  if (code) out.push('</pre>')
  return out.join('')
}
