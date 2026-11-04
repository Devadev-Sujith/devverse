export const languageColors: Record<string, string> = {
  Kotlin: '#A97BFF',
  Java: '#e76f00',
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  HTML: '#e34c26',
  CSS: '#663399',
  SCSS: '#c6538c',
  Dart: '#00B4AB',
  Swift: '#F05138',
  Go: '#00ADD8',
  Rust: '#dea584',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Shell: '#89e051',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  'Jupyter Notebook': '#DA5B0B',
  Solidity: '#AA6746',
  Dockerfile: '#384d54',
}

export function languageColor(lang: string | null | undefined, fallback = '#8be9fd') {
  return (lang && languageColors[lang]) || fallback
}
