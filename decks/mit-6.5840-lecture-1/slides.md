---
theme: default
title: MIT 6.5840 Lecture 1 - Introduction and MapReduce
layout: cover
info: |
  An original teaching deck based on MIT 6.5840 Lecture 1 notes and the MapReduce paper.
author: Canh Dinh
transition: slide-left
mdc: true
fonts:
  sans: Inter
  mono: Maple Mono
---

<div class="eyebrow">MIT 6.5840 · Distributed Systems Engineering</div>

# One program.<br><span class="accent-text">A thousand machines.</span>

## Lecture 1 · Introduction through MapReduce

<div class="signal-line"><span></span><span></span><span></span><span></span><span></span></div>

<div class="footer-note">Based on the 2026 lecture notes and Dean & Ghemawat, OSDI 2004</div>

<!--
Open with the core promise of distributed infrastructure: the application author writes a small program,
while the system coordinates a large and unreliable collection of machines.
-->

---
layout: center
class: text-center
---

<div class="eyebrow">The definition</div>

# A distributed system is a group of computers<br><span class="accent-text">cooperating to provide a service.</span>

<div class="chip-row">
  <span>storage</span><span>communication</span><span>computation</span>
</div>

<div class="source">The course studies infrastructure that hides distribution from applications.</div>

---

# Why distribute at all?

<div class="reason-grid">
  <div><b>01</b><strong>Capacity</strong><span>Parallel CPUs, memory, disks, and links handle more work.</span></div>
  <div><b>02</b><strong>Fault tolerance</strong><span>Replicas keep a service alive when machines fail.</span></div>
  <div><b>03</b><strong>Physical reach</strong><span>Place computation near users, sensors, and data.</span></div>
  <div><b>04</b><strong>Isolation</strong><span>Separate components to reduce security impact.</span></div>
</div>

<div class="source">The payoff is large. So is the coordination cost.</div>

---
layout: two-cols-header
---

# Distribution creates its own problems

The machines cooperate, but they do not share one clock, one memory, or one fate.

::left::

<div class="pressure-list">
  <div><strong>Concurrency</strong><span>Events overlap in surprising orders.</span></div>
  <div><strong>Partial failure</strong><span>One component fails while the rest continue.</span></div>
  <div><strong>Bottlenecks</strong><span>Network and skew defeat parallelism.</span></div>
  <div><strong>Complexity</strong><span>Interactions grow faster than machine count.</span></div>
</div>

::right::

<div class="failure-scene" aria-label="Four machines where one has failed">
  <div class="machine"><i></i><span>worker 01</span></div>
  <div class="machine"><i></i><span>worker 02</span></div>
  <div class="machine failed"><i></i><span>worker 03</span></div>
  <div class="machine"><i></i><span>worker 04</span></div>
  <div class="unknown">?</div>
</div>

<div class="callout compact"><span>The hard question</span><strong>Did it fail, or is it merely slow?</strong></div>

---
layout: section
---

<div class="eyebrow">The course lens</div>

# Three goals.<br>Permanent tension.

<div class="triangle">
  <div class="vertex top">fault tolerance</div>
  <div class="vertex left">consistency</div>
  <div class="vertex right">performance</div>
  <div class="triangle-core">communication</div>
</div>

<!--
Fault tolerance and consistency usually require communication. Communication is slow, can fail, and becomes
harder to scale. The course repeatedly studies systems that choose different points in this design space.
-->

---

# What does “correct” mean?

<div class="contract">
  <div class="operation"><span>write(x, 42)</span><small>client A</small></div>
  <div class="timeline"><i></i></div>
  <div class="operation result"><span>read(x) → 42</span><small>client B</small></div>
</div>

<div class="statement">
  General-purpose infrastructure needs a <strong>precise behavioral contract</strong>.
</div>

<div class="tradeoff-row">
  <div><span>Replication helps availability</span><b>+</b></div>
  <div><span>Keeping replicas identical costs communication</span><b>−</b></div>
  <div><span>Avoiding communication can expose stale data</span><b>?</b></div>
</div>

---
layout: section
---

<div class="eyebrow">Case study · MapReduce</div>

# Hide the machinery.<br>Constrain the program.

The programmer supplies two functions. The framework supplies distribution.

---
layout: center
class: text-center
---

<div class="eyebrow">The workload</div>

# Multi-terabyte data.<br>Multi-hour computation.<br><span class="accent-text">Thousands of machines.</span>

