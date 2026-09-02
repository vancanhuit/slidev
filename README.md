# Presentation slides

A shared Slidev starter with the base presentation theme in `styles/index.css`.

## Use

```bash
npm install
npm run dev
```

Each root Markdown file except `README.md` is a deck. Its filename becomes its URL path. Create a production build with:

```bash
npm run build
```

The static site is written to `dist/<deck-name>/`. Public builds omit presenter notes and use hash routing so every deck works independently under its subpath.

Deploy all decks to `https://slides.canhdinh.com` with:

```bash
npm run deploy
```

`Dockerfile.debian13-systemd` is the tested image used by the deck's systemd example.

## Conventions

- Give each deck a descriptive Markdown filename; `scripts/build.mjs` discovers it automatically.
- Keep deck-wide settings in the headmatter at the top of each deck file.
- Put shared visual rules and brand tokens in `styles/index.css`.
- Put deck assets in `public/` and reference them from `/`.
- Use presenter notes in HTML comments below each slide.
