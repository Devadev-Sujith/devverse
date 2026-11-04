import { profile } from '../config/profile'
import { useStore } from '../lib/store'

/** Plain layout for devices without WebGL. */
export function Fallback() {
  const worlds = useStore((s) => s.worlds)
  return (
    <main className="fallback">
      <h1>{profile.name}</h1>
      <p>
        {profile.role} · {profile.tagline}
      </p>
      <h2>Projects</h2>
      <ul>
        {worlds.map((w) => (
          <li key={w.id}>
            <a href={w.url} target="_blank" rel="noreferrer">
              {w.name}
            </a>{' '}
            · {w.language} · {w.tagline ?? w.description}
          </li>
        ))}
      </ul>
      <h2>Skills</h2>
      <p>{profile.skills.flatMap((g) => g.skills.map((s) => s.name)).join(' · ')}</p>
      <p>
        <a href={profile.contact.github}>GitHub</a>
      </p>
    </main>
  )
}
