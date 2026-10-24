---
theme: ../../themes/forest
title: mise - One command for every project
layout: cover
info: |
  An introduction to mise for managing development tools, environments, and tasks.
author: Canh Dinh
mdc: true
---

# Make every project<br><span class="accent-text">set itself up.</span>

mise gives a repository one place to declare its tools, environment, and commands.

<div class="cover-meta">
  <span class="author-line">Canh Dinh</span>
  <span>tools · environments · tasks · 2026</span>
  <span>mise 2026.9.0 · verified 2 Sep 2026</span>
</div>

<div class="footer-note">install · activate · run</div>

<!--
Open with the recurring onboarding problem: the README says which runtimes to install, another file describes
environment variables, and package scripts cover only one ecosystem. mise turns those instructions into config.
-->

---
layout: center
class: text-center
---

# “Works on my machine” starts<br>before the application runs.

<div class="problem-row">
  <span>Node 24?</span><span>Python 3.13?</span><span>Terraform?</span><span>Which env?</span><span>Which command?</span>
</div>

<div class="source">A project is more than its package dependencies.</div>

---
layout: section
---

# One executable.<br>Three jobs.

Tools, environment variables, and project tasks converge in `mise.toml`.

<div class="section-label">01 · Model</div>

---

# mise at a glance

<div class="feature-columns">
  <div class="feature">
    <h2>Dev tools</h2>
    <p>Install and switch runtimes and CLIs by project directory.</p>
  </div>
  <div class="feature">
    <h2>Environments</h2>
    <p>Load project variables and PATH entries with the selected tools.</p>
  </div>
  <div class="feature">
    <h2>Tasks</h2>
    <p>Give developers and CI the same named commands and dependencies.</p>
  </div>
</div>

<div class="source">One Rust binary · Linux, macOS, and Windows · compatible with asdf configuration</div>

<!--
Do not pitch mise as only a version manager. Its value is the shared environment that joins all three jobs.
-->

---

# Replace a stack of single-purpose managers

<div class="replacement-flow">
  <dl class="manager-list">
    <div><dt><code>nvm</code></dt><dd>Node</dd></div>
    <div><dt><code>pyenv</code></dt><dd>Python</dd></div>
    <div><dt><code>rbenv</code></dt><dd>Ruby</dd></div>
    <div><dt><code>goenv</code></dt><dd>Go</dd></div>
    <div><dt><code>tfenv</code></dt><dd>Terraform</dd></div>
  </dl>
  <div class="flow-arrow" aria-hidden="true">→</div>
  <div class="replacement-result"><code>mise</code><p>all of them</p></div>
</div>

<div class="callout">
  <div class="callout-label">Migration path</div>
  <div class="callout-value">Keep <code>.tool-versions</code>; mise can read it and use asdf plugins when needed.</div>
</div>

---
layout: two-cols-header
---

# The directory selects the environment

mise walks upward, merges configuration, then puts the right tool binaries first on `PATH`.

::left::

<div class="tree-flow">
  <div><strong>~/.config/mise/config.toml</strong><span>global defaults · node@lts</span></div>
  <div><strong>~/work/mise.toml</strong><span>organization tools · terraform</span></div>
  <div class="tree-current"><strong>~/work/api/mise.toml</strong><span>project override · go@1.27.1</span></div>
</div>

::right::

<div class="resolution-flow">
  <div><span>1</span><strong>Discover</strong><small>config files from root to cwd</small></div>
  <div><span>2</span><strong>Resolve</strong><small>requested versions and backends</small></div>
  <div><span>3</span><strong>Install</strong><small>missing tools when requested</small></div>
  <div><span>4</span><strong>Activate</strong><small>PATH + project environment</small></div>
</div>

---
layout: section
---

# From zero to a project toolchain

Install mise, choose how it enters the shell, then declare what the project needs.

<div class="section-label">02 · First run</div>

---
layout: two-cols-header
---

# Install one binary

The official release is recommended on macOS and Linux; Scoop is recommended on Windows.

::left::

```bash
# macOS or Linux
curl https://mise.run | sh

# Windows
scoop install mise
```

::right::

```bash
# zsh
printf '%s\n' \
  'eval "$(~/.local/bin/mise activate zsh)"' \
  >> ~/.zshrc

exec zsh
mise doctor
```

::bottom::

<div class="source">Other supported installs include Homebrew, system packages, Cargo, npm, and GitHub Releases.</div>

