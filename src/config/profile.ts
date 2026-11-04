/**
 * ─────────────────────────────────────────────────────────────
 *  DEVVERSE CONFIG — this is the only file you need to edit.
 * ─────────────────────────────────────────────────────────────
 *  Projects are pulled automatically from GitHub. Every new public
 *  repo you push becomes a new planet, no code changes needed.
 *  Use `projects` below to hide repos, add demo links/taglines,
 *  or add projects that don't live on GitHub.
 */

export type Skill = { name: string; level: 1 | 2 | 3 | 4 | 5 }
export type SkillGroup = { constellation: string; domain: string; color: string; skills: Skill[] }
export type LogEntry = { when: string; title: string; detail?: string }
export type ProjectOverride = {
  tagline?: string
  description?: string
  demo?: string
  featured?: boolean
}
export type ExtraProject = {
  name: string
  description: string
  url?: string
  demo?: string
  language?: string
  topics?: string[]
  createdAt: string
}

export const profile = {
  githubUser: 'Devadev-Sujith',
  name: 'Devadev Sujith',
  callsign: 'DEVADEV',
  role: 'Software Engineer',
  tagline: 'I build apps and turn ideas into working software.',
  location: 'India',
  about: [
    'I am a software engineer who enjoys building things people can actually use, from native Android apps to web experiences and anything in between.',
    'Every planet in this system is something I have built. New ones show up automatically whenever I ship a project to GitHub, so this universe keeps growing.',
  ],
  /** Leave a value empty ('') to hide it. */
  contact: {
    email: '',
    github: 'https://github.com/Devadev-Sujith',
    linkedin: '',
    twitter: '',
    website: '',
    resume: '',
  },

  /** Each group becomes a constellation in the sky. level 1–5 = star brightness. */
  skills: [
    {
      constellation: 'Mobile Nebula',
      domain: 'Mobile',
      color: '#7cf7c9',
      skills: [
        { name: 'Kotlin', level: 4 },
        { name: 'Android SDK', level: 4 },
        { name: 'MotionLayout', level: 3 },
        { name: 'Java', level: 3 },
        { name: 'Material Design', level: 3 },
      ],
    },
    {
      constellation: 'Web Cluster',
      domain: 'Frontend',
      color: '#5cc8ff',
      skills: [
        { name: 'HTML', level: 5 },
        { name: 'CSS', level: 4 },
        { name: 'JavaScript', level: 4 },
        { name: 'TypeScript', level: 3 },
        { name: 'React', level: 3 },
      ],
    },
    {
      constellation: 'Engine Belt',
      domain: 'Backend & Data',
      color: '#ffb35c',
      skills: [
        { name: 'Python', level: 4 },
        { name: 'Node.js', level: 3 },
        { name: 'SQL', level: 3 },
        { name: 'REST APIs', level: 4 },
      ],
    },
    {
      constellation: 'Toolsmith',
      domain: 'Tools & Practices',
      color: '#c792ff',
      skills: [
        { name: 'Git', level: 5 },
        { name: 'GitHub', level: 5 },
        { name: 'Linux', level: 3 },
        { name: 'Problem Solving', level: 5 },
        { name: 'Open Source', level: 3 },
      ],
    },
  ] satisfies SkillGroup[],

  /** Extra milestones for the mission log (repos are added automatically). */
  log: [] as LogEntry[],

  projects: {
    includeForks: true,
    /** Repo names to keep out of the universe. */
    hidden: [] as string[],
    /** Per-repo tweaks, keyed by repo name. */
    overrides: {
      'Knowledge-Hub-Android-App': {
        tagline: 'An animated Android app for exploring tech fields',
        featured: true,
      },
      Catroid: {
        tagline: 'Open-source contribution: visual programming on Android',
      },
    } as Record<string, ProjectOverride>,
    /** Projects that are not public GitHub repos. */
    extra: [] as ExtraProject[],
  },
}
