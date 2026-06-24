---
skill: MemoryGraph
category: meta
purpose: Maintain the unified relationship view over the experience graph and the theme graph — one navigable map of how the applicant's experiences, themes, and the links between them connect.
reads: [EssayState, ExperienceGraph, ThemeGraph]
writes: [MemoryGraph]
preconditions: [ExperienceGraph exists OR ThemeGraph exists]
postconditions: [MemoryGraph holds the union of experience nodes, theme nodes, and their cross-links, with each link sourced to its origin graph]
idempotency_key: each node/edge upserted by stable id (origin_graph + node_id / edge endpoints); re-run on unchanged ExperienceGraph + ThemeGraph is a no-op
asks_questions: false
---

# MemoryGraph (meta)

Experiences and themes are tracked in two separate graphs, but the essay is written from how they
*connect* — which experiences support which themes, which themes share experiences, which experiences sit
isolated with no theme to carry them. MemoryGraph is the union view: a single map that overlays
`ExperienceGraph` and `ThemeGraph` and makes their cross-links navigable. It is the substrate other meta
skills query — `ClaimEvidenceMapper` traces claims through it, `Counterfactuals` reframes over it, the
AssertionEngine counts theme support against it. It derives; it never invents nodes or links not present
in its sources.

## When to run

After `ExperienceGraph` or `ThemeDiscovery` writes or updates its graph, so the union stays current. Run
before any skill that needs to reason over experience-theme relationships (claim tracing, theme-support
counting, reframing). Re-run whenever either source graph changes — staleness here silently corrupts every
downstream support count.

## What the union holds

| Element | Origin | Meaning |
|---------|--------|---------|
| **Experience node** | ExperienceGraph | a real, elicited experience with its id and provenance |
| **Theme node** | ThemeGraph | a candidate essay theme |
| **supports edge** | both | experience → theme: this experience is evidence for this theme |
| **shares edge** | derived | theme ↔ theme: two themes drawing on overlapping experiences |
| **isolated node** | derived | an experience supporting no theme, or a theme supported by none |

Every node and edge carries its origin graph and source hash, so the union is fully traceable and never
becomes an independent source of truth.

## The Loop

**OBSERVE** — Read `EssayState.md`, `ExperienceGraph.md`, and `ThemeGraph.md`. Read the existing
`MemoryGraph.md` if present, and `LessonsLearned` for graph-hygiene rules.

**ANALYZE** — Compare the union's `source_hashes` to the current `ExperienceGraph` and `ThemeGraph` hashes.
If both match, the union is current — skip. Otherwise, diff: which nodes/edges are new, changed, or removed
in the sources since the union was last built.

**PLAN** — Choose the next batch of source changes to fold in. One source graph's delta per loop
(experience-side or theme-side), so provenance stays clean.

**EXECUTE** — Fold the delta into the union: add/update experience and theme nodes by id, recompute the
`supports` edges from the source links, derive the `shares` edges (themes with overlapping supporting
experiences) and the `isolated` nodes (zero-degree experiences and themes). Carry each element's origin and
source hash.

**VERIFY** — Run the assertions below via `kernel/AssertionEngine`. Every theme node's support count must
match what `theme_supported` would compute; every node must trace to a real source — a node with no origin
is a corruption and is rejected.

**LEARN** — Append a `RevisionHistory` entry when the union surfaces a structural fact worth acting on
(e.g. an isolated experience that could anchor an under-supported theme, or a theme that just fell below 2
supports). Recurring structural patterns become `LessonsLearned`.

**UPDATE** — Upsert nodes and edges into `MemoryGraph` by stable id (origin_graph + node_id, or edge
endpoints). Remove union elements whose source elements were deleted. Recompute `hash`, set
`source_hashes` to the current source-graph hashes, update the `EssayState` row, bump `updated`.

## Assertions

- `assert theme_supported(theme)` — every theme node in the union reports a support count consistent with
  its supporting-experience edges. On fail, the diagnostic names the theme and the count mismatch.
- `assert evidence_exists(claim)` — the union's edges must point at real experiences; a `supports` edge to
  a non-existent experience id is invalid. On fail, the diagnostic names the dangling edge.
- `assert timeline_consistent()` — experience nodes carry their temporal markers into the union without
  contradiction. On fail, the diagnostic quotes the conflicting markers.

## Idempotency

Each node and edge is upserted by stable id; re-running on unchanged source graphs reproduces a
byte-identical union (modulo `updated`). When a source changes, only its delta is folded in and removed
elements are pruned — the union never accumulates orphans. Identical sources ⇒ identical MemoryGraph.

## Output

```
MEMORY GRAPH: <n> experience nodes · <n> theme nodes · <n> supports edges · <n> shares edges
ISOLATED: <n> experiences (no theme) · <n> themes (no evidence)
UNDER-SUPPORTED THEMES: <n> (< 2 experiences) — <names>
ASSERTIONS: theme_supported <p|f> · evidence_exists <p|f> · timeline_consistent <p|f>
NEXT: ThemeDiscovery (rescue under-supported) | downstream skill (union current)
```

## Gotchas

- **The union is a view, never a source.** It only ever reflects `ExperienceGraph` and `ThemeGraph`; it
  must never hold a node or link that doesn't exist in one of them.
- **Stale union = wrong support counts everywhere.** Every downstream `theme_supported` check trusts this
  graph; rebuild it the moment either source changes, before anything queries it.
- **Prune, don't accumulate.** When a source node is deleted, remove its union element and its edges — a
  lingering orphan reports phantom support.
- **Isolated nodes are findings, not noise.** An experience supporting no theme is wasted material; a theme
  supported by none is a fabrication risk. Surface both.
- **Carry provenance on every element.** Each node/edge names its origin graph and source hash, so the
  whole union stays traceable and re-verifiable.
