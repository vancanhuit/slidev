# Presentation slides

A shared Slidev starter with the base presentation theme in `styles/index.css`.

## Use

```bash
npm install
npm run dev
```

Edit `slides.md`, then create a production build with:

```bash
npm run build
```

The static site is written to `dist/` and can be hosted by any static-site provider.

## Conventions

- Keep deck-wide settings in the headmatter at the top of `slides.md`.
- Put shared visual rules and brand tokens in `styles/index.css`.
- Put deck assets in `public/` and reference them from `/`.
- Use presenter notes in HTML comments below each slide.
