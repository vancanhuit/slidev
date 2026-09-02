---
theme: default
title: microsandbox — A machine for every risky task
layout: cover
info: |
  An introduction to microsandbox for safely running untrusted workloads.
author: Canh Dinh
transition: slide-left
mdc: true
fonts:
  sans: Inter
  mono: Maple Mono
---

<div class="eyebrow author-line">Canh Dinh</div>
<div class="eyebrow topic-line">microVMs · untrusted workloads · 2026</div>

# Give risky code<br><span class="accent-text">its own machine.</span>

microsandbox makes hardware-isolated Linux environments feel like a function call.

<div class="accent-line" />

<div class="version-pill">microsandbox 0.6.16 · verified 2 Sep 2026</div>

<div class="footer-note">Isolation · policy · execution</div>

<!--
Open with the tension: modern software increasingly executes code it did not write and should not trust.
This talk is about moving that work out of the host without turning every task into an infrastructure project.
-->

---
layout: center
class: text-center
---

<div class="eyebrow">The premise</div>

# The code can be useful.<br>The code can also be hostile.

<div class="risk-row">
  <span>AI agents</span><span>User code</span><span>Plugins</span><span>CI jobs</span><span>Scrapers</span>
</div>

<div class="source">The right question is not “will it misbehave?” but “what can it reach when it does?”</div>

<!--
Ask the audience which of these they already execute. Most teams run several.
The same boundary problem appears in every example.
-->

---
layout: section
---

<div class="eyebrow">01 · Foundation</div>

# A microVM runtime,<br>not another container daemon

One sandbox. One Linux kernel. One private filesystem. One network boundary.

---
layout: two-cols-header
---

# microsandbox at a glance

A **local-first runtime** for running untrusted workloads in lightweight virtual machines.

::left::

<div class="stack-diagram">
  <div class="stack-box stack-risk">Untrusted workload</div>
  <div class="stack-box">Guest Linux kernel</div>
  <div class="stack-boundary">hardware virtualization</div>
  <div class="stack-box stack-host">Trusted host application</div>
</div>

::right::

- Starts as a child process
- Pulls familiar OCI images
- Needs no daemon or control plane
- Runs locally or on microsandbox cloud
- Exposes CLI and five language SDKs

<div class="source">SDKs: TypeScript · Rust · Python · Go · Ruby</div>

<!--
The defining difference is ownership of the kernel. Containers share the host kernel; this guest has its own.
The application starts the runtime directly, so there is no Docker socket or background daemon in the path.
-->

---

# Containers and microVMs solve different boundaries

<div class="comparison-grid">
  <div class="comparison-card muted-card">
    <div class="card-kicker">Container</div>
    <h2>Shared host kernel</h2>
    <p>Excellent packaging and process isolation for workloads you broadly trust.</p>
    <div class="boundary-label">namespace boundary</div>
  </div>
  <div class="comparison-card accent-card">
    <div class="card-kicker">microsandbox</div>
    <h2>Dedicated guest kernel</h2>
    <p>A hardware-enforced boundary for code you assume may be adversarial.</p>
    <div class="boundary-label">hypervisor boundary</div>
  </div>
</div>

<div class="source">Not “containers are unsafe.” Choose the boundary that matches the trust model.</div>

<!--
Avoid a simplistic containers-versus-VMs argument. Containers remain the right choice for many trusted services.
The decision starts with trust, not fashion.
-->

---
layout: section
---

<div class="eyebrow">02 · Security boundary</div>

# Because convenience should not<br>inherit ambient authority

Agents and build tools should not automatically receive your files, sockets, network, and credentials.

---

# Safe defaults before configuration

<div class="feature-grid">
  <div class="feature-card">
    <div class="feature-icon">01</div>
    <h2>Private root</h2>
    <p>The guest sees its image and only the mounts you explicitly provide.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">02</div>
    <h2>Public-only egress</h2>
    <p>Private, loopback, link-local, host, and metadata endpoints are denied.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">03</div>
    <h2>Bound resources</h2>
    <p>Defaults are 1 vCPU and 512 MiB; time and disk can be limited too.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">04</div>
    <h2>Brokered access</h2>
    <p>Commands, files, networking, and secrets cross host-controlled channels.</p>
  </div>
</div>

<!--
These defaults eliminate accidental host access. For high-stakes code, tighten them further with no network,
deny-by-default rules, read-only mounts, pinned images, and reduced in-guest privileges.
-->