<!--
The curl installer is the project's preferred optimized release on macOS and Linux. If organizational policy
requires a package manager, use one; the workflow after installation is the same.
-->

---

# Three ways to enter the mise environment

<div class="comparison-scroll" role="region" aria-label="Environment entry point comparison" tabindex="0">
<table class="comparison-table">
  <thead><tr><th scope="col">Entry point</th><th scope="col">Behavior</th><th scope="col">Best fit</th></tr></thead>
  <tbody>
    <tr>
      <th scope="row"><code>mise activate</code><small>Interactive shell</small></th>
      <td>Updates PATH and environment automatically as you change directories.</td>
      <td>recommended for terminals</td>
    </tr>
    <tr>
      <th scope="row"><code>mise exec</code><small>Explicit command</small></th>
      <td>Creates the environment for one command without shell integration.</td>
      <td>ideal for scripts and one-offs</td>
    </tr>
    <tr>
      <th scope="row">Shims<small>Command wrappers</small></th>
      <td>Useful for CI and IDEs, but not every hook or env behavior is available.</td>
      <td>fallback when activation does not fit</td>
    </tr>
  </tbody>
</table>
</div>

---

# Demo 1 · run a tool without installing it globally

```bash {1|2|4|all}
mise exec node@latest -- node --version
# v26.8.1

mise exec terraform@latest -- terraform version
# Terraform v1.16.0
```

<div class="terminal-flow">
  <div><span>request</span><strong>node@latest</strong></div>
  <div class="flow-arrow">→</div>
  <div><span>mise</span><strong>resolve + install</strong></div>
  <div class="flow-arrow">→</div>
  <div class="terminal-result"><span>process</span><strong>temporary PATH</strong></div>
</div>

<div class="source"><code>mise x</code> is the short alias for <code>mise exec</code>.</div>

---
layout: two-cols-header
---

# `mise use` is the command to remember

It installs the requested tools and records them as active in project configuration.

::left::

```bash
mkdir demo && cd demo

mise use node@latest pnpm@latest

node --version
pnpm --version
```

::right::

```toml
# mise.toml
[tools]
node = "26.8.1"
pnpm = "11.25.0"
```

<div class="callout">
  <div class="callout-label">Global default</div>
  <div class="callout-value"><code>mise use --global node@latest</code></div>
</div>

---

# Install is not the same as activate

<div class="comparison-scroll" role="region" aria-label="Install and use command comparison" tabindex="0">
<table class="comparison-table">
  <thead><tr><th scope="col">Command</th><th scope="col">What happens</th><th scope="col">Keep in mind</th></tr></thead>
  <tbody>
    <tr>
      <th scope="row"><code>mise install</code></th>
      <td><strong>Put bits on disk</strong><p>Installs declared or requested versions under the mise data directory.</p></td>
      <td>does not select a version by itself</td>
    </tr>
    <tr>
      <th scope="row"><code>mise use</code></th>
      <td><strong>Install + declare</strong><p>Installs the version and writes it into project or global configuration.</p></td>
      <td>the normal day-to-day command</td>
    </tr>
  </tbody>
</table>
</div>

<div class="source">After cloning an existing project, run <code>mise install</code> to install everything already declared.</div>

---
layout: section
---

# The repository becomes executable documentation

`mise.toml` states which tools, values, and workflows make the project whole.

<div class="section-label">03 · Configuration</div>

---

# One file, the complete developer contract

```toml {1-4|6-9|11-17|all}
[tools]
go = "1.27.1"
golangci-lint = "2.13.2"

[env]
APP_ENV = { default = "development" }
_.path = "./bin"

[tasks.lint]
description = "Lint Go code"
run = "golangci-lint run"

[tasks.check]
depends = ["lint", "test"]
```

<div class="contract-row">
  <div><strong>Tools</strong><span>what executes</span></div>
  <div><strong>Environment</strong><span>what it receives</span></div>
  <div><strong>Tasks</strong><span>how the team invokes it</span></div>
</div>

---
layout: two-cols-header
---

# Configuration composes by scope

Broad defaults come from parents; the closest project config wins where values overlap.

::left::

```text
~/.config/mise/config.toml
└── ~/work/mise.toml
    └── ~/work/api/mise.toml
        └── current directory
```

::right::

