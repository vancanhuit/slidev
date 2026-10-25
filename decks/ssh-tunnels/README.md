# SSH tunnels

A detailed Slidev deck based on [Ivan Velichko's SSH Tunnels tutorial](https://labs.iximiuz.com/tutorials/ssh-tunnels), using the shared Forest theme. Designed for developers who know basic IP addresses, ports, and terminal commands; allow about 60 minutes with discussion.

## Present and build

From the repository root:

```bash
npx slidev decks/ssh-tunnels/slides.md
npm run build
```

The build automatically discovers the deck and writes `dist/ssh-tunnels/`, served at `/ssh-tunnels/`. No deployment configuration changes are needed. The root `npm run dev` still opens the mise deck.

To check the production deck in a browser, serve `dist/` and use the repository's Playwright CLI workflow:

```bash
python3 -m http.server 4173 --directory dist
# In another terminal, with playwright-cli installed:
playwright-cli -s=ssh-check open http://localhost:4173/ssh-tunnels/
playwright-cli -s=ssh-check run-code --filename=decks/ssh-tunnels/checks/presentation.js
```

The check visits all 40 slides in light and dark themes, verifies code and slide bounds, loads all eight diagrams under the production base path, and checks the mobile canvas and catalog link. It does not run SSH against a live server. Mobile presentation uses Slidev's scaled canvas, not a custom reading view.

For an optional PDF export, use the browser/export prerequisites documented by Slidev:

```bash
npx slidev export decks/ssh-tunnels/slides.md
```

## Content and sources

The deck covers the forwarding mental model, local and remote forwarding, bastions and ProxyJump, local and remote SOCKS, DNS and TLS, binding and policy, lifecycle management, troubleshooting, and practice prompts with a debrief. Speaker notes add context; the public build omits those notes.

The tutorial supplies the core scenarios and lab topology. The OpenSSH manuals linked on the final slide are the source for the expanded configuration and caveats. PostgreSQL and curl manuals are linked for the client-specific TLS examples.

The documentation network `203.0.113.0/24` belongs to the tutorial's simulated lab. Replace addresses, accounts, keys, hostnames, and certificate paths for any other environment. `3000` in local-development examples corresponds to the tutorial's preconfigured local service on `80`.

Remote-forward examples normally request loopback explicitly. The tutorial's lab has `GatewayPorts yes`, which **forces wildcard remote listeners even when loopback is requested**. Inspect the actual socket and effective server configuration; the deck's loopback-only exercises require an appropriate `no` / `clientspecified` policy. The tutorial's automated reverse-forward checks expect its original published-listener commands.

## Excalidraw diagrams

Eight original diagrams live in `public/diagrams/` as paired `.excalidraw` sources and `.svg` exports. They were created with Excalidraw and exported using its SVG renderer; the SVGs also embed the editable scene. Rendering the slides requires no Excalidraw runtime or external image requests. Hosts and process labels use sans-serif type; address/port labels use an embedded copy of the project's local Maple Mono font.

To edit:

1. Open <https://excalidraw.com> and load a `.excalidraw` file (or its scene-embedded SVG).
2. Keep labels and arrow directions consistent with the command on the corresponding slide.
3. Save the source and export SVG with the background and embedded scene enabled, replacing the paired files. The editable source uses Excalidraw's built-in monospace font as a fallback; preserve the existing SVG's embedded Maple Mono `@font-face` style and apply its `font-family="Maple Mono, monospace"` to the exported address/port text.
4. Run `npm run build` and inspect the affected slide for clipping and readability.

Host panels identify the SSH client side in pale blue, the SSH server side in pale green, and separate target hosts in pale amber. A blue outlined process box marks the new listener, even when it lives on the server side. Solid green arrows are encrypted SSH; dashed amber arrows are ordinary TCP. Filled arrowheads show request direction; responses return on the same connections. The separate thin blue arrow in the remote-forward diagram shows SSH-session initiation, not incoming application traffic.

Host names, host roles, process names, and endpoints have separate type sizes and aligned positions. Each host and each process node is grouped in the editable source, so moving a box also moves its labels.
