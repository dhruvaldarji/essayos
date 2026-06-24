---
schema: ThemeGraph
version: 1.0.0
purpose: The candidate themes — each a claim-shaped statement (never an adjective) backed by ≥2 experiences.
machine_readable: true
location: artifacts/<essay_id>/ThemeGraph.md
---

# Schema: ThemeGraph

`ThemeGraph` holds the themes mined from `ExperienceGraph`. A theme is a **statement**, not an
adjective: "I do my best work by refusing to leave people alone in hard moments," not "compassionate."
Each theme must be backed by **≥2 distinct experiences** — this is exactly what
`assert theme_supported(theme)` counts (`ExperienceGraph` nodes linked to the theme). It feeds
`MessageMap` (which theme becomes the core message) and forms `MemoryGraph` with `ExperienceGraph`.

## Front matter

```yaml
---
id: theme-graph
hash: <short content hash>
source_hashes: [ExperienceGraph:<hash>]
updated: <ISO-8601>
---
```

## Body structure

```markdown
## Themes

- id: theme-1
  statement: <a sentence-shaped claim, NOT an adjective>
  supporting_experiences: [exp-1, exp-4]   # ≥2 distinct ExperienceGraph node ids
  strength: <float 0–1>                     # how well-supported + distinctive
  note: <optional — why this is essay-worthy>
```

- **statement** must be a claim, not a trait word. A bare adjective is a schema violation.
- **supporting_experiences** must list **≥2** distinct experience ids or the theme fails
  `assert theme_supported()`.
- **strength** ∈ `0–1` — combines evidence count, distinctiveness, and reflective depth; used to rank
  which theme becomes the core message.

## Idempotency rules

- Themes upsert by `id` (`theme-N`).
- `source_hashes: [ExperienceGraph:<hash>]`; if the experience graph changes, themes go `stale`.
- A theme with `< 2` supporting experiences is invalid and must not be promoted to `MessageMap`.

## Example (abbreviated)

```markdown
---
id: theme-graph
hash: 99aa
source_hashes: [ExperienceGraph:7788]
updated: 2026-06-23T00:15:00Z
---

## Themes

- id: theme-1
  statement: I treat presence as a clinical act, not a courtesy.
  supporting_experiences: [exp-1, exp-4]
  strength: 0.82
  note: distinctive, shown not told, recurs across settings
```