- Put personal defaults in global config
- Put shared policy at a workspace root
- Put project requirements in the repository
- Keep machine-only overrides out of shared config

::bottom::

<div class="source">Use <code>mise config ls</code> and <code>mise ls</code> to inspect sources.</div>

---

# Existing version files can stay

<div class="compat-grid">
  <div><strong>.tool-versions</strong><span>asdf compatibility</span></div>
  <div><strong>.nvmrc</strong><span>Node.js</span></div>
  <div><strong>.python-version</strong><span>Python</span></div>
  <div><strong>rust-toolchain.toml</strong><span>Rust</span></div>
  <div><strong>global.json</strong><span>.NET</span></div>
  <div><strong>package.json</strong><span>package managers</span></div>
</div>

```bash
mise settings add idiomatic_version_file_enable_tools node
```

<div class="source">Idiomatic version files are opt-in; enable only the tool formats your projects use.</div>

---
layout: two-cols-header
---

# The registry chooses an installation backend

Short names keep project config readable; explicit backend names remain available.

::left::

<div class="backend-list">
  <div><strong>core</strong><span>Node, Python, Ruby, Go, Java</span></div>
  <div><strong>aqua</strong><span>verified registry binaries</span></div>
  <div><strong>github</strong><span>GitHub release assets</span></div>
  <div><strong>ecosystems</strong><span>npm, pipx, cargo, gem, go</span></div>
</div>

::right::

```bash
# Registry shorthand
mise use ripgrep@latest

# Explicit source
mise use github:BurntSushi/ripgrep

# Language ecosystem
mise use npm:prettier@latest # 3.9.6
```

::bottom::

<div class="source">Prefer core and verified binary backends over runtime-bound package installers when available.</div>

---
layout: section
---

# Correct tools are only half the setup

The same directory can also select variables, dotenv files, and project executables.

<div class="section-label">04 · Environment</div>

---
layout: two-cols-header
---

# Environment follows the project

::left::

```toml
[env]
NODE_ENV = { default = "development" }
API_URL = "http://localhost:8080"
_.path = "./bin"
_.file = ".env"
```

::right::

```bash
mise set LOG_LEVEL=debug
mise env --json

mise exec -- \
  sh -c 'echo "$NODE_ENV $API_URL"'
```

<div class="callout">
  <div class="callout-label">Default means default</div>
  <div class="callout-value">An existing non-empty process value wins.</div>
</div>

---

# Keep configuration and secrets separate

<div class="trust-grid">
  <div class="trust-zone">
    <h2>Commit</h2>
    <h3>Names and safe defaults</h3>
    <p>Tool versions, local URLs, modes, task definitions, and dotenv filenames.</p>
  </div>
  <div class="trust-zone danger-zone">
    <h2>Do not commit</h2>
    <h3>Secret values</h3>
    <p>Tokens and credentials belong in ignored files, CI secrets, or a secret manager.</p>
  </div>
</div>

<div class="source">The mise docs recommend fnox for provider-backed secrets; sops and age integrations are experimental.</div>

---
layout: section
---

# One command surface for humans and CI

Tasks run with the same tools and environment declared by the project.

<div class="section-label">05 · Tasks</div>

---
layout: two-cols-header
---

# A complete Go project in four files

::left::

```go
// main.go
package main

import "fmt"

func greeting(name string) string {
	return "Hello, " + name + "!"
}

func main() {
	fmt.Println(greeting("mise"))
}
```

::right::

```toml
# mise.toml
[tools]
go = "1.27.1"
golangci-lint = "2.13.2"

[tasks.test]
run = "go test ./..."

[tasks.lint]
run = "golangci-lint run"

[tasks.check]
depends = ["test", "lint"]
```

::bottom::

<div class="source">Runnable source: <code>decks/mise-introduction/examples/go-lint/</code></div>

---

# Demo 2 · install, test, lint

```bash {1|2|3-6|7-13|all}
cd decks/mise-introduction/examples/go-lint
mise install
mise current go
# 1.27.1
mise current golangci-lint
# 2.13.2
mise run check
# [test] $ go test ./...
# [lint] $ golangci-lint run
# [test] ok  example.com/mise-hello  (cached)
# [lint] 0 issues.
# Finished in 384.6ms
```

