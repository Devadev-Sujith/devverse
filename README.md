# DEVVERSE

My portfolio, built as an explorable 3D universe instead of a web page.

- **The Core** (the star) is me: about, stats, and a mission log.
- **Worlds** (planets) are my projects, **pulled automatically from GitHub**. Every new public repo I push becomes a new planet on the outer frontier. No code changes needed.
- **Constellations** are my skills. Brighter stars mean deeper skills.
- **Transmit** is how to reach me.
- A working **terminal** (press <kbd>`</kbd>): `help`, `ls`, `land 1`, `skills`, `contact`, `sudo hire-me` …
- A nav radar, a warp-speed intro, ambient synth sound, keyboard shortcuts (`1`–`4`, `←`/`→`, `Esc`), and a mobile layout.

Built with React, Three.js (react-three-fiber), custom GLSL shaders, and Vite.

## Make it yours

Everything personal lives in **[`src/config/profile.ts`](src/config/profile.ts)**: name, bio, contact links, skills, extra milestones, and per-project overrides (tagline, deployment link, launch label, featured, hidden).

How planets are generated from your repos:

| Repo property | Planet trait |
| --- | --- |
| creation date | orbit (older repos are closer to the core) |
| primary language | color |
| size | planet size |
| number of languages | moons |
| stars, featured, or forked | rings |
| GitHub Pages enabled on the repo | standard Pages URL detected automatically |
| `homepage` field on GitHub | deployment link for other hosted projects |

The planet panel always shows a launch button. For GitHub Pages, Devverse uses GitHub's public repository metadata to detect Pages and derive the standard URL. If the repo has a custom domain or uses another host (such as Vercel or Netlify), add that address to the repo's **Website** field or a `demo` override. The button opens the deployment in a new tab when a URL is available; otherwise it appears gray and disabled. Set `launchLabel` in a repo's override to customize its label, for example `Launch game`, `Open website`, or `Get Android app`.

## Run locally

```bash
npm install
npm run dev
```

## Deploy

**GitHub Pages (recommended, free):** push to `main`, then go to *Settings → Pages → Source: GitHub Actions*. The included workflow (`.github/workflows/deploy.yml`) builds and deploys on every push, and also rebuilds daily so new repos get baked into the snapshot.

**Vercel / Netlify:** import the repo. The defaults work: build command `npm run build`, output directory `dist`.

### How the project data stays fresh

1. At build time, `scripts/build-universe.mjs` snapshots your public repos into `public/universe.json`. The site loads that instantly and doesn't depend on GitHub API rate limits.
2. At runtime, the site also asks the live GitHub API for repos created since the last deploy, so new projects appear right away.
