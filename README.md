# Presentation slides

A shared Slidev starter with the base presentation theme in `styles/index.css`.

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

Published decks are listed at https://slides.canhdinh.com. This deck is available at
https://slides.canhdinh.com/microsandbox-introduction/.

Deploy all decks manually with:

```bash
npm run deploy
```

Pushes to `main` build and deploy automatically through Cloudflare Workers Builds.

`decks/microsandbox-introduction/Dockerfile.debian13-systemd` is the tested image used by the microsandbox deck.

## Conventions

- Give each deck a descriptive directory containing `slides.md`; `scripts/build.mjs` discovers it automatically.
- Keep deck-wide settings in the headmatter at the top of each deck's `slides.md`.
- Put deck visual rules and brand tokens in its `styles/index.css`.
- Put deck assets in its `public/` directory and reference them from `/`.
- Use presenter notes in HTML comments below each slide.