<div class="chip-row">
  <span>web indexing</span><span>sorting</span><span>log analysis</span><span>graph processing</span>
</div>

<div class="source">At this scale, machine failure is normal rather than exceptional.</div>

---

# The programming model

<div class="api-grid">
  <div class="api-card map-card">
    <span class="api-label">Map</span>
    <code>(k₁, v₁) → list(k₂, v₂)</code>
    <p>Transform one input record into intermediate key/value pairs.</p>
  </div>
  <div class="api-arrow">→</div>
  <div class="api-card reduce-card">
    <span class="api-label">Reduce</span>
    <code>(k₂, list(v₂)) → list(v₃)</code>
    <p>Combine every intermediate value associated with one key.</p>
  </div>
</div>

```text
map    (String key, String value) -> list(String key, String value)
reduce (String key, Iterator values) -> list(String value)
```

<div class="source">The original implementation exposed these operations through a C++ library.</div>

---
layout: two-cols-header
---

# Word count in six lines

The application is sequential. Parallel execution is the framework's job.

::left::

```python {1-3|5-6|all}
def map(document):
    for word in words(document):
        emit(word, 1)

def reduce(word, counts):
    emit(word, sum(counts))
```

::right::

<div class="word-demo">
  <div><small>input A</small><span>to be or</span></div>
  <div><small>input B</small><span>not to be</span></div>
  <div class="word-result"><small>output</small><span>be 2 · not 1 · or 1 · to 2</span></div>
</div>

<div class="callout compact"><span>The abstraction</span><strong>Same key, same reducer.</strong></div>

---

# From records to results

<div class="pipeline" aria-label="MapReduce data flow">
  <div class="stage input-stage"><small>GFS</small><strong>input splits</strong><span>M pieces</span></div>
  <div class="pipe-arrow">→</div>
  <div class="stage map-stage"><small>parallel</small><strong>map</strong><span>M tasks</span></div>
  <div class="pipe-arrow">→</div>
  <div class="stage shuffle-stage"><small>network</small><strong>shuffle + sort</strong><span>group by key</span></div>
  <div class="pipe-arrow">→</div>
  <div class="stage reduce-stage"><small>parallel</small><strong>reduce</strong><span>R tasks</span></div>
  <div class="pipe-arrow">→</div>
  <div class="stage output-stage"><small>GFS</small><strong>output</strong><span>R files</span></div>
</div>

<div class="partition-strip">
  <span>partition = hash(intermediate key) mod R</span>
  <span>each reducer fetches its partition from every mapper</span>
</div>

<!--
Stress the shuffle. Map output is partitioned into R regions on local disk. A reducer fetches its region from
every map worker, sorts by key, and invokes Reduce once for each distinct key.
-->

---
layout: two-cols-header
---

# One coordinator owns the job

::left::

<div class="coordinator-diagram">
  <div class="coordinator"><small>master</small><strong>coordinator</strong><span>task state · worker state · locations</span></div>
  <div class="worker-row"><div>map</div><div>map</div><div>reduce</div></div>
</div>

::right::

<div class="numbered-flow">
  <div><b>1</b><strong>Assign</strong><span>idle workers receive map or reduce tasks</span></div>
  <div><b>2</b><strong>Track</strong><span>idle → in progress → completed</span></div>
  <div><b>3</b><strong>Publish</strong><span>map output locations reach reducers</span></div>
  <div><b>4</b><strong>Recover</strong><span>lost tasks are scheduled again</span></div>
</div>

<div class="source">The paper treats master failure as unlikely and aborts the job if it occurs.</div>

---

# Locality protects the network

<div class="locality-scene">
  <div class="rack">
    <small>worker + GFS replica</small>
    <div class="disk">64 MB split</div>
    <div class="local-arrow">local read ↑</div>
    <div class="map-box">map task</div>
  </div>
  <div class="versus">instead of</div>
  <div class="rack remote">
    <small>remote storage</small>
    <div class="disk">64 MB split</div>
    <div class="network-arrow">across switch →</div>
    <div class="map-box">map task</div>
  </div>
</div>

<div class="statement">Move <strong>computation to the data</strong> whenever possible.</div>

<div class="source">GFS stored 64 MB chunks with replication; the scheduler preferred a worker holding the input replica.</div>

---

# Fine-grained tasks balance uneven machines

