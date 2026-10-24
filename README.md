# Presentation slides

A collection of Slidev decks, each with its own theme in `decks/<slug>/styles/index.css`.

## Use

```bash
npm install
npm run dev
```

Each directory under `decks/` is a deck. Keep its `slides.md`, assets, and supporting examples together; the directory name becomes its URL path. Create a production build with:

```bash
npm run build
```

The static site is written to `dist/<deck-name>/`. Public builds omit presenter notes and use hash routing so every deck works independently under its subpath.

Published decks are listed at <https://slides.canhdinh.com>. The mise deck is available at
<https://slides.canhdinh.com/mise-introduction/>.

Use **Reading view** in the mise deck's navigation for a scrollable, phone-friendly version with every code step revealed. It is also available directly at <https://slides.canhdinh.com/mise-introduction/#/read>.

With the build served locally (for example, `python3 -m http.server 4173 --directory dist`) and `playwright-cli` installed, run the mise accessibility regression check:

```bash
playwright-cli -s=mise-check open 'http://localhost:4173/mise-introduction/'
playwright-cli -s=mise-check run-code --filename=decks/mise-introduction/checks/accessibility.js
```

Deploy all decks manually with:

```bash
npm run deploy
```

Pushes to `main` build and deploy automatically through Cloudflare Workers Builds.

## Conventions

- Give each deck a descriptive directory containing `slides.md`; `scripts/build.mjs` discovers it automatically.
- Keep deck-wide settings in the headmatter at the top of each deck's `slides.md`.
- Put deck visual rules and brand tokens in its `styles/index.css`.
- Put deck assets in its `public/` directory and reference them from `/`.
- Use presenter notes in HTML comments below each slide.
