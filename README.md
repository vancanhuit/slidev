# Presentation slides

A shared Slidev starter with the base presentation theme in `styles/index.css`.

## Use

```bash
npm install
npm run dev
```

Edit `microsandbox-introduction.md`, then create a production build with:

```bash
npm run build
```

The static site is written to `dist/` and can be hosted by any static-site provider.

`Dockerfile.debian13-systemd` is the tested image used by the deck's systemd example.

## Conventions

- Give each deck a descriptive Markdown filename and target it in the npm scripts.
- Keep deck-wide settings in the headmatter at the top of each deck file.
- Put shared visual rules and brand tokens in `styles/index.css`.
- Put deck assets in `public/` and reference them from `/`.
- Use presenter notes in HTML comments below each slide.