<div class="schedule">
  <div class="schedule-row fast"><strong>fast worker</strong><i></i><i></i><i></i><i></i><i></i></div>
  <div class="schedule-row normal"><strong>worker</strong><i></i><i></i><i></i><i></i></div>
  <div class="schedule-row slow"><strong>slow worker</strong><i></i><i></i></div>
</div>

<div class="equation">tasks ≫ workers</div>

<div class="reason-grid three">
  <div><b>01</b><strong>Dynamic balance</strong><span>Fast workers naturally complete more tasks.</span></div>
  <div><b>02</b><strong>Cheap recovery</strong><span>Only unfinished pieces need another attempt.</span></div>
  <div><b>03</b><strong>Better locality</strong><span>The scheduler has more placement choices.</span></div>
</div>

---
layout: section
---

<div class="eyebrow">Fault tolerance</div>

# Re-execute work.<br>Do not repair machines.

The framework turns a worker crash into a scheduling event.

---
layout: two-cols-header
---

# What happens when a worker disappears?

::left::

<div class="failure-table">
  <div><strong>Map task</strong><span>Re-run it, even if previously complete.</span><small>Its output lived on the failed worker's local disk.</small></div>
  <div><strong>Reduce task</strong><span>Re-run only if incomplete.</span><small>Completed output already lives in replicated GFS.</small></div>
  <div><strong>Coordinator</strong><span>Abort in the original design.</span><small>A deliberate simplicity in the paper.</small></div>
</div>

::right::

<div class="retry-visual">
  <div class="attempt lost"><small>attempt 1</small><strong>map 17</strong><span>worker lost</span></div>
  <div class="retry-arrow">↻</div>
  <div class="attempt"><small>attempt 2</small><strong>map 17</strong><span>new worker</span></div>
</div>

<div class="callout compact"><span>Key property</span><strong>A task is replaceable.</strong></div>

---

# Re-execution needs a contract

<div class="determinism">
  <div class="same-input">same input</div>
  <div class="fork">↙ &nbsp; ↘</div>
  <div class="attempts"><span>attempt A</span><span>attempt B</span></div>
  <div class="join">↘ &nbsp; ↙</div>
  <div class="same-output">same output</div>
</div>

<div class="statement">Map and Reduce should behave like <strong>pure deterministic functions</strong>.</div>

<div class="constraint-row">
  <span>no hidden state</span><span>no external side effects</span><span>no random behavior</span>
</div>

<div class="source">For deterministic operators, distributed execution is equivalent to some sequential execution.</div>

---

# Duplicate work must still commit once

<div class="commit-flow">
  <div class="attempt"><small>worker A</small><strong>reduce 4</strong><span>temporary file A</span></div>
  <div class="attempt"><small>worker B</small><strong>reduce 4</strong><span>temporary file B</span></div>
  <div class="commit-arrow">atomic rename</div>
  <div class="final-file"><small>GFS</small><strong>part-00004</strong><span>one complete result</span></div>
</div>

<div class="statement">Retries are safe when output publication is <strong>atomic</strong>.</div>

<div class="source">The master accepts one completed map attempt; GFS rename ensures one complete reduce output becomes visible.</div>

---

# Stragglers decide the finish time

<div class="straggler-chart">
  <div class="bar"><span>task 1</span><i style="--w:74%"></i></div>
  <div class="bar"><span>task 2</span><i style="--w:79%"></i></div>
  <div class="bar"><span>task 3</span><i style="--w:76%"></i></div>
  <div class="bar slow-bar"><span>task 4</span><i style="--w:98%"></i><b>slow</b></div>
  <div class="backup"><span>backup copy</span><i></i><b>wins</b></div>
</div>

<div class="statement">Near completion, run backup copies. Accept the first result.</div>

<div class="metric-row">
  <div><strong>44%</strong><span>longer sort without backup tasks</span></div>
  <div><strong>5×</strong><span>longer worst-case sort in repeated runs</span></div>
</div>

<div class="source">Paper §3.6 and §5.4: 891 s with backup tasks versus 1,283 s without.</div>

---
layout: two-cols-header
---

# Where does the time go?

::left::

<div class="bandwidth-stack">
  <div class="band local"><span>local map reads</span><strong>usually avoid network</strong></div>
  <div class="band network"><span>shuffle</span><strong>crosses the network once</strong></div>
  <div class="band replicated"><span>reduce output</span><strong>written to replicated GFS</strong></div>
