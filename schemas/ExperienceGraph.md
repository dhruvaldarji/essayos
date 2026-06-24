---
schema: ExperienceGraph
version: 1.0.0
purpose: The interpreted layer over raw experiences — each experience decomposed into 9 facets, with typed edges between them.
machine_readable: true
location: artifacts/<essay_id>/ExperienceGraph.md
---

# Schema: ExperienceGraph

`ExperienceGraph` turns raw `ExperienceDatabase` records into analyzed **nodes** (one per experience,
each broken into 9 facets) connected by typed **edges**. It is what `ThemeGraph` mines for themes and
what `assert theme_supported()` counts against (a theme needs ≥2 distinct experience nodes). Together
with `ThemeGraph` it forms the `MemoryGraph` union view.

## Front matter

```yaml
---
id: experience-graph
hash: <short content hash>
source_hashes: [ExperienceDatabase:<hash>]
updated: <ISO-8601>
---
```

## Body structure

### Nodes

One node per experience `id` (matching an `ExperienceDatabase` id). The 9 facets are fixed:

```markdown
## Nodes

- id: exp-1                        # same id as the ExperienceDatabase record it interprets
  context: <the situation/setting>
  conflict: <the tension, stakes, or obstacle>
  actions: <what the applicant specifically did>
  outcomes: <what resulted, concretely>
  reflection: <what the applicant made of it — insight, not narration>
  lessons: <what it taught them>
  themes: [<theme id>, ...]        # links into ThemeGraph
  identity_signals: <what it reveals about who they are>
  future_implications: <how it shapes the physician they will be>
```

### Edges

Typed, directed relations between nodes:

```markdown
## Edges

- id: edge-1
  from: exp-1
  to: exp-4
  type: shares-theme | causal | temporal | growth-arc | contrast
  note: <why this edge exists>
```

- **edge.type** ∈ `shares-theme | causal | temporal | growth-arc | contrast`.
  - `shares-theme` — both nodes feed the same theme.
  - `causal` — one experience led to another.
  - `temporal` — ordering in time (feeds `assert timeline_consistent()`).
  - `growth-arc` — earlier→later showing development.
  - `contrast` — they oppose, useful for tension.

## Idempotency rules

- Nodes upsert by experience `id`; edges upsert by `id` (`edge-N`).
- `source_hashes: [ExperienceDatabase:<hash>]`; if a raw experience changes, the node goes `stale`.
- A node must exist for every experience referenced by a theme; orphan theme links fail
  `assert theme_supported()`.

## Example (abbreviated)

```markdown
---
id: experience-graph
hash: 7788
source_hashes: [ExperienceDatabase:e5f6]
updated: 2026-06-23T00:12:00Z
---

## Nodes

- id: exp-1
  context: 3am ED shift, no Spanish-speaking staff
  conflict: confused patient could not communicate his symptoms
  actions: stayed past handoff, translated by phone until family arrived
  outcomes: patient stabilized, daughter could give history
  reflection: realized advocacy is often just refusing to leave
  lessons: presence is a clinical act
  themes: [theme-1]
  identity_signals: meets people where they are
  future_implications: wants continuity-of-care relationships

## Edges

- id: edge-1
  from: exp-1
  to: exp-4
  type: shares-theme
  note: both show advocacy under constraint
```