---
layout: two-cols-header
---

# Credentials never enter the guest

Guest code receives a placeholder. The real secret materializes only at an allowed destination.

::left::

<div class="secret-flow">
  <div><span>Guest</span><strong>$MSB_GITHUB_TOKEN</strong><small>meaningless placeholder</small></div>
  <div class="secret-arrow">→</div>
  <div><span>Host boundary</span><strong>destination check</strong><small>DNS + TLS identity</small></div>
  <div class="secret-arrow">→</div>
  <div class="secret-approved"><span>api.github.com</span><strong>real token</strong><small>substituted in transit</small></div>
</div>

::right::

```bash
export GITHUB_TOKEN='...'

msb create alpine --name agent \
  --secret 'GITHUB_TOKEN@api.github.com'
```

<div class="callout compact-callout">
  <div class="callout-label">Anywhere else</div>
  <div class="callout-value">The placeholder stays useless.</div>
</div>

<div class="source">Prefer host environment or secret-store references; raw SDK values persist in sandbox configuration.</div>

<!--
This is stronger than putting a token in the guest environment. The workload can use the credential for one API
without ever learning its value. Keep allowed hosts narrow and prefer references over raw SDK values.
-->

---
layout: fact
---

# No daemon.

The SDK boots the microVM as a child process and talks to its guest agent directly.

<div class="fact-detail">create → execute → collect → stop</div>

<!--
This is the operational simplification: the isolation primitive can live inside application code.
It is not a remote scheduler unless you explicitly choose the cloud backend.
-->

---
layout: section
---

<div class="eyebrow">03 · Workloads</div>

# Where the boundary pays off

Especially when the workload can install packages, invoke tools, or reach the internet.

---

# The trust test

<div class="decision-flow">
  <div class="decision-node">Will external input become executable behavior?</div>
  <div class="decision-arrow">→</div>
  <div class="decision-node">Could it touch valuable host resources?</div>
  <div class="decision-arrow">→</div>
  <div class="decision-node decision-answer">Give it a sandbox</div>
</div>

<div class="usecase-strip">
  <div><strong>Agents</strong><br><span>shells, tools, generated code</span></div>
  <div><strong>CI</strong><br><span>PR checks and package scripts</span></div>
  <div><strong>Platforms</strong><br><span>user scripts and plugins</span></div>
  <div><strong>Automation</strong><br><span>scrapers and document jobs</span></div>
</div>

<div class="source">Keep trusted, long-running services on simpler infrastructure when a VM boundary adds no value.</div>

<!--
This avoids prescribing microsandbox everywhere. It earns its place at a real trust boundary.
-->

---
layout: two-cols-header
---

# A concrete case: test an untrusted pull request

Run install scripts and tests without executing the checkout on the host.

::left::

## Host does

1. Archive the exact commit
2. Start a bounded microVM
3. Stream committed files in
4. Collect the exit code

::right::

## Guest does

1. Install dependencies
2. Run package lifecycle scripts
3. Compile and test code
4. Disappear after the job

<div class="callout compact-callout">
  <div class="callout-label">The invariant</div>
  <div class="callout-value">The host never executes code from the checkout.</div>
</div>

---
layout: section
---

<div class="eyebrow">04 · Runtime</div>

# From zero to isolated code<br>in one command

The CLI uses an OCI image and returns the guest process output.

---

# Demo 1 · verify, then run

```bash {1|2|4|all}
# Node.js 24.20.0 LTS or newer (microsandbox requires Node >=22)
node --version

npx --yes microsandbox@0.6.16 run alpine:3.24 -- \
  sh -lc 'printf "kernel="; uname -r; printf "host="; hostname'
```

<div class="terminal-output">
  <div><span>$</span> node --version</div>
  <div>v24.20.0</div>
  <div><span>$</span> npx ...</div>
  <div>kernel=6.x.y-msb &nbsp; host=demo</div>
</div>

<div class="source">Pinned for reproducibility: microsandbox 0.6.16 · Alpine 3.24 · check the exact image digest for production.</div>

<!--
Before presenting, run msb doctor. The first run downloads runtime artifacts and the OCI image, so warm the cache.
The changing kernel patch output is intentional; the proof is that it is a guest kernel and hostname.
-->

---
layout: two-cols-header
---

# Inside `run`

