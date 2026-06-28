# The Open Health Project

Interactive terminal thriller set in an NHS trust. A Vite + React single-page
experience with a split console/feed layout and time-advancing narrative.

## Local development

```bash
npm install
cp src/data/story_data.example.json src/data/story_data.json
# Replace story_data.json with the full story file (not committed to git)
npm run dev
```

## Story data (protected IP)

The full narrative lives in `src/data/story_data.json`. That file is **gitignored**
so the story is not stored in the repository. See [IP_NOTICE.md](./IP_NOTICE.md).

For local work, keep your copy of `story_data.json` on disk only.

## GitHub Pages deployment

This project deploys automatically on push to `main` via GitHub Actions.

1. Create the `STORY_DATA` repository secret: base64-encoded contents of
   `src/data/story_data.json`:

   ```bash
   base64 -i src/data/story_data.json | gh secret set STORY_DATA
   ```

2. Enable GitHub Pages with **GitHub Actions** as the source (Settings → Pages).

3. Push to `main`. The site is published at:

   `https://<username>.github.io/one-health-network-narrative/`

The build sets `VITE_BASE_PATH` to match the repository name so assets resolve
correctly on GitHub Pages.

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
