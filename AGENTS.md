# Repository Guide

## Deck Layout

- Each deployable deck lives at `decks/<slug>/slides.md`; `<slug>` is its public path at `https://slides.canhdinh.com/<slug>/`.
- Keep deck-specific files beside `slides.md`, including `styles/`, `public/`, examples, and Dockerfiles. Slidev treats the deck directory, not the repository root, as that deck's project root.
- `scripts/build.mjs` treats every immediate directory under `decks/` as a deck and expects each one to contain `slides.md`.
- `npm run dev`, `npm run dev:mise`, and `npm run export` target `decks/mise-introduction/slides.md`. Invoke `slidev decks/<slug>/slides.md` directly for another deck.

## Verification

- Run `npm run build` after changing deck content, styles, dependencies, or discovery logic. It deletes root `dist/`, builds every deck, omits presenter notes, and generates the root deck index.
- Public builds use `--base /<slug>/` and `--router-mode hash`; preserve both so independently hosted decks and direct slide links work without per-deck server rewrites.
- After changing `scripts/build.mjs`, `wrangler.jsonc`, or output structure, run `npm run build && npx wrangler deploy --dry-run` sequentially; the build deletes and recreates root `dist/`, so do not run these commands in parallel.
- There is no separate test, lint, formatter, or typecheck command.

## Fonts And Assets

- Code and technical labels use locally bundled `@fontsource/maple-mono` weights 400 and 600. Do not replace these imports with Google Fonts; Maple Mono is unavailable there.
- Deck-local `public/` paths are referenced from `/` in Slidev content.

## Deployment

- Cloudflare Worker `slidev` serves root `dist/` at `slides.canhdinh.com`; the `name` in `wrangler.jsonc` must remain `slidev` or Workers Builds will reject the deployment.
- Pushes to `main` run `npm run build` then `npx wrangler deploy` through Cloudflare Workers Builds. `npm run deploy` is the authenticated manual equivalent.
- `dist/`, `.wrangler/`, deck-local Slidev caches, PDFs, and PPTX files are generated and ignored; never commit them.
