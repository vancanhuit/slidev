---
theme: default
title: Presentation title
layout: cover
info: |
  A reusable presentation starter.
author: Your team
transition: slide-left
mdc: true
fonts:
  sans: Inter
  mono: JetBrains Mono
---

<div class="eyebrow">Your team · 2026</div>

# Presentation title

A concise statement of what the audience will learn.

<div class="accent-line" />

<div class="footer-note">Presenter name · Event or meeting</div>

<!--
Introduce the topic and set expectations.
-->

---
layout: section
---

<div class="eyebrow">01 · Context</div>

# Start with the problem

Make the reason for this presentation clear before showing the solution.

---
layout: two-cols-header
---

# Keep each slide focused

One idea per slide makes the story easier to follow.

::left::

## What matters

- Lead with the conclusion
- Prefer evidence over decoration
- Use progressive disclosure when useful

::right::

<div class="callout">
  <div class="callout-label">Key point</div>
  <div class="callout-value">Clarity beats density.</div>
</div>

---

# Code and technical detail

```ts {1|3-5|all}
type Result = { value: string }

export async function load(): Promise<Result> {
  const value = await fetchData()
  return { value }
}
```

<div class="source">Use highlights to direct attention, not to animate every line.</div>

---
layout: fact
---

# 3×

The one number the audience should remember

---
layout: center
class: text-center
---

<div class="eyebrow">Next step</div>

# What should happen now?

End with one clear action.

<div class="accent-line mx-auto" />