Four stages, all driven by one local process.

::left::

<div class="numbered-flow">
  <div><span>1</span><strong>Resolve</strong><small>pull or reuse OCI layers</small></div>
  <div><span>2</span><strong>Assemble</strong><small>create a copy-on-write root</small></div>
  <div><span>3</span><strong>Boot</strong><small>start the microVM and guest agent</small></div>
  <div><span>4</span><strong>Execute</strong><small>use the host-guest command channel</small></div>
</div>

::right::

<div class="callout">
  <div class="callout-label">Not SSH</div>
  <div class="callout-value"><code>exec</code> travels over the guest command channel, not the sandbox network.</div>
</div>

<div class="callout">
  <div class="callout-label">Disposable by default</div>
  <div class="callout-value">The attached sandbox stops when the owning process exits.</div>
</div>

---

# Demo 2 · make isolation application code

```ts {1|3-6|8|10|all}
import { Sandbox } from "microsandbox";

await using sb = await Sandbox.builder("audience-demo")
  .image("alpine:3.24")
  .memory(512)
  .disableNetwork()
  .create();

const result = await sb.exec("sh", ["-lc", "id && uname -r"]);

console.log(result.stdout());
```

```bash
npm install microsandbox@0.6.16
node --experimental-strip-types demo.ts
```

<div class="source"><code>await using</code> guarantees best-effort cleanup for an attached local sandbox.</div>

<!--
Node 24 LTS supports type stripping, so this runs without adding tsx or a compiler.
The SDK package includes the local runtime and requires Node 22 or newer.
-->

---
layout: two-cols-header
---

# One VM, several control paths

Choose the interface that matches the caller; they converge on the same sandbox lifecycle.

::left::

<div class="control-grid">
  <div><strong>CLI</strong><span>humans and scripts</span></div>
  <div><strong>SDK</strong><span>application code</span></div>
  <div><strong>Filesystem API</strong><span>push code, pull results</span></div>
  <div><strong>SSH + SFTP</strong><span>existing developer tools</span></div>
  <div><strong>MCP + skills</strong><span>AI coding agents</span></div>
  <div><strong>REST</strong><span>cloud control plane</span></div>
</div>

::right::

<div class="callout">
  <div class="callout-label">Separate channel</div>
  <div class="callout-value">Exec and file transfer still work with guest networking disabled.</div>
</div>

```bash
msb create alpine --name offline --no-net
msb exec offline -- uname -a
msb cp ./input.txt offline:/tmp/input.txt
```

<div class="source">Native SSH needs no guest sshd, host TCP listener, or authorized key.</div>

<!--
The important architecture point is separation of concerns: disabling guest egress does not disable management.
Existing SSH-based tools can also connect through a host-side bridge without adding sshd to the guest image.
-->

---
layout: two-cols-header
---

# Build an init-equipped Debian 13 image

A regular Dockerfile is enough: install the init stack and make systemd the image command.

::left::

```dockerfile
FROM debian:13

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      systemd systemd-sysv dbus ca-certificates \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

CMD ["/lib/systemd/systemd"]
```

<div class="source">Dockerfile.debian13-systemd</div>

::right::

<div class="feature-grid compact-feature-grid">
  <div class="feature-card">
    <div class="feature-icon">01</div>
    <h2>systemd + systemd-sysv</h2>
    <p>Install the service manager and the standard <code>/sbin/init</code> link.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">02</div>
    <h2>D-Bus</h2>
    <p>Add the system bus expected by many Linux services and management tools.</p>
  </div>
  <div class="feature-card">
    <div class="feature-icon">03</div>
    <h2>Sensible default</h2>
    <p>Docker starts systemd by default; microsandbox <code>--init auto</code> probes its standard path.</p>
  </div>
</div>

<div class="source">Pin <code>debian:13</code> by digest for production reproducibility.</div>

<!--
This mirrors the maintained microsandbox guest-image pattern, updated and tested here with Debian 13.
Minimal base images do not contain systemd, so the capability must be deliberately included. The CMD is useful
outside microsandbox; --init auto discovers systemd from its standard path inside the image.
-->

---
layout: two-cols-header
---

# Boot systemd as PID 1

Build with Docker, import the archive, then separate the VM init from its long-running workload.

::left::

```bash
docker build \
  -f Dockerfile.debian13-systemd \
  -t msb-debian13-systemd:test .

docker save msb-debian13-systemd:test | \
  msb load --tag msb-debian13-systemd:test
```