<div class="onboarding-flow">
  <div><span>1</span><strong>Read config</strong><small>discover project contract</small></div>
  <div class="flow-arrow">→</div>
  <div><span>2</span><strong>Install tools</strong><small>resolve every declared version</small></div>
  <div class="flow-arrow">→</div>
  <div class="terminal-result"><span>3</span><strong>Run workflow</strong><small>same command as CI</small></div>
</div>

<div class="source">The same two tasks run in parallel with the tools selected by this directory.</div>

---

# Tasks can skip work that is already fresh

```toml
[tasks.build]
run = "go build -o bin/hello ."
sources = ["go.mod", "*.go"]
outputs = ["bin/hello"]
```

<div class="freshness-grid">
  <div><strong>Inputs unchanged</strong><span>skip the task</span></div>
  <div><strong>Source newer</strong><span>run the task</span></div>
  <div><strong>Output missing</strong><span>run the task</span></div>
</div>

<div class="source">Start with normal source/output freshness. Artifact caching is experimental and needs complete deterministic inputs.</div>

---
layout: section
---

# Ranges are convenient.<br>Locks make them repeatable.

Resolve friendly requests into exact artifacts for teammates and CI.

<div class="section-label">06 · Reproducibility</div>

---
layout: two-cols-header
---

# Add a lockfile when exact installs matter

::left::

```toml
[tools]
go = "1.27.1"
golangci-lint = "2.13.2"

[settings]
lockfile = true
```

```bash
mise lock
git add mise.toml mise.lock
```

::right::

<div class="resolution-flow lock-flow">
  <div><span>1</span><strong>Request</strong><small>human-friendly version range</small></div>
  <div><span>2</span><strong>Resolve</strong><small>exact version and download</small></div>
  <div><span>3</span><strong>Record</strong><small>URL, checksum, provenance where supported</small></div>
  <div><span>4</span><strong>Replay</strong><small>same artifact in CI</small></div>
</div>

---

# CI consumes the same contract

```yaml
steps:
  - uses: actions/checkout@v7.0.1

  - uses: jdx/mise-action@v4.3.0

  - run: mise run check
```

<div class="shared-command"><code>mise run check</code></div>

<div class="execution-contexts">
  <div>
    <h2>Developer</h2>
    <p>Local tools, environment, and task graph.</p>
  </div>
  <div>
    <h2>CI</h2>
    <p>The same declared versions and task graph.</p>
  </div>
</div>

---

# Project configuration can execute code

<div class="security-flow">
  <div><strong>Inspect</strong><span>tasks, hooks, templates, env sources</span></div>
  <div class="flow-arrow">→</div>
  <div><strong>Trust</strong><span>approve configuration you control</span></div>
  <div class="flow-arrow">→</div>
  <div class="security-result"><strong>Execute</strong><span>install tools or run tasks</span></div>
</div>

```bash
mise trust

# Resolve untrusted config without project code execution
MISE_SAFE=1 mise lock --bump --dry-run --json
```

<div class="source">Treat a new repository's <code>mise.toml</code> like its shell scripts and build configuration.</div>

---

# Adopt mise one layer at a time

<ol class="adoption-steps">
  <li><strong>Tools</strong><small>replace version managers</small></li>
  <li><strong>Environment</strong><small>move safe project defaults</small></li>
  <li><strong>Tasks</strong><small>standardize entry points</small></li>
  <li><strong>Lock</strong><small>pin artifacts where needed</small></li>
</ol>

<div class="callout">
  <div class="callout-label">Smallest useful start</div>
  <div class="callout-value"><code>mise use go@latest golangci-lint@latest</code></div>
</div>

<div class="source">No migration project is required. Each layer is independently useful.</div>

---
layout: center
class: text-center
---

# Put the development contract<br><span class="accent-text">inside the repository.</span>

<div class="takeaway-grid">
  <div><strong>Declare</strong><span>tools and versions</span></div>
  <div><strong>Enter</strong><span>the right environment</span></div>
  <div><strong>Run</strong><span>shared project tasks</span></div>
  <div><strong>Repeat</strong><span>locally and in CI</span></div>
</div>

---
layout: center
class: text-center
---

# `mise exec go@latest -- go version`

<a class="link-card" href="https://mise.jdx.dev/getting-started.html">mise.jdx.dev/getting-started.html</a>

<div class="footer-links">
  <span>github.com/jdx/mise</span>
  <span>MIT</span>
</div>

<!--
End with a command that works without shell activation or project setup. The next step is to run mise use inside
a real repository and commit the resulting mise.toml.
-->
