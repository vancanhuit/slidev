# Presentation slides

A collection of Slidev decks using the shared local theme in `themes/forest/`.

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

The SSH tunnels deck covers local, remote, dynamic, and jump-host forwarding, with editable Excalidraw diagrams. Preview it with `npx slidev decks/ssh-tunnels/slides.md`; builds publish it under `/ssh-tunnels/`. See [its deck guide](decks/ssh-tunnels/README.md) for sources and diagram editing.

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
- Use `theme: ../../themes/forest` in each deck's headmatter. The theme owns fonts, colors, typography, column gutters, common layouts, syntax highlighting, and accessibility styles.
- Keep topic-specific diagrams and styles in the deck's `styles/index.css`; keep examples, assets, and route behavior beside the deck.
- Put deck assets in its `public/` directory and reference them from `/`.
- Use presenter notes in HTML comments below each slide.

## Shared theme

The Forest theme builds on `@slidev/theme-default`. Its defaults declare Inter and Maple Mono with automatic font-provider loading disabled: `styles/fonts.css` loads Inter once, and `styles/index.ts` bundles Maple Mono locally at weights 400 and 600. Do not request Maple Mono from Google Fonts.

Edit `themes/forest/styles/tokens.css` for the shared palette, typography roles, and column gap. Presentation text uses 18px body copy, at least 14px code and supporting labels, and a 24px two-column gutter on the default 980px canvas. These are canvas sizes; actual projected readability depends on the room and display. Dense examples should be shortened or split rather than reduced below the shared type scale. Reading mode keeps 16px body and code text without scaling the slide canvas.

The public deck index reuses the theme's font and color styles without loading Slidev. Theme changes must pass `npm run build`, the browser regression check above, and `npx wrangler deploy --dry-run`.

FloatingVue is temporarily pinned to 5.3.0: Shiki's Twoslash plugin accesses component internals removed in 5.4.0 and otherwise logs a startup error ([upstream issue](https://github.com/shikijs/shiki/issues/1329)). Remove the override once Shiki supports the new structure, then rerun the browser check and manually verify Twoslash hover popups.