::right::

```bash
msb run -d --name debian13-systemd \
  --memory 1G --cpus 2 --init auto \
  msb-debian13-systemd:test -- sleep infinity

msb exec debian13-systemd -- sh -lc \
  'cat /etc/debian_version; cat /proc/1/comm; \
   systemctl is-active systemd-journald dbus'
```

<div class="terminal-output">
  <div>13.6</div>
  <div>systemd</div>
  <div>active</div>
  <div>active</div>
</div>

<div class="source">Tested locally on 2 Sep 2026 with microsandbox 0.6.16.</div>

<!--
The trailing sleep is intentional for detached mode: --init auto assigns PID 1 to systemd while sleep is the
user workload that keeps this demo sandbox attached to useful lifecycle state. Verification confirmed Debian 13.6,
systemd as PID 1, and active journald and D-Bus services on this host.
-->

---

# Keep the Docker build. Change the runtime boundary.

microsandbox accepts Docker archives and OCI Image Layouts, so local images do not need a registry round trip.

<div class="handoff-flow">
  <div><span>1</span><strong>Build</strong><small>Docker creates the OCI image</small></div>
  <div class="handoff-arrow">→</div>
  <div><span>2</span><strong>Stream</strong><small>archive enters the msb cache</small></div>
  <div class="handoff-arrow">→</div>
  <div class="handoff-result"><span>3</span><strong>Run</strong><small>image boots as a microVM</small></div>
</div>

```bash
docker build -t my-image:latest .
docker save my-image:latest | msb load
msb run my-image:latest
```

<div class="comparison-grid mini-comparison">
  <div class="comparison-card">
    <div class="card-kicker">Direct import</div>
    <p>Fastest local handoff; no registry and no published artifact.</p>
  </div>
  <div class="comparison-card accent-card">
    <div class="card-kicker">Local registry</div>
    <p>Use push/pull when several machines need the same development image.</p>
  </div>
</div>

<div class="source">Local-only cache workflow · cloud sandboxes pull an OCI image reference instead.</div>

<!--
This is an adoption bridge, not a second build system. Teams can keep Dockerfiles and existing build tooling,
then import the resulting image into microsandbox for a stronger execution boundary.
-->

---
layout: two-cols-header
---

# Make the policy smaller than the threat

Start from the least authority the task needs.

::left::

```bash
msb run --name audit --replace \
  --cpus 1 --memory 512M \
  --max-duration 2m \
  --no-net \
  alpine:3.24 -- \
  sh -lc 'sha256sum /input/*'
```

::right::

- Pin the image and verify provenance
- Disable or allowlist network access
- Mount only required paths
- Prefer read-only inputs
- Set CPU, memory, disk, and duration caps
- Drop guest root when unnecessary

<div class="source">A microVM is a boundary, not a substitute for policy.</div>

<!--
The command assumes an input mount is added for the real workflow; it illustrates the desired policy shape.
Be explicit that image signatures are not verified automatically, so provenance still belongs to the operator.
-->

---

# Pay setup cost once, then fork clean workers

Snapshots capture the writable disk layer as a portable artifact, then cold-boot independent microVMs from it.

<div class="snapshot-flow">
  <div class="snapshot-step"><span>1</span><strong>Prepare</strong><small>install toolchain once</small></div>
  <div class="snapshot-line">→</div>
  <div class="snapshot-step snapshot-master"><span>2</span><strong>Snapshot</strong><small>portable disk state</small></div>
  <div class="snapshot-line">→</div>
  <div class="snapshot-fanout">
    <div>worker A</div><div>worker B</div><div>worker C</div>
  </div>
</div>

```bash
msb stop baseline
msb snapshot create toolchain --from baseline --integrity
msb run --name worker-a --from-snapshot toolchain -- npm test
```

<div class="source">Local-only · disk state, not memory · each worker gets an independent writable copy.</div>

<!--
This is the practical answer to expensive setup in CI and agent fleets. Snapshots pin the image identity and can
be archived with the image cache for fully offline transport. The source sandbox must be stopped first.
-->

---
layout: two-cols-header
---

# Policy once. Consistency everywhere.

Global configuration defines environment-owned defaults across the CLI and every SDK.

::left::

