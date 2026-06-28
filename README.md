# The Open Health Project

Interactive terminal thriller set in an NHS trust. A Vite + React single-page
experience with a split console/feed layout and time-advancing narrative.

**Live site:** [https://bobbyberta.github.io/one-health-network-narrative/](https://bobbyberta.github.io/one-health-network-narrative/)

## Local development

```bash
npm install
npm run dev
```

Story content lives in `src/data/story_data.json` (canonical for the app) and
`story_narrative.md` / `story_narrative_2.md` (authoring source). See
[IP_NOTICE.md](./IP_NOTICE.md).

## GitHub Pages deployment

This project deploys automatically on push to `main` via GitHub Actions.

1. Enable GitHub Pages with **GitHub Actions** as the source (Settings → Pages).
2. Push to `main`. The site is published at:

   [https://bobbyberta.github.io/one-health-network-narrative/](https://bobbyberta.github.io/one-health-network-narrative/)

The build sets `VITE_BASE_PATH` to match the repository name so assets resolve
correctly on GitHub Pages.

Note: GitHub Pages requires a public repository (or GitHub Pro for private Pages).

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Development server       |
| `npm run build`| Production build → `dist/` |
| `npm run preview` | Preview production build |

## Stack

- React 19, TypeScript, Vite 6
- Tailwind CSS v4
- Lucide React icons
