---
skill: ExperienceGraph
category: discovery
purpose: Represent each experience across nine analytic facets and link experiences into a typed graph.
reads: [ExperienceDatabase]
writes: [ExperienceGraph]
preconditions: [ExperienceDatabase exists and is not thin]
postconditions: [every ExperienceDatabase entry has a node with all nine facets, and inter-node edges are typed and justified]
idempotency_key: each node upserted by the experience's stable id; edges keyed by (from,to,type); source_hashes track ExperienceDatabase; re-run on unchanged input is a no-op
asks_questions: false
---

# ExperienceGraph (discovery)

The analyst that turns raw experiences into structured, connected knowledge. Each experience becomes a
**node** decomposed across nine facets, and experiences are **linked** by typed edges so the system can
see arcs, causes, and recurring threads — not just a flat list of anecdotes. This graph is what
ThemeDiscovery mines for evidenced patterns and what the architecture phase walks to build a narrative.
It **adds structure to** the applicant's experiences; it never adds new experiences. If a facet has no
basis in the raw entry, it is left empty, not invented.

## When to run

After `ExperienceDatabase` is grounded (and ideally after `ApplicantModel`, which can inform facet
reading), or whenever `ExperienceGraph` is `missing`/`thin`/`stale`. Stale the moment
`ExperienceDatabase`'s hash diverges from the recorded `source_hashes`.

## The Loop

**OBSERVE** — Read every `ExperienceDatabase` entry and the existing `ExperienceGraph.md`. Capture the
current `ExperienceDatabase` hash.

**ANALYZE** — Find the gap: experiences with no node, nodes missing facets, or nodes **stale** because
their source experience changed. Also find missing/justified edges between nodes.

**PLAN** — Smallest unit: **one node** (decompose one experience across the nine facets) or **one
edge** (link two existing nodes). One per pass.

**EXECUTE** — For a node, fill the **nine facets**, each grounded in the raw entry:

1. **Context** — the situation: where, when, who, the stakes
2. **Conflict** — the tension, obstacle, or decision that made it matter
3. **Actions** — what the applicant specifically did (their verbs, not the group's)
4. **Outcomes** — what concretely resulted
5. **Reflection** — what it made the applicant think/feel; meaning, not just events
6. **Lessons** — the transferable takeaway they drew
7. **Themes** — candidate threads this scene touches (hypotheses for ThemeDiscovery, not yet asserted)
8. **Identity Signals** — what this reveals about who they are (ties to ApplicantModel facets)
9. **Future Implications** — what it predicts about the physician they are becoming

For an edge, connect two nodes with a typed, justified relationship:

- **shares-theme** — both nodes surface the same candidate thread (the raw material ThemeDiscovery
  later validates as a real, ≥2-experience theme)
- **causal** — one experience caused or enabled another (A → B)
- **temporal** — strict before/after ordering in the applicant's timeline
- **growth-arc** — a before/after pair showing change in the same dimension (weakness → strength)
- **contrast** — two experiences that illuminate each other by opposition

Every edge carries a one-line justification pointing at the facets that license it.

**VERIFY** — Run the assertions below. `assert timeline_consistent` rejects `temporal`/`causal` edges
that contradict the dates/sequence in the nodes; `assert claim_traceable` rejects any facet content
that is not grounded in the source experience. A failed assertion blocks UPDATE.

**LEARN** — Append a `RevisionHistory` entry for any edge rejected as inconsistent or any facet left
empty for lack of basis. Reusable structural insights go to `LessonsLearned`.

**UPDATE** — Upsert the node by the experience's stable `id`; upsert edges keyed by
`(from_id, to_id, type)`. Recompute `hash`, set `source_hashes: [exp:<ExperienceDatabase hash>]`, set
the `EssayState` row `last_skill: ExperienceGraph`, bump `updated`. When every experience has a
complete node and edges are drawn, set `next_skill: ThemeDiscovery`.

## Assertions

- `assert claim_traceable(facet)` — every facet's content is grounded in the source experience; no
  facet invents detail the applicant did not give.
- `assert timeline_consistent()` — temporal and causal edges agree with the dates/sequence recorded in
  the nodes; no contradictory ordering.

## Idempotency

Nodes are upserted by the experience's stable `id`; edges by `(from, to, type)` so the same link is
never duplicated. The artifact records `source_hashes: [exp:<hash>]`; if it still matches on OBSERVE,
the graph is already current — skip and report "no change." If `ExperienceDatabase` changed, only the
affected nodes/edges recompute. Identical input yields a byte-identical graph modulo `updated`.

## Output

```
NODES: <k>/<n> experiences decomposed (9 facets each)
EDGES: <k> typed (shares-theme <a>, causal <b>, temporal <c>, growth-arc <d>, contrast <e>)
CHECKS: claim_traceable pass|fail · timeline_consistent pass|fail
NEXT: ThemeDiscovery (graph complete) | GrillMe/ExperienceGraph (gaps)
```

## Gotchas

- **Nine facets, every node.** A node missing Reflection or Future Implications is thin — those two
  are exactly what separates an anecdote from essay-grade material.
- **Themes here are candidates, not verdicts.** Facet 7 lists hypotheses; only ThemeDiscovery may
  assert a theme, and only with ≥2 distinct experiences behind it.
- **Edges must be justified and consistent.** A `causal` edge that contradicts the timeline is a bug;
  let `timeline_consistent` catch it rather than asserting the link by vibe.
- **Structure only — no new experiences.** If a facet has no basis in the raw entry, leave it empty
  and let `GrillMe` elicit it. Never backfill with plausible invention.