</div>

::right::

<div class="paper-cluster">
  <div><strong>1,800</strong><span>machines</span></div>
  <div><strong>2 GHz</strong><span>dual-processor x86</span></div>
  <div><strong>4 GB</strong><span>memory per machine</span></div>
  <div><strong>100–200 Gb/s</strong><span>root bandwidth</span></div>
</div>

<div class="callout compact"><span>2004 bottleneck</span><strong>The network, especially all-to-all shuffle traffic.</strong></div>

---

# The paper's experiment

<div class="experiment-grid">
  <div class="experiment-card">
    <small>distributed grep</small>
    <strong>1 TB input</strong>
    <div class="spark"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <span>peak aggregate read rate ≈ 30 GB/s</span>
  </div>
  <div class="experiment-card">
    <small>distributed sort</small>
    <strong>1 TB input</strong>
    <div class="sort-phases"><span>map</span><span>shuffle</span><span>reduce</span></div>
    <span>1,764 workers · 891 seconds</span>
  </div>
</div>

<div class="source">Figure 2 demonstrates scale, but also startup cost, network limits, and the long tail.</div>

---

# What the framework hides

<div class="hide-grid">
  <div><b>01</b><strong>Placement</strong><span>Send code toward input replicas.</span></div>
  <div><b>02</b><strong>Parallelism</strong><span>Execute independent tasks concurrently.</span></div>
  <div><b>03</b><strong>Shuffle</strong><span>Partition, transfer, merge, and sort.</span></div>
  <div><b>04</b><strong>Scheduling</strong><span>Balance heterogeneous workers.</span></div>
  <div><b>05</b><strong>Recovery</strong><span>Detect loss and re-execute tasks.</span></div>
  <div><b>06</b><strong>Commit</strong><span>Publish one complete output per reducer.</span></div>
</div>

<div class="statement">A narrow interface buys a large implementation envelope.</div>

---

# The abstraction is powerful because it is narrow

<div class="boundary-grid">
  <div class="can">
    <small>fits well</small>
    <strong>Batch data parallelism</strong>
    <span>independent map work</span>
    <span>grouping by key</span>
    <span>deterministic recomputation</span>
  </div>
  <div class="cannot">
    <small>does not fit</small>
    <strong>General distributed programs</strong>
    <span>low-latency streaming</span>
    <span>interactive state</span>
    <span>arbitrary communication</span>
  </div>
</div>

<div class="source">MapReduce trades expressive power for automatic parallelism, locality, and recovery.</div>

---
layout: section
---

<div class="eyebrow">The larger lesson</div>

# Restriction is a systems tool.

Constrain application behavior, and the infrastructure can do more on its behalf.

---

# MapReduce previews the whole course

<div class="course-grid">
  <div><small>communication</small><strong>RPC + shuffle</strong><span>Data and control move among machines.</span></div>
  <div><small>fault tolerance</small><strong>Re-execution</strong><span>Replicated input and replaceable tasks mask crashes.</span></div>
  <div><small>consistency</small><strong>Atomic output</strong><span>Determinism and commit rules define results.</span></div>
  <div><small>performance</small><strong>Locality + balance</strong><span>Placement and task granularity drive throughput.</span></div>
</div>

<div class="statement">The implementation is a set of tradeoffs, not magic.</div>

---
layout: center
class: text-center
---

<div class="eyebrow">Takeaways</div>

# Make failure ordinary.<br><span class="accent-text">Make the contract precise.</span>

<div class="takeaway-row">
  <span>parallelize independent work</span>
  <span>move work toward data</span>
  <span>retry deterministic tasks</span>
  <span>commit output atomically</span>
</div>

---
layout: center
class: text-center
---

<div class="eyebrow">Read next</div>

# Go, threads, and RPC

<div class="reference-list">
  <a href="https://pdos.csail.mit.edu/6.5840/notes/l01.txt">6.5840 Lecture 1 notes</a>
  <a href="https://pdos.csail.mit.edu/6.5840/papers/mapreduce.pdf">MapReduce: Simplified Data Processing on Large Clusters</a>
  <a href="https://pdos.csail.mit.edu/6.5840/">MIT 6.5840 course site</a>
</div>

<div class="footer-note centered">Dean & Ghemawat · OSDI 2004 · MIT 6.5840 Lecture 1</div>