```json
{
  "sandbox_defaults": {
    "cpus": 2,
    "memory_mib": 1024
  },
  "active_profile": "local",
  "profiles": {
    "local": { "backend": "local" },
    "production": {
      "backend": "cloud",
      "api_key_ref": "env:MSB_API_KEY"
    }
  }
}
```

<div class="source">~/.microsandbox/config.json</div>

::right::

<div class="numbered-flow precedence-flow">
  <div><span>1</span><strong>Explicit</strong><small>CLI flags or SDK builder</small></div>
  <div><span>2</span><strong>Environment</strong><small>global config defaults</small></div>
  <div><span>3</span><strong>Runtime</strong><small>built-in defaults</small></div>
</div>

<div class="callout compact-callout">
  <div class="callout-label">Host-owned policy</div>
  <div class="callout-value">A deployment profile sets an isolation floor workloads cannot weaken.</div>
</div>

<div class="source">Keep image, network, mounts, secrets, and lifecycle with the workload; editing global config affects future sandboxes only.</div>

<!--
Global configuration is for choices the environment owns: default resources, host policy, registry access,
backend profiles, and host integration. Workload policy stays explicit in code, CLI flags, or reusable YAML.
Most values follow normal specificity, but the host deployment profile is authoritative and cannot be relaxed.
-->

---

# Local now, cloud when needed

<div class="backend-switch">
  <div class="backend-card">
    <div class="card-kicker">Local</div>
    <h2>Your hardware</h2>
    <p>KVM on Linux, Hypervisor.framework on Apple Silicon, or WHP on Windows.</p>
  </div>
  <div class="switch-arrow">same SDK →</div>
  <div class="backend-card accent-card">
    <div class="card-kicker">Cloud · private beta</div>
    <h2>Hosted hardware</h2>
    <p>Select the backend and provide an API key; application code stays the same.</p>
  </div>
</div>

```bash
export MSB_BACKEND=cloud
export MSB_API_KEY='msb_...'
node demo.ts
```

<div class="source">Some host-specific features differ in cloud; lifecycle, exec, files, network policy, and secrets share the core model.</div>

---
layout: section
---

<div class="eyebrow">05 · Ownership</div>

# Ownership follows<br>the trust boundary

Platform teams provide the safe primitive; application teams define the narrow policy.

---

# Teams at the boundary

<div class="persona-grid">
  <div class="persona-card">
    <div class="persona-role">AI builders</div>
    <h2>Let agents act</h2>
    <p>Offer shells, package installs, and generated-code execution without sharing the host.</p>
  </div>
  <div class="persona-card">
    <div class="persona-role">Platform engineers</div>
    <h2>Ship one boundary</h2>
    <p>Standardize limits, mounts, networking, secrets, lifecycle, and observability.</p>
  </div>
  <div class="persona-card">
    <div class="persona-role">Security teams</div>
    <h2>Reduce blast radius</h2>
    <p>Assume compromise and constrain what the guest can see, reach, and consume.</p>
  </div>
</div>

<div class="source">Also useful to CI, developer-tools, education, automation, and code-execution platforms.</div>

---
layout: center
class: text-center
---

<div class="eyebrow">Takeaway</div>

# Treat execution as a<br><span class="accent-text">trust-boundary decision.</span>

<div class="takeaway-grid">
  <div><strong>Runtime</strong><span>local-first microVMs</span></div>
  <div><strong>Boundary</strong><span>hardware-isolated blast radius</span></div>
  <div><strong>Signal</strong><span>external input becomes execution</span></div>
  <div><strong>Workflow</strong><span>OCI image + CLI or SDK</span></div>
  <div><strong>Owners</strong><span>teams operating risky workloads</span></div>
</div>

<div class="accent-line mx-auto" />

<!--
Return to the opening question: what can code reach when it misbehaves?
The practical answer is to give it a deliberately small machine and policy.
-->

---
layout: center
class: text-center
---

<div class="eyebrow">Try it</div>

# `npx microsandbox@0.6.16 run alpine:3.24`

<div class="link-card">
  <a href="https://docs.microsandbox.dev/getting-started/introduction">docs.microsandbox.dev/getting-started/introduction</a>
</div>

<div class="footer-links">
  <span>github.com/superradcompany/microsandbox</span>
  <span>Apache-2.0</span>
</div>

<!--
End on a command the audience can photograph and reproduce.
Remind local users to run msb doctor and cloud users that hosted access is currently private beta.
-->
